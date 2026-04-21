# Northline

Northline is a polished multi-page fintech MVP built with Next.js, React, TypeScript, and Tailwind CSS. The site is designed as a launch-ready demo for consumers and small business owners who want to view balances, transactions, and transfer workflows across multiple financial institutions in one place using Plaid-powered connectivity.

## What is included

- Multi-page marketing site with Home, Features, Dashboard Demo, Plaid Integration, Pricing, About, Security, Contact, FAQ, Auth, and Legal pages
- Premium fintech visual system with reusable components, sticky navigation, responsive layouts, cards, forms, and CTA flows
- Mock product dashboard with balances, linked accounts, transactions, cash flow, alerts, transfer review, credit snapshot, and debt progress widgets
- Credit monitoring workspace with:
  - provider-ready enrollment state
  - stored report snapshots
  - alert timeline
  - score and factor summaries
- Accounting workspace with:
  - chart of accounts
  - journal activity
  - accounts receivable and payable
  - reconciliation queue
- Plaid-ready service layer and mock API routes for:
  - `create link token`
  - `exchange public token`
  - `fetch linked accounts`
  - `fetch balances`
  - `fetch transactions`
  - `initiate transfer`
- Stripe billing integration with:
  - `POST /api/billing/checkout`
  - `POST /api/billing/portal`
  - `POST /api/webhooks/stripe`
  - Prisma-backed customer, subscription, and billing event records
- Environment variable placeholders and code comments for sandbox, development, and production Plaid wiring
- Frontend validation and interactive success, loading, and error states for auth, contact, waitlist, and Plaid demo flows

## Project structure

```text
apps/web/src/
  app/
    api/plaid/...
    accounting/
    about/
    contact/
    credit/
    dashboard-demo/
    features/
    faq/
    forgot-password/
    legal/
    plaid-integration/
    pricing/
    security/
    signin/
    signup/
    verify-email/
    globals.css
    layout.tsx
    page.tsx
  components/
    charts/
    accounting/
    dashboard/
    forms/
    marketing/
    plaid/
    site/
    credit/
    ui/
  data/
    mock-finance.ts
    site.ts
  lib/
    feature-flags.ts
    utils.ts
    plaid/
      config.ts
      mock.ts
      service.ts
      types.ts
```

## Local setup

1. Install dependencies if needed:

   ```bash
   npm install
   ```

2. Copy the environment file and keep mock Plaid mode on for local demo use:

   ```bash
   cp .env.example .env.local
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Stripe billing notes

The pricing page is wired for real Stripe-hosted checkout and the Stripe Billing Portal.

- `apps/web/src/app/api/billing/checkout/route.ts`
  - Creates Stripe Checkout Sessions for paid plans
- `apps/web/src/app/api/billing/portal/route.ts`
  - Opens the Stripe Billing Portal for existing customers
- `apps/web/src/app/api/webhooks/stripe/route.ts`
  - Verifies webhook signatures and syncs subscription state back into Prisma
- `apps/web/src/lib/server/billing.ts`
  - Maps authenticated users to Stripe customers
  - Persists subscription state
  - Records Stripe webhook events for auditability

Required Stripe environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_HUB_PLUS`
- `STRIPE_PRICE_TRANSFER_FLEX` if you want Stripe-hosted checkout for the transfer-credit flow

Recommended Stripe webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Webhook endpoint:

- `/api/webhooks/stripe`

## Plaid integration notes

The UI and API layer are intentionally scaffolded so real Plaid integration can replace the mock behavior with minimal refactoring.

- `apps/web/src/lib/plaid/service.ts`
  - Handles link token creation
  - Exchanges the `public_token`
  - Defines fetch methods for institutions, accounts, balances, and transactions
  - Defines transfer initiation handoff points
- `apps/web/src/app/api/plaid/*`
  - Exposes the JSON endpoints consumed by the mock frontend
  - Documents where real production logic should persist items, accounts, transactions, and transfer records

For local demos, `USE_PLAID_MOCKS="true"` keeps the experience fully interactive without live credentials.

## Credit monitoring module

The app includes a provider-ready credit workspace and API scaffold for future bureau integrations.

- `apps/web/src/app/credit/page.tsx`
  - Customer-facing credit monitoring and report workspace
- `apps/web/src/app/api/credit/*`
  - JSON endpoints for overview, enrollment, reports, and alerts
- `apps/web/src/lib/server/credit.ts`
  - Persists consent, profile, report snapshot, and alert records
  - Seeds demo-safe data for local and unauthenticated MVP use
  - Marks where bureau-specific enrollment and report retrieval should plug in

Recommended credit environment variables:

- `CREDIT_PROVIDER_MODE`
  - `mock` for demo mode
  - switch to a live provider mode once a bureau or bureau-backed partner is approved
- `CREDIT_PROVIDER_NAME`
- `CREDIT_PROVIDER_API_KEY`
- `CREDIT_PROVIDER_CLIENT_ID`
- `CREDIT_PROVIDER_CLIENT_SECRET`

Important compliance note:

- Direct consumer credit reports and monitoring require partner approval, consent capture, and a valid FCRA-compliant use case. The scaffold is designed for direct-to-consumer access, not lender-side pulls without a permissible purpose review.

## Accounting module

The app includes a QuickBooks-style accounting workspace designed for day-one bookkeeping visibility.

- `apps/web/src/app/accounting/page.tsx`
  - Customer-facing accounting desk for books, AR, AP, and reconciliation
- `apps/web/src/app/api/accounting/route.ts`
  - JSON overview endpoint for the accounting workspace
- `apps/web/src/lib/server/accounting.ts`
  - Seeds and reads chart of accounts, journal entries, invoices, bills, and reconciliation items
  - Keeps a clean handoff point for future QuickBooks or external accounting sync

Recommended accounting environment variables:

- `ACCOUNTING_PROVIDER_MODE`
  - `internal_demo` for the built-in books experience
  - switch once you add a provider-backed sync layer
- `ACCOUNTING_PROVIDER_API_KEY`
- `QUICKBOOKS_CLIENT_ID`
- `QUICKBOOKS_CLIENT_SECRET`

## Moving from mock mode to real mode

1. Set `USE_PLAID_MOCKS="false"`
2. Add valid `PLAID_CLIENT_ID` and `PLAID_SECRET`
3. Keep `PLAID_ENV="sandbox"` first
4. Replace the modal-based mock connect flow in `apps/web/src/components/plaid/plaid-connect-flow.tsx` with Plaid Link
5. Persist `item_id`, access tokens, linked accounts, and transfer history in your database
6. Add authenticated user context to the Plaid service layer and secure route handlers
7. Complete legal and compliance review before enabling transfer capabilities beyond demos

## Recommended next steps

- Add your live Stripe secret, webhook secret, and Stripe Price IDs in local and hosted environments
- Register the Stripe webhook endpoint and test it with the Stripe CLI before going live
- Persist Plaid items, accounts, and transactions in a database
- Add analytics for account connection rate, pricing conversion, transfer engagement, and waitlist segmentation
- Expand planned financial wellness tools behind feature flags
