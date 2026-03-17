# Daily Purchase Bot (Playwright)

This bot runs a configurable browser workflow to purchase an item from one site on a schedule.

## Safety defaults

- Default mode is `dry-run`.
- Steps marked with `"dangerous": true` are skipped in dry-run mode.
- Switch to `live` mode only after validating selectors and checkout behavior.

## 1) Install dependencies

```bash
npm install playwright dotenv node-cron
npx playwright install chromium
```

## 2) Configure environment

Set these in `.env` (or your shell):

```bash
PURCHASE_BOT_MODE="dry-run"
PURCHASE_BOT_HEADLESS="true"
PURCHASE_BOT_TIMEOUT_MS="30000"
PURCHASE_BOT_CRON="0 9 * * *"
PURCHASE_BOT_TIMEZONE="America/Los_Angeles"
PURCHASE_BOT_RUN_ON_STARTUP="false"
PURCHASE_BOT_CONFIG_PATH="scripts/purchase-bot/config.json"
PURCHASE_BOT_STORAGE_STATE_PATH="scripts/purchase-bot/auth-state.json"
PURCHASE_BOT_LOGIN_URL="https://example.com/account/login"
```

## 3) Create your site-specific workflow

```bash
cp scripts/purchase-bot/config.example.json scripts/purchase-bot/config.json
```

Then edit `scripts/purchase-bot/config.json`:

- Replace `startUrl` and `loginUrl`.
- Replace CSS selectors with selectors from your target site.
- Keep the final order submission step marked `"dangerous": true`.

Supported step actions:

- `goto` (`url`)
- `click` (`selector`)
- `fill` (`selector`, `value`)
- `press` (`key`, optional `selector`)
- `waitForSelector` (`selector`, optional `state`)
- `waitForTimeout` (`ms`)
- `selectOption` (`selector`, `value`)
- `check` (`selector`)
- `uncheck` (`selector`)

Optional step fields:

- `description`
- `timeoutMs`
- `postWaitMs`
- `dangerous` (`true` to skip in dry-run)

## 4) Save an authenticated session

```bash
npm run bot:purchase:auth
```

A browser opens. Log in manually, then press Enter in the terminal. Session cookies are saved to `scripts/purchase-bot/auth-state.json`.

## 5) Test once (dry-run)

```bash
npm run bot:purchase:run
```

Artifacts and `run-report.json` are saved under `output/playwright/purchase-bot/<timestamp>/`.

## 6) Enable real purchasing

Set:

```bash
PURCHASE_BOT_MODE="live"
```

Then run once again and verify the confirmation step.

## 7) Run daily

```bash
npm run bot:purchase:schedule
```

This keeps a process running and executes at `PURCHASE_BOT_CRON` in `PURCHASE_BOT_TIMEZONE`.

## Optional: system cron/pm2

If you want resilient background operation after reboots, run the scheduler under a process manager (for example `pm2`) or invoke `npm run bot:purchase:run` directly from your OS cron.

## Notes

- Make sure automation is allowed by the target website terms.
- Add MFA-friendly login persistence if your session expires frequently.
