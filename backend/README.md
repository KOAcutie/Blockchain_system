# SSC Transparency — Laravel Primary Backend (`/backend`)

Primary REST API backend built with **Laravel 11**, **Laravel Sanctum**, and **Eloquent ORM**.

## Responsibilities
- Authentication (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`)
- Role-based access control (`student`, `officer`, `admin`) via `RoleMiddleware` and Policies (`FeePolicy`, `PaymentPolicy`, `FundUsagePolicy`)
- Fee Schedule Management & Student Fee Assignments
- Student Payment Recording & Officer Payment Verification
- Official Digital Receipt Generation (`SSC-RCP-YYYY-XXXXX`)
- Internal REST communication with Python FastAPI Blockchain Service (`BlockchainService`)
- Public Financial Transparency Aggregation & Officer Financial Reports
- Immutable Audit Logging (`AuditLogService`)

## Setup & Commands

```powershell
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
```

### Run Development Server
```powershell
php artisan serve --port=8000
```

### Run Feature & Integration Tests
```powershell
php artisan test
```

## Key Environment Variables (`backend/.env`)

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
BLOCKCHAIN_SERVICE_URL=http://localhost:8001
BLOCKCHAIN_SERVICE_KEY=ssc-internal-service-secret-2026
```
