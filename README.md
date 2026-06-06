# Unified Banking Hub

Unified Banking Hub is a polished multi-page fintech MVP built with Next.js, React, TypeScript, and Tailwind CSS. The site is designed as a launch-ready demo for consumers and small business owners who want to view balances, transactions, and transfer workflows across multiple financial institutions in one place using Plaid-powered connectivity.

## What is included

- Multi-page marketing site with Home, Features, Dashboard Demo, Plaid Integration, Pricing, About, Security, Contact, FAQ, Auth, and Legal pages
- Premium fintech visual system with reusable components, sticky navigation, responsive layouts, cards, forms, and CTA flows
- Mock product dashboard with balances, linked accounts, transactions, cash flow, alerts, transfer review, credit snapshot, and debt progress widgets
- Plaid-ready service layer and mock API routes for:
  - `create link token`
  - `exchange public token`
  - `fetch linked accounts`
  - `fetch balances`
  - `fetch transactions`
  - `initiate transfer`
- Environment variable placeholders and code comments for sandbox, development, and production Plaid wiring
- Frontend validation and interactive success, loading, and error states for auth, contact, waitlist, and Plaid demo flows
- Contact intake and internal owner alert delivery, ready for transactional email providers such as Brevo

## Project structure

```text
apps/web/src/
  app/
    api/plaid/...
    about/
    contact/
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
    dashboard/
    forms/
    marketing/
    plaid/
    site/
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

## Brevo email integration

Northline can send operational contact alerts through Brevo using the existing contact workflow.

Add these environment variables:

```env
CONTACT_OWNER_ALERT_TO=sales@hibark.com
CONTACT_FROM_NAME=Northline
BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=Northline
```

Notes:

- Brevo is the primary transactional provider when `BREVO_API_KEY` is present.
- Resend remains supported as an optional fallback if `RESEND_API_KEY` is configured instead.
- The current integration is wired into the contact flow for both internal owner alerts and customer confirmation emails.

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

## Moving from mock mode to real mode

1. Set `USE_PLAID_MOCKS="false"`
2. Add valid `PLAID_CLIENT_ID` and `PLAID_SECRET`
3. Keep `PLAID_ENV="sandbox"` first
4. Replace the modal-based mock connect flow in `apps/web/src/components/plaid/plaid-connect-flow.tsx` with Plaid Link
5. Persist `item_id`, access tokens, linked accounts, and transfer history in your database
6. Add authenticated user context to the Plaid service layer and secure route handlers
7. Complete legal and compliance review before enabling transfer capabilities beyond demos

## Recommended next steps

- Connect auth to NextAuth or your preferred identity layer
- Persist Plaid items, accounts, and transactions in a database
- Add analytics for account connection rate, pricing conversion, transfer engagement, and waitlist segmentation
- Add billing integration for subscription and transfer-fee experiments
- Expand planned financial wellness tools behind feature flags
