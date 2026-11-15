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
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
PYTHON_BLOCKCHAIN_API_URL=http://localhost:8001
PYTHON_BLOCKCHAIN_SERVICE_KEY=ssc-internal-service-secret-2026
```

## Deploy to Vercel

The backend has its own Vercel project configuration in `backend/vercel.json`.
It uses the community `vercel-php@0.7.4` runtime (PHP 8.3), which installs the
production Composer dependencies from `composer.lock` during deployment.

### 1. Create the backend project

Import this repository into Vercel and configure:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Framework Preset | Other |
| Node.js Version | 22.x |
| Build / Install Command | Leave the empty overrides from `vercel.json` |
| Output Directory | `public` (configured in `vercel.json`) |

All requests are routed to `api/index.php`, including `/api/*`, `/up`, and `/`.
The frontend is a separate Vercel project with Root Directory `web`.

### 2. Configure environment variables

Use `.env.vercel.example` as the list of variables to enter in the Vercel
dashboard for the appropriate Production/Preview environments. In particular:

- **`APP_KEY`**: generate once with `php artisan key:generate --show` locally,
  then paste the full `base64:...` value into Vercel. Keep it stable across deployments.
- **`APP_URL`**: the backend's HTTPS domain.
- **`CORS_ALLOWED_ORIGINS`**: comma-separated frontend origins.
- **`DB_CONNECTION=pgsql`**, **`DB_URL`**, **`DB_SSLMODE=require`**: credentials
  for an external PostgreSQL database, such as Neon or Supabase. URL-encode
  special characters in the connection string's username and password.
- **`AWS_ACCESS_KEY_ID`**, **`AWS_SECRET_ACCESS_KEY`**, **`AWS_DEFAULT_REGION`**,
  **`AWS_BUCKET`**: a private S3-compatible bucket for payment proofs. For R2 or
  another compatible provider, also set `AWS_ENDPOINT`, the provider's region
  (for example `auto` for R2), and `AWS_USE_PATH_STYLE_ENDPOINT` as required.
  Omit `AWS_ENDPOINT` when using AWS S3. Files are streamed through the existing
  authenticated proof endpoint; the bucket does not need public access.
- **`PYTHON_BLOCKCHAIN_API_URL`**, **`PYTHON_BLOCKCHAIN_SERVICE_KEY`**: the HTTPS
  address of the separately hosted `blockchain-api` service and its shared key.
  Match the key to that service's `LARAVEL_SERVICE_KEY`.
- **`BLOCKCHAIN_NETWORK`**, **`BLOCKCHAIN_CONTRACT_ADDRESS`**, **`BLOCKCHAIN_RPC_URL`**:
  the deployed contract's network, address, and RPC endpoint.

`vercel.json` supplies production defaults: debug disabled, stderr logging,
cookie sessions, in-memory request cache, synchronous jobs, and S3 file storage.
Sanctum bearer tokens continue to persist in PostgreSQL. Laravel's compiled
views, package manifests, and temporary files are initialized under `/tmp` by
`bootstrap/vercel.php`; application data belongs in PostgreSQL and the bucket.
Local `php artisan serve` keeps using the normal storage paths.

When moving an existing database, copy any existing `storage/app/payment_proofs`
files to the bucket under the same `payment_proofs/...` keys before switching
traffic, so existing proof paths continue to resolve.

### 3. Initialize the external database

Run migrations from a local shell or CI with the **deployment database's**
connection variables (`DB_CONNECTION`, `DB_URL`, and `DB_SSLMODE`) set:

```powershell
php artisan migrate --force
# Optional: populate the documented demo accounts and sample data.
php artisan db:seed --force
```

Run migrations once per schema release before directing traffic to the new
deployment. Vercel functions do not run migrations or a persistent queue worker
at startup.

### 4. Deploy and connect the frontend

Deploy through Vercel's Git integration, or run these commands from `backend/`:

```powershell
npx vercel
npx vercel --prod
```

Check `https://your-backend.vercel.app/up` for application startup and
`https://your-backend.vercel.app/api/health` for `data.database_connected: true`.
Then set the frontend Vercel project's environment variable and redeploy it:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

For browser access, the backend's Vercel Deployment Protection settings must
allow API requests from your frontend. Function logs are available in Vercel.
