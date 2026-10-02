from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class RecordTransactionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "transaction_id": "SSC-2026-000001",
                "record_hash": "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                "amount": 15000,
                "timestamp": "2026-09-30T10:00:00Z",
            }
        }
    )

    transaction_id: str = Field(..., min_length=1, max_length=120)
    record_hash: str = Field(..., min_length=6, max_length=130)
    amount: int = Field(..., gt=0, description="Amount in integer units/centavos")
    timestamp: str = Field(..., min_length=4, max_length=64)

    @field_validator("transaction_id")
    @classmethod
    def validate_transaction_id(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("transaction_id must not be empty")
        return cleaned

    @field_validator("record_hash")
    @classmethod
    def validate_record_hash(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("record_hash must not be empty")
        return cleaned


class RecordTransactionResponse(BaseModel):
    success: bool = True
    transaction_id: str
    record_hash: str
    transaction_hash: str
    contract_address: str
    network: str = "localhost"
    block_number: Optional[int] = None
    status: str = "confirmed"
    idempotent_replay: bool = False


class VerifyTransactionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "transaction_id": "SSC-2026-000001",
                "record_hash": "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                "transaction_hash": "0x3c5f9b4d8e7a6c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b",
            }
        }
    )

    transaction_id: str = Field(..., min_length=1, max_length=120)
    record_hash: str = Field(..., min_length=6, max_length=130)
    transaction_hash: Optional[str] = None


class VerifyTransactionResponse(BaseModel):
    verified: bool
    record_hash_matches: bool
    transaction_confirmed: bool
    block_number: Optional[int] = None
    transaction_hash: Optional[str] = None
    contract_address: Optional[str] = None
    record_hash: str
    on_chain_record_hash: Optional[str] = None
