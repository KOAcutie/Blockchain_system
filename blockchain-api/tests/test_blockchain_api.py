from typing import Any, Dict, Optional
from fastapi.testclient import TestClient
from app.main import app
from app.api.routes.blockchain import get_blockchain_service as get_bc_route_service
from app.api.routes.health import get_blockchain_service as get_health_route_service
from app.core.config import Settings, get_settings
from app.services.blockchain_service import BlockchainService
from app.services.hashing_service import HashingService


class FakeContractService:
    """Mock Web3/Smart Contract service for unit and API testing without a live RPC node."""

    def __init__(self) -> None:
        self.store: Dict[bytes, Dict[str, Any]] = {}
        self.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    def is_rpc_reachable(self) -> bool:
        return True

    def get_contract_address(self) -> str:
        return self.contract_address

    def transaction_exists(self, tx_key: bytes) -> bool:
        return tx_key in self.store

    def get_on_chain_transaction(self, tx_key: bytes) -> Dict[str, Any]:
        rec = self.store[tx_key]
        return {
            "record_hash": rec["record_hash"],
            "amount": rec["amount"],
            "timestamp": rec["timestamp"],
            "exists": True,
        }

    def record_transaction_on_chain(
        self,
        tx_key: bytes,
        record_hash_bytes: bytes,
        amount: int,
        timestamp: int,
    ) -> Dict[str, Any]:
        record_hash_hex = "0x" + record_hash_bytes.hex()
        self.store[tx_key] = {
            "record_hash": record_hash_hex,
            "amount": amount,
            "timestamp": timestamp,
        }
        tx_hash = "0x" + HashingService.transaction_id_to_bytes32("chain-tx:" + record_hash_hex).hex()
        return {
            "transaction_hash": tx_hash,
            "block_number": 101,
            "contract_address": self.contract_address,
            "status": "confirmed",
        }

    def get_transaction_receipt(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        return {
            "transaction_hash": tx_hash,
            "block_number": 101,
            "status": "confirmed",
            "contract_address": self.contract_address,
        }


def make_test_client() -> TestClient:
    fake_settings = Settings()
    fake_settings.laravel_service_key = "test-service-secret"
    fake_contract = FakeContractService()
    BlockchainService._tx_registry = {}
    bc_service = BlockchainService(settings=fake_settings, contract_service=fake_contract)

    app.dependency_overrides[get_settings] = lambda: fake_settings
    app.dependency_overrides[get_bc_route_service] = lambda: bc_service
    app.dependency_overrides[get_health_route_service] = lambda: bc_service
    return TestClient(app)


def test_hashing_service_determinism():
    h1 = HashingService.compute_canonical_record_hash({
        "transaction_id": "SSC-2026-000001",
        "amount": 15000,
        "timestamp": "2026-09-30T10:00:00Z",
    })
    h2 = HashingService.compute_canonical_record_hash({
        "timestamp": "2026-09-30T10:00:00Z",
        "amount": 15000,
        "transaction_id": "SSC-2026-000001",
    })
    assert h1 == h2
    assert h1.startswith("0x")
    assert len(h1) == 66


def test_health_endpoint():
    client = make_test_client()
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["rpc_reachable"] is True
    assert body["contract_configured"] is True


def test_service_key_authentication_required():
    client = make_test_client()
    # Missing X-Service-Key fails with 401
    res = client.get("/api/blockchain/network")
    assert res.status_code == 401

    # Invalid X-Service-Key fails with 401
    res2 = client.get("/api/blockchain/network", headers={"X-Service-Key": "wrong-key"})
    assert res2.status_code == 401

    # Valid X-Service-Key succeeds
    res3 = client.get("/api/blockchain/network", headers={"X-Service-Key": "test-service-secret"})
    assert res3.status_code == 200


def test_record_verify_and_idempotency_flow():
    client = make_test_client()
    headers = {"X-Service-Key": "test-service-secret"}

    record_hash = "0x" + ("a1" * 32)
    payload = {
        "transaction_id": "SSC-2026-000001",
        "record_hash": record_hash,
        "amount": 15000,
        "timestamp": "2026-09-30T10:00:00Z",
    }

    # 1. Submit new transaction
    res = client.post("/api/blockchain/transactions", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == "confirmed"
    assert data["idempotent_replay"] is False
    tx_hash = data["transaction_hash"]

    # 2. Idempotent retry returns existing record without creating duplicate
    res_retry = client.post("/api/blockchain/transactions", json=payload, headers=headers)
    assert res_retry.status_code == 200
    assert res_retry.json()["idempotent_replay"] is True
    assert res_retry.json()["transaction_hash"] == tx_hash

    # 3. Verify matching record_hash returns verified = True
    verify_res = client.post(
        "/api/blockchain/verify",
        json={
            "transaction_id": "SSC-2026-000001",
            "record_hash": record_hash,
            "transaction_hash": tx_hash,
        },
        headers=headers,
    )
    assert verify_res.status_code == 200
    v_body = verify_res.json()
    assert v_body["verified"] is True
    assert v_body["record_hash_matches"] is True
    assert v_body["transaction_confirmed"] is True

    # 4. Verify mismatched record_hash returns verified = False
    tampered_hash = "0x" + ("b2" * 32)
    mismatch_res = client.post(
        "/api/blockchain/verify",
        json={
            "transaction_id": "SSC-2026-000001",
            "record_hash": tampered_hash,
            "transaction_hash": tx_hash,
        },
        headers=headers,
    )
    assert mismatch_res.status_code == 200
    assert mismatch_res.json()["verified"] is False
    assert mismatch_res.json()["record_hash_matches"] is False

    # 5. Lookup by transaction_hash works
    lookup_res = client.get(f"/api/blockchain/transactions/{tx_hash}", headers=headers)
    assert lookup_res.status_code == 200
    assert lookup_res.json()["data"]["transaction_id"] == "SSC-2026-000001"


def test_request_validation_rejects_invalid_amount():
    client = make_test_client()
    headers = {"X-Service-Key": "test-service-secret"}

    res = client.post(
        "/api/blockchain/transactions",
        json={
            "transaction_id": "SSC-2026-000099",
            "record_hash": "0x" + ("c3" * 32),
            "amount": 0,
            "timestamp": "2026-09-30T10:00:00Z",
        },
        headers=headers,
    )
    assert res.status_code == 422


def test_root_and_favicon_endpoints():
    client = make_test_client()
    root_res = client.get("/")
    assert root_res.status_code == 200
    assert root_res.json()["status"] == "ok"

    fav_res = client.get("/favicon.ico")
    assert fav_res.status_code == 204


def test_real_settings_and_swagger_docs_post_succeeds():
    app.dependency_overrides.clear()
    real_client = TestClient(app)

    # Simulate POST from Swagger UI (/docs) or with real LARAVEL_SERVICE_KEY
    payload = {
        "transaction_id": "SSC-2026-LIVE-001",
        "record_hash": "0x" + ("d4" * 32),
        "amount": 25000,
        "timestamp": "2026-09-30T12:00:00Z",
    }
    res = real_client.post(
        "/api/blockchain/transactions",
        json=payload,
        headers={"Referer": "http://127.0.0.1:8001/docs"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["status"] == "confirmed"
    assert body["transaction_hash"].startswith("0x")
