# SSC Transparency — Frontend Prototype

**SSC Transparency** (Supreme Student Council Transparency) is a university student-government fee collection, digital receipt issuance, and blockchain-verified financial transparency frontend prototype built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Lucide React**.

## Getting Started

1. Ensure **Node.js 18.17+** is installed on your machine.
2. Open a terminal in `C:\Users\ADMIN\blockchain_system\web`:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Application Routes

### Authentication & Portal Launcher
- `/` — Prototype Launcher, Design System Showcase & Route Directory
- `/login` — Institutional Student & SSC Officer Sign-In Page

### Student Portal (`/student/*`)
- `/student/dashboard` — Student Overview, Assessed Fees & Recent Verified Receipts
- `/student/fees` — Full Schedule of Assessed SSC Fees with Search & Status Filter
- `/student/fees/[id]` — Fee Assessment Breakdown & Resolution Details (e.g., `/student/fees/fee-ssc-2026-1`)
- `/student/payment` — Record or Submit SSC Fee Payment Form
- `/student/receipt/[id]` — Official Printable Digital Receipt with Cryptographic Verification Seal (e.g., `/student/receipt/rcp-2026-00142`)
- `/student/transactions` — Complete Student Payment & Verification History
- `/student/transactions/[id]` — Individual Transaction Record & Audit Verification Timeline (e.g., `/student/transactions/tx-2026-00981`)
- `/student/transparency` — Public SSC Financial Transparency & Disbursement Registry

### SSC Officer Portal (`/officer/*`)
- `/officer/dashboard` — Executive Finance & Audit Control Center
- `/officer/fees` — Semester SSC Fee Schedule Management
- `/officer/fees/new` — Create & Publish New SSC Fee Schedule
- `/officer/fees/[id]` — Configure Existing Fee Schedule & View Collection Analytics (e.g., `/officer/fees/fee-ssc-2026-1`)
- `/officer/transactions` — Student Payment Review & Ledger Attestation Queue
- `/officer/funds` — Approved SSC Fund Usage & Disbursement Ledger
- `/officer/funds/new` — Record Approved SSC Fund Usage & Attach COA Vouchers
- `/officer/reports` — COA-Compliant Financial Statements & Audit Bundle Exports
- `/officer/transparency` — Public Transparency Portal & Ledger Snapshot Management

---

## Theme Customization

Colors and border radii are configurable via HSL CSS variables in `src/app/globals.css` and mapped in `tailwind.config.ts`:
- `--primary`: Institutional SSC Navy Blue
- `--verified`: Audit Verification Emerald
- `--warning`: Pending Settlement Amber
- `--ssc-navy`, `--ssc-gold`, `--ssc-slate`: SSC Brand Identity Tokens
