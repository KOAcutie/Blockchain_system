import json
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    """Environment-driven configuration for the Python Blockchain Service."""

    def __init__(self) -> None:
        self.app_env: str = os.getenv("APP_ENV", "local")
        self.port: int = int(os.getenv("PORT", "8001"))
        self.blockchain_rpc_url: str = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
        self.blockchain_chain_id: int = int(os.getenv("BLOCKCHAIN_CHAIN_ID", "31337"))
        self.blockchain_private_key: str = os.getenv(
            "BLOCKCHAIN_PRIVATE_KEY",
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        )
        self.blockchain_network: str = os.getenv("BLOCKCHAIN_NETWORK", "sepolia")
        self._contract_address: str = os.getenv(
            "BLOCKCHAIN_CONTRACT_ADDRESS",
            "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856",
        )
        self.laravel_service_key: str = os.getenv(
            "LARAVEL_SERVICE_KEY",
            "ssc-internal-service-secret-2026",
        )
        self.abi_path: Path = BASE_DIR / "app" / "abi" / "SSCTransparency.json"
        self.deployment_artifact_path: Path = (
            BASE_DIR.parent / "contracts" / "deployments" / "localhost.json"
        )
        self.local_ledger_path: Path = BASE_DIR / "data" / "local_chain_ledger.json"

    @property
    def blockchain_contract_address(self) -> str:
        env_addr = os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS", "").strip() or self._contract_address.strip()
        if env_addr:
            return env_addr
        if self.deployment_artifact_path.exists():
            try:
                data = json.loads(self.deployment_artifact_path.read_text(encoding="utf-8"))
                return str(data.get("contractAddress", "")).strip()
            except Exception:
                return ""
        return "0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856"


def get_settings() -> Settings:
    return Settings()
