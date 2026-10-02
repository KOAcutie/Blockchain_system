import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict


class HashingService:
    """Deterministic SHA-256 hashing and bytes32 normalization for SSC transaction records."""

    @staticmethod
    def compute_canonical_record_hash(payload: Dict[str, Any]) -> str:
        """Compute deterministic 0x-prefixed SHA-256 digest from canonical non-PII fields."""
        canonical = {
            "amount": str(payload.get("amount", "")),
            "timestamp": str(payload.get("timestamp", "")),
            "transaction_id": str(payload.get("transaction_id", "")),
        }
        serialized = json.dumps(canonical, sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        return f"0x{digest}"

    @staticmethod
    def normalize_record_hash_bytes32(record_hash: str) -> bytes:
        """Convert a hex SHA-256 string (with or without 0x) into 32 raw bytes."""
        cleaned = record_hash.strip()
        if cleaned.startswith(("0x", "0X")):
            cleaned = cleaned[2:]

        if len(cleaned) == 64:
            try:
                return bytes.fromhex(cleaned)
            except ValueError:
                pass

        # If caller supplied a non-hex string, hash it deterministically with SHA-256
        return hashlib.sha256(record_hash.strip().encode("utf-8")).digest()

    @staticmethod
    def normalize_record_hash_hex(record_hash: str) -> str:
        """Return 0x-prefixed 64-character lowercase hex representation of record_hash."""
        raw = HashingService.normalize_record_hash_bytes32(record_hash)
        return "0x" + raw.hex()

    @staticmethod
    def transaction_id_to_bytes32(transaction_id: str) -> bytes:
        """Map application transaction_id (e.g. SSC-2026-000001) to a deterministic bytes32 key."""
        return hashlib.sha256(transaction_id.strip().encode("utf-8")).digest()

    @staticmethod
    def parse_timestamp_to_unix(timestamp_str: str) -> int:
        """Convert ISO-8601 timestamp or numeric string to a positive integer unix epoch."""
        cleaned = timestamp_str.strip()
        if cleaned.isdigit():
            return int(cleaned)
        try:
            if cleaned.endswith("Z"):
                cleaned = cleaned[:-1] + "+00:00"
            dt = datetime.fromisoformat(cleaned)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return max(int(dt.timestamp()), 1)
        except Exception:
            return int(datetime.now(timezone.utc).timestamp())
