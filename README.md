# BillBless

**Swipe Right. Change a Life.**

BillBless is a mobile-first web app where people upload bills requesting help, and others swipe through anonymous, verified statements to contribute — like Tinder, for paying strangers’ bills.

> **DEMO MODE** — This initial release does **not** accept real donations, move real funds, or publicly expose uploaded financial documents.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn-style Radix UI
- Framer Motion
- Zod + React Hook Form
- Lucide icons
- Supabase Auth / PostgreSQL / Storage (schema + clients ready; local demo store when unset)

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `demo@billbless.app` | `demopass1` (any ≥8 chars) | User |
| `admin@billbless.app` | `demopass1` | Admin |

Any email works in demo auth. Include `admin` in the email for admin access.

## Core experience

1. Open **Discover**
2. See a realistic **redacted bill statement** card
3. **Swipe left** to skip · **Swipe right** to contribute · **Swipe up** to pay remaining
4. Confirm contribution (never charged on swipe alone)
5. Watch funding progress update
6. Fully funded ≠ paid — biller confirmation is a separate status

## App sections

| Route | Purpose |
|-------|---------|
| `/` | Brand landing |
| `/discover` | Tinder-style swipe feed |
| `/explore` | Filtered worldwide browse |
| `/post` | Upload bill → `PENDING_REVIEW` |
| `/impact` | Donor dashboard |
| `/profile` | Settings, privacy, deletion |
| `/admin` | Verification queue, audit, revenue |
| `/auth/*` | Login, register, password reset |

## Architecture

```
src/
  app/           # App Router pages + API
  components/    # UI, bills, contribution, layout
  lib/
    demo/        # Synthetic data + local demo store
    money/       # Integer minor-unit math & formatting
    payments/    # Fee calculator + provider interface
    supabase/    # Browser/server clients (no service key on client)
    validations/ # Zod schemas
  types/         # Domain types
supabase/migrations/  # PostgreSQL schema + RLS
```

### Money

All amounts use **integer minor units** (e.g. cents). Currency `minor_units` supports 0 (JPY), 2 (USD), 3 (KWD), etc. Floating-point is never used for ledger math.

### Fees

```
Bill contribution
+ Processing fees (optional, jurisdiction-dependent — off by default)
+ Tax (optional — not assumed for donations)
+ $1 BillBless platform fee
= Total donor charge
```

Recipients pay **$0** platform fees.

### Payments

`SimulatedPaymentProvider` implements the modular `PaymentProvider` interface. Swap in Stripe (or another regulated provider) only after approval. Contributions use idempotency keys and reject amounts above remaining balance.

## Supabase setup (production)

1. Create a Supabase project
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`
3. Run `supabase/migrations/001_billbless_schema.sql`
4. Create private storage buckets `bill-originals` and `bill-sanitized`
5. Set `NEXT_PUBLIC_DEMO_MODE=false` only after payments + verification systems are certified

Until configured, the app uses a **localStorage-backed demo store** with synthetic bills from multiple countries.

## Scripts

```bash
npm run dev       # development server
npm run build     # production build
npm run start     # start production server
npm run lint      # ESLint
npm run typecheck # TypeScript (--noEmit)
```

## Security notes

- Service-role keys must never appear in client bundles
- RLS policies separate public bill data from `bill_private` / original documents
- Donors never receive original storage paths
- Rate limiting is in-memory for demo; use Redis in production
- See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

## License

Proprietary — all rights reserved.
