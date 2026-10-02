from fastapi import APIRouter, Depends
from app.services.blockchain_service import BlockchainService

router = APIRouter()


def get_blockchain_service() -> BlockchainService:
    return BlockchainService()


@router.get("/health")
def health_check(service: BlockchainService = Depends(get_blockchain_service)):
    net = service.get_network_info()
    return {
        "status": "ok",
        "service": "ssc-transparency-blockchain-api",
        "rpc_reachable": net["rpc_reachable"],
        "contract_configured": net["contract_configured"],
        "network_id": net["network_id"],
        "contract_address": net["contract_address"],
    }
