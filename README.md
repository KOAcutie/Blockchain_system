# SSC Transparency — Supreme Student Council Fee Collection & Blockchain Transparency System

**SSC Transparency** is a full-stack university student-government fee management, payment verification, digital receipt, and public financial transparency platform with cryptographic blockchain attestation.

---

## 1. Core Architecture

```text
                        ┌─────────────────────┐
                        │      Next.js        │
                        │      Frontend       │
                        │       (/web)        │
                        └──────────┬──────────┘
                                   │
                              REST / JSON
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │       Laravel       │
                        │    Main Backend     │
                        │     (/backend)      │
                        │                     │
                        │ • MVC Architecture  │
                        │ • Sanctum Auth      │
                        │ • Business Logic    │
                        │ • Database (ORM)    │
                        │ • Role Policies     │
                        │ • Financial Reports │
                        └──────────┬──────────┘
                                   │
                         Internal REST API
                          (X-Service-Key)
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   Python FastAPI    │
                        │ Blockchain Service  │
                        │  (/blockchain-api)  │
                        │                     │
                        │ • Web3.py           │
                        │ • Contract Calls    │
                        │ • SHA-256 Hashing   │
                        │ • Tx Verification   │
                        │ • Event Reading     │
                        └──────────┬──────────┘
                                   │
                                  RPC
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │  Blockchain Network │
                        │  Smart Contracts    │
                        │    (/contracts)     │
                        │                     │
                        │ • Hardhat / Sepolia │
                        │ • SSCTransparency   │
                        └─────────────────────┘
```

### Key Architectural Rules
1. **Frontend (`web/`) communicates ONLY with Laravel (`backend/`)** via `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.
2. **Laravel (`backend/`) owns** authentication, RBAC (`student`, `officer`, `admin`), fee management, payment recording, receipt generation, fund usage, transparency aggregation, reports, and audit logs.
3. **Python FastAPI (`blockchain-api/`) is an internal service** protected by `X-Service-Key` that hashes canonical transaction payloads (`SHA-256`), signs and submits transactions to `SSCTransparency.sol`, and verifies on-chain records.
4. **Zero Student PII on Blockchain**: Only `transactionId`, `recordHash`, `amount`, and `timestamp` are stored on-chain.
5. **Blockchain Failure Resilience**: If the blockchain node or Python service is offline, verified student payments and receipts remain `confirmed` in Laravel while the `blockchain_records` status is marked `pending` or `failed` for later retry (`POST /api/blockchain/transactions`).

---

## 2. Repository Structure

```text
blockchain_system/
├── web/                 # Next.js 14 App Router + TypeScript + Tailwind CSS (Matcha Theme)
├── backend/             # Laravel 11 Primary REST API + Sanctum + Eloquent ORM
├── blockchain-api/      # Python 3.12 FastAPI + Web3.py Internal Blockchain Service
├── contracts/           # Hardhat + Solidity 0.8.24 Smart Contract (SSCTransparency.sol)
├── docker-compose.yml   # Multi-container orchestration
├── .env.example         # Root environment variable template
└── README.md            # Project documentation
```

---

## 3. Quick Start (Local Development)

### Step 1 — Start Local Hardhat Blockchain & Deploy Smart Contract (`/contracts`)

```powershell
cd contracts
npm install
npx hardhat test
# Terminal 1: Start local Hardhat JSON-RPC node on http://127.0.0.1:8545
npx hardhat node

# Terminal 2: Deploy SSCTransparency.sol to localhost and sync ABI to blockchain-api
npx hardhat run scripts/deploy.js --network localhost
```

### Step 2 — Start Python FastAPI Blockchain Service (`/blockchain-api`)

```powershell
cd blockchain-api
pip install -r requirements.txt
pytest -v
uvicorn app.main:app --reload --port 8001
```

### Step 3 — Start Laravel Primary Backend (`/backend`)

```powershell
cd backend
composer install
php artisan migrate:fresh --seed
php artisan test
php artisan serve --port=8000
```

### Step 4 — Start Next.js Frontend (`/web`)

```powershell
cd web
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 4. Seeded Demo Accounts

| Role | Email | Password | Portal Route |
| :--- | :--- | :--- | :--- |
| **Student** | `student@example.test` | `password` | `/student/dashboard` |
| **SSC Officer** | `officer@example.test` | `password` | `/officer/dashboard` |
| **Administrator** | `admin@example.test` | `password` | `/officer/dashboard` |

---

## 5. Automated Test Suites

| Layer | Command | Coverage |
| :--- | :--- | :--- |
| **Smart Contract (`/contracts`)** | `npx hardhat test` | Deployment, authorized recording, unauthorized revert, duplicate revert, hash verification |
| **Python FastAPI (`/blockchain-api`)** | `python -m pytest -v` | `/health`, `X-Service-Key` security, SHA-256 hashing, contract recording, on-chain verification |
| **Laravel Backend (`/backend`)** | `php artisan test` | Auth, RBAC, Fee CRUD, Payment -> Verify -> Receipt -> Blockchain flow, Resilience when blockchain fails, Public Transparency privacy |
| **Next.js Frontend (`/web`)** | `npm run build` | TypeScript type checking & static/dynamic route compilation across all 18 routes |
