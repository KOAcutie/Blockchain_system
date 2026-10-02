from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import verify_service_key
from app.schemas.blockchain import (
    RecordTransactionRequest,
    RecordTransactionResponse,
    VerifyTransactionRequest,
    VerifyTransactionResponse,
)
from app.services.blockchain_service import BlockchainService

router = APIRouter(
    prefix="/api/blockchain",
    tags=["blockchain"],
    dependencies=[Depends(verify_service_key)],
)


def get_blockchain_service() -> BlockchainService:
    return BlockchainService()


@router.post("/transactions", response_model=RecordTransactionResponse)
def record_transaction(
    payload: RecordTransactionRequest,
    service: BlockchainService = Depends(get_blockchain_service),
):
    try:
        return service.submit_transaction(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Blockchain submission error: {str(exc)}",
        ) from exc


@router.get("/transactions/{hash_or_id}")
def get_transaction(
    hash_or_id: str,
    service: BlockchainService = Depends(get_blockchain_service),
):
    try:
        record = service.get_transaction_by_hash(hash_or_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Blockchain lookup error: {str(exc)}",
        ) from exc

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction record not found on blockchain.",
        )

    return {
        "success": True,
        "data": record,
    }


@router.post("/verify", response_model=VerifyTransactionResponse)
def verify_transaction(
    payload: VerifyTransactionRequest,
    service: BlockchainService = Depends(get_blockchain_service),
):
    try:
        return service.verify_transaction(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Blockchain verification error: {str(exc)}",
        ) from exc


@router.get("/network")
def get_network(
    service: BlockchainService = Depends(get_blockchain_service),
):
    return service.get_network_info()
