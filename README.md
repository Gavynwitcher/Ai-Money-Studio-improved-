# Northline

Northline is a private-beta financial visibility workspace built with Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth, Plaid, and Stripe. The current launch scope is intentionally narrow: users can create an account, accept legal terms, connect bank accounts through Plaid, view balances and transactions, manage billing, contact support, unlink data, and delete their account.

Northline is not a bank, lender, credit repair organization, investment adviser, or money transmitter. Transfer, lending, credit monitoring, credit repair, underwriting, and regulated money-movement capabilities are staged or disabled until the required compliance, partner, legal, cost, and operational reviews are complete.

Production domain: [https://usenorthline.com](https://usenorthline.com)

Readiness docs:

- [Private beta readiness](docs/northline-private-beta-readiness.md)
- [Security and compliance notes](docs/northline-security-compliance-notes.md)

## Private Beta Scope

Available now:

- Signup/login with terms acceptance
- Plaid account linking for authenticated users
- Balance and transaction visibility
- Stripe subscription billing
- Contact/support intake
- Bank unlinking and account deletion controls

Explicitly staged:

- Plaid Transfer initiation
- Stripe Connect transfer rails
- Square transfer requests
- Plaid Assets underwriting reports
- Plaid Liabilities debt verification
- Credit monitoring, credit reports, and credit repair
- HELOC applications and lending workflows

## Verification

Run these gates before deployment:

```bash
npm --workspace apps/web run lint
npm --workspace apps/web run typecheck
npm --workspace apps/web run test
npm --workspace apps/web run build
```

## MarketPilot AI MVP

This repo also includes **MarketPilot AI**, an AI-powered marketing operating system for small business owners. It acts like an AI Marketing CEO that helps local service businesses create a business profile, generate a 30-day marketing plan, build campaigns, draft social content, write emails, and store generated assets.

Start page:

- `/marketpilot`
- `/marketpilot/signup`
- `/marketpilot/dashboard`

### MarketPilot tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- OpenAI Responses API
- Stripe checkout placeholders

### MarketPilot setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env vars:

   ```bash
   cp apps/web/.env.local.example apps/web/.env.local
   ```

3. Add required MarketPilot environment variables:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=""
   NEXT_PUBLIC_SUPABASE_ANON_KEY=""
   OPENAI_API_KEY=""
   OPENAI_MODEL="gpt-4.1-mini"
   NORTHLINE_AI_PROVIDER="auto"
   NORTHLINE_AI_SYSTEM_PROMPT=""
   OLLAMA_BASE_URL="http://127.0.0.1:11434"
   OLLAMA_MODEL="llama3.2"
   STRIPE_SECRET_KEY=""
   STRIPE_PRICE_MARKETPILOT_STARTER=""
   STRIPE_PRICE_MARKETPILOT_GROWTH=""
   STRIPE_PRICE_MARKETPILOT_PRO=""
   ```

4. Create Supabase tables by running:

   ```text
   supabase/marketpilot_schema.sql
   ```

   The schema creates:

   - `business_profiles`
   - `marketing_plans`
   - `campaigns`
   - `social_assets`
   - `email_assets`

   Row-level security is enabled so users can only access rows where `auth.uid() = user_id`.

5. Start locally:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000/marketpilot](http://localhost:3000/marketpilot)

### MarketPilot OpenAI notes

AI generation is handled server-side in `apps/web/src/lib/marketpilot/ai.ts`. MarketPilot tries `OPENAI_API_KEY` first, then falls back to local Ollama through `OLLAMA_BASE_URL` and `OLLAMA_MODEL`. If neither provider is available, local demo mode returns a structured placeholder so the UI remains testable. The API routes save generated content to Supabase when configured, or to the local demo store when Supabase env vars are missing. The app intentionally uses recommendation language and includes a review-before-publishing disclaimer.

### Northline AI notes

Northline AI is available at `/assistant` and uses `apps/web/src/app/api/assistant/chat/route.ts`, which currently delegates to the provider-aware Northline AI handler. Set `OPENAI_API_KEY` to use the OpenAI Responses API. `NORTHLINE_AI_PROVIDER="auto"` uses OpenAI when configured and falls back to Ollama for local development. Set `NORTHLINE_AI_PROVIDER="openai"` to require OpenAI or `NORTHLINE_AI_PROVIDER="ollama"` to force local Ollama.

The assistant is intentionally scoped to connected account, transaction, cash-flow, budgeting, and Plaid-derived context supplied by the app. It should not claim to move money, approve transfers, repair credit, guarantee outcomes, replace a bank, or provide legal, tax, investment, lending approval, or regulatory advice.

### MarketPilot Ollama notes

To run generations locally through Ollama:

```bash
ollama serve
ollama pull llama3.2
```

Then set:

```bash
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.2"
OPENAI_API_KEY=""
```

Restart `npm run dev` after changing environment variables.

### MarketPilot specialist lenses

MarketPilot prompts every generation through a full marketing leadership model:

- Market Research
- Consumer Psychology
- Brand Strategy
- Content Marketing
- SEO & Growth
- Social Media Marketing
- Paid Advertising
- Conversion Rate Optimization
- Funnel Strategy
- Analytics & Optimization

### MarketPilot Stripe notes

The pricing screen includes Starter, Growth, and Pro tiers:

- Starter: `$29/month`
- Growth: `$79/month`
- Pro: `$149/month`

Checkout buttons remain disabled until `STRIPE_SECRET_KEY` and the MarketPilot Stripe price IDs are configured. This avoids accidentally activating billing in an incomplete environment.

## What is included

- Multi-page marketing site with Home, Features, Dashboard Demo, Plaid Integration, Pricing, About, Security, Contact, FAQ, Auth, and Legal pages
- Premium fintech visual system with reusable components, sticky navigation, responsive layouts, cards, forms, and CTA flows
- Product dashboard with balances, linked accounts, transactions, cash flow summaries, and private-beta status messaging
- Contact and beta lead capture flow for onboarding, support, walkthrough, pricing, and product-fit requests
- Account settings page with billing/support links and account deletion controls
- Plaid-ready service layer and mock API routes for:
  - `create link token`
  - `exchange public token`
  - `fetch linked accounts`
  - `fetch balances`
  - `fetch transactions`
  - `unlink connected data`
- Stripe billing integration with:
  - `POST /api/billing/checkout`
  - `POST /api/billing/portal`
  - `POST /api/webhooks/stripe`
  - Prisma-backed customer, subscription, and billing event records
- Environment variable placeholders and code comments for sandbox, development, and production Plaid wiring
- Frontend validation and interactive success, loading, and error states for auth, contact, waitlist, and Plaid demo flows
- Staged API responses for transfer, lending, credit, Assets, Liabilities, and Stripe Connect workflows that are outside the private-beta scope

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
    heloc-application/
    security/
    signin/
    signup/
    verify-email/
    api/heloc-applications/
    heloc/disclosures/[slug]/
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
    forms/heloc-application-form.tsx
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
    heloc/
      config.ts
      meridianlink-field-map.ts
      validation.ts
  examples/
    heloc-meridianlink-preview.sample.json
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

5. Visit the HELOC flow at [http://localhost:3000/heloc-application](http://localhost:3000/heloc-application)

## HELOC / MeridianLink module

The repository now includes a production-style HELOC application surface and backend adapter designed so institution-specific MeridianLink wiring can be swapped in without rewriting the borrower UI.

- Public page:
  - `apps/web/src/app/heloc-application/page.tsx`
- Borrower form UI:
  - `apps/web/src/components/forms/heloc-application-form.tsx`
- Submission API:
  - `apps/web/src/app/api/heloc-applications/route.ts`
- Shared validation and normalization:
  - `apps/web/src/lib/heloc/validation.ts`
- MeridianLink mapping handoff:
  - `apps/web/src/lib/heloc/meridianlink-field-map.ts`
- Server submission and audit logic:
  - `apps/web/src/lib/server/heloc.ts`

### HELOC environment variables

- `LENDER_NAME`
- `MERIDIANLINK_MODE`
  - `mock` saves a preview payload under `apps/web/.runtime/heloc/previews/`
  - `api` forwards the transformed payload to the configured endpoint
- `MERIDIANLINK_ENDPOINT`
- `MERIDIANLINK_API_KEY`
- `MERIDIANLINK_TIMEOUT_MS`
- `HELOC_BROCHURE_URL`
- `HELOC_EARLY_DISCLOSURE_URL`
- `HELOC_PRIVACY_NOTICE_URL`
- `HELOC_ESIGN_CONSENT_URL`

### MeridianLink mapping notes

- `apps/web/src/lib/heloc/meridianlink-field-map.ts`
  - contains placeholder target field names instead of guessed proprietary MeridianLink keys
  - is the intended institution-specific swap point once exact field names are approved
- `apps/web/examples/heloc-meridianlink-preview.sample.json`
  - shows the normalized submission envelope and mapped-field output shape

### Audit and mock output

- Every HELOC submission writes a JSONL audit event to:
  - `apps/web/.runtime/heloc/audit-log.jsonl`
- Mock-mode submissions also write a preview payload to:
  - `apps/web/.runtime/heloc/previews/<REFERENCE>.json`

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

For the HELOC adapter:

1. Set `MERIDIANLINK_MODE="api"`
2. Provide `MERIDIANLINK_ENDPOINT`, `MERIDIANLINK_API_KEY`, and lender-approved disclosure URLs
3. Replace the placeholder targets in `apps/web/src/lib/heloc/meridianlink-field-map.ts`
4. Confirm the final MeridianLink payload contract and authentication requirements with the institution or MeridianLink implementation team
5. Run compliance and disclosure review before production release

## Recommended next steps

- Add your live Stripe secret, webhook secret, and Stripe Price IDs in local and hosted environments
- Register the Stripe webhook endpoint and test it with the Stripe CLI before going live
- Persist Plaid items, accounts, and transactions in a database
- Add analytics for account connection rate, pricing conversion, transfer engagement, and waitlist segmentation
- Expand planned financial wellness tools behind feature flags
