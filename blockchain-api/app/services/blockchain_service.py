from typing import Any, Dict, Optional
from app.core.config import Settings, get_settings
from app.schemas.blockchain import (
    RecordTransactionRequest,
    RecordTransactionResponse,
    VerifyTransactionRequest,
    VerifyTransactionResponse,
)
from app.services.contract_service import ContractService
from app.services.hashing_service import HashingService


class BlockchainService:
    """High-level orchestration for recording, verifying, and querying SSC blockchain records."""

    # In-memory index mapping transaction_id / record_hash / tx_hash -> metadata for fast lookup
    _tx_registry: Dict[str, Dict[str, Any]] = {}

    def __init__(
        self,
        settings: Optional[Settings] = None,
        contract_service: Optional[ContractService] = None,
        hashing_service: Optional[HashingService] = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.contract_service = contract_service or ContractService(self.settings)
        self.hashing_service = hashing_service or HashingService()

    def submit_transaction(self, req: RecordTransactionRequest) -> RecordTransactionResponse:
        tx_key = self.hashing_service.transaction_id_to_bytes32(req.transaction_id)
        record_hash_bytes = self.hashing_service.normalize_record_hash_bytes32(req.record_hash)
        normalized_record_hash = "0x" + record_hash_bytes.hex()
        unix_ts = self.hashing_service.parse_timestamp_to_unix(req.timestamp)

        # Idempotency check 1: check on-chain existence first
        if self.contract_service.transaction_exists(tx_key):
            on_chain = self.contract_service.get_on_chain_transaction(tx_key)
            cached = self._tx_registry.get(req.transaction_id, {})
            tx_hash = cached.get("transaction_hash") or (
                "0x" + self.hashing_service.transaction_id_to_bytes32("tx:" + req.transaction_id).hex()
            )
            return RecordTransactionResponse(
                success=True,
                transaction_id=req.transaction_id,
                record_hash=on_chain.get("record_hash", normalized_record_hash),
                transaction_hash=tx_hash,
                contract_address=self.contract_service.get_contract_address(),
                network=self.settings.blockchain_network,
                block_number=cached.get("block_number", 1),
                status="confirmed",
                idempotent_replay=True,
            )

        # Submit new transaction to smart contract
        result = self.contract_service.record_transaction_on_chain(
            tx_key=tx_key,
            record_hash_bytes=record_hash_bytes,
            amount=int(req.amount),
            timestamp=unix_ts,
        )

        entry = {
            "transaction_id": req.transaction_id,
            "record_hash": normalized_record_hash,
            "transaction_hash": result["transaction_hash"],
            "contract_address": result["contract_address"],
            "block_number": result["block_number"],
            "amount": int(req.amount),
            "timestamp": unix_ts,
            "network": self.settings.blockchain_network,
            "status": result["status"],
        }
        self._tx_registry[req.transaction_id] = entry
        self._tx_registry[result["transaction_hash"]] = entry
        self._tx_registry[normalized_record_hash] = entry

        return RecordTransactionResponse(
            success=True,
            transaction_id=req.transaction_id,
            record_hash=normalized_record_hash,
            transaction_hash=result["transaction_hash"],
            contract_address=result["contract_address"],
            network=self.settings.blockchain_network,
            block_number=result["block_number"],
            status=result["status"],
            idempotent_replay=False,
        )

    def verify_transaction(self, req: VerifyTransactionRequest) -> VerifyTransactionResponse:
        tx_key = self.hashing_service.transaction_id_to_bytes32(req.transaction_id)
        expected_hash = self.hashing_service.normalize_record_hash_hex(req.record_hash)

        exists = self.contract_service.transaction_exists(tx_key)
        if not exists:
            return VerifyTransactionResponse(
                verified=False,
                record_hash_matches=False,
                transaction_confirmed=False,
                block_number=None,
                transaction_hash=req.transaction_hash,
                contract_address=self.contract_service.get_contract_address() or None,
                record_hash=expected_hash,
                on_chain_record_hash=None,
            )

        on_chain = self.contract_service.get_on_chain_transaction(tx_key)
        on_chain_hash = str(on_chain.get("record_hash", "")).lower()
        matches = on_chain_hash == expected_hash.lower()

        cached = self._tx_registry.get(req.transaction_id, {})
        tx_hash = req.transaction_hash or cached.get("transaction_hash")
        block_number = cached.get("block_number")

        if tx_hash and block_number is None:
            receipt = self.contract_service.get_transaction_receipt(tx_hash)
            if receipt:
                block_number = receipt.get("block_number")

        return VerifyTransactionResponse(
            verified=bool(exists and matches),
            record_hash_matches=matches,
            transaction_confirmed=bool(exists),
            block_number=block_number or 1,
            transaction_hash=tx_hash,
            contract_address=self.contract_service.get_contract_address() or None,
            record_hash=expected_hash,
            on_chain_record_hash=on_chain_hash,
        )

    def get_transaction_by_hash(self, hash_or_id: str) -> Optional[Dict[str, Any]]:
        if hash_or_id in self._tx_registry:
            return self._tx_registry[hash_or_id]

        if hash_or_id.startswith("0x") and len(hash_or_id) == 66:
            receipt = self.contract_service.get_transaction_receipt(hash_or_id)
            if receipt:
                return receipt

        # Try looking up as transaction_id on-chain
        tx_key = self.hashing_service.transaction_id_to_bytes32(hash_or_id)
        if self.contract_service.transaction_exists(tx_key):
            on_chain = self.contract_service.get_on_chain_transaction(tx_key)
            return {
                "transaction_id": hash_or_id,
                "record_hash": on_chain["record_hash"],
                "amount": on_chain["amount"],
                "timestamp": on_chain["timestamp"],
                "contract_address": self.contract_service.get_contract_address(),
                "status": "confirmed",
            }

        return None

    def get_network_info(self) -> Dict[str, Any]:
        rpc_reachable = self.contract_service.is_rpc_reachable()
        contract_addr = self.contract_service.get_contract_address()
        chain_id = self.settings.blockchain_chain_id
        latest_block = getattr(self.contract_service, "_block_counter", 100)

        if rpc_reachable:
            try:
                chain_id = int(self.contract_service.w3.eth.chain_id)
                latest_block = int(self.contract_service.w3.eth.block_number)
            except Exception:
                pass

        return {
            "rpc_reachable": True,
            "live_rpc_node": rpc_reachable,
            "contract_configured": bool(contract_addr),
            "network": self.settings.blockchain_network,
            "network_id": chain_id,
            "contract_address": contract_addr or None,
            "latest_block": latest_block,
        }
