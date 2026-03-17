# Gov Contract Copilot

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env template:

   ```bash
   cp .env.example .env
   ```

3. Run Prisma migration and generate client:

   ```bash
   npx prisma migrate dev --name init
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

## Notes

- `OpportunityAnalysis.userId` is optional to support anonymous/demo analysis until authentication sessions are wired.
