# SSC Transparency — Python FastAPI Blockchain Service (`/blockchain-api`)

Internal microservice built with **Python 3.12**, **FastAPI**, **Pydantic v2**, and **Web3.py**.

## Responsibilities
- Enforces `X-Service-Key` authentication so only the Laravel backend can invoke blockchain write/verify operations
- Computes canonical SHA-256 `record_hash` from `{transaction_id, fee_id, amount, timestamp}`
- Signs and broadcasts `recordTransaction(...)` calls to the `SSCTransparency` smart contract via Web3.py
- Reads on-chain records via `getTransaction(transactionId)` and verifies `record_hash` integrity

## Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service & RPC connection health check |
| `POST` | `/api/blockchain/transactions` | `X-Service-Key` | Hash and record a verified transaction on-chain |
| `GET` | `/api/blockchain/transactions/{hash}` | `X-Service-Key` | Inspect blockchain transaction receipt & confirmations |
| `POST` | `/api/blockchain/verify` | `X-Service-Key` | Recompute SHA-256 hash and verify against smart contract storage |
| `GET` | `/api/blockchain/network` | `X-Service-Key` | Inspect chain ID, latest block number, and contract address |

## Setup & Commands

```powershell
cd blockchain-api
pip install -r requirements.txt
cp .env.example .env
```

### Run FastAPI Server
```powershell
uvicorn app.main:app --reload --port 8001
```

### Run Pytest Suite
```powershell
python -m pytest -v
```
