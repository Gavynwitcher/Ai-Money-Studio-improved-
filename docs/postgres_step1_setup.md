# Step 1: PostgreSQL + Prisma Migrations Setup

This repo is configured for PostgreSQL-backed Prisma migrations.

## 1. Start local PostgreSQL

```bash
docker compose -f docker-compose.postgres.yml up -d
```

## 2. Verify env

The default dev URL is:

```bash
postgresql://copilot:copilot@localhost:5432/money_copilot?schema=public
```

Configured in:

- `.env`
- `apps/web/.env.local`

## 3. Apply migrations

```bash
npm run db:migrate
```

For deployment environments:

```bash
npm run db:migrate:deploy
```

## 4. Generate client (if needed)

```bash
npm run db:generate
```

## 5. Run app

```bash
npm run dev
```

## Useful commands

```bash
npm run db:studio
npm run db:push
npm run db:migrate:reset
```

## Notes

- Initial SQL migration is in `prisma/migrations/20260301113000_init/migration.sql`.
- `prisma/dev.db` is legacy from SQLite and no longer used.
