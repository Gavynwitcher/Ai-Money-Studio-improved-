import cron from "node-cron";
import dotenv from "dotenv";
import { runPurchaseBot } from "./run.mjs";

dotenv.config();

const cronExpression = (process.env.PURCHASE_BOT_CRON ?? "0 9 * * *").trim();
const timezone =
  process.env.PURCHASE_BOT_TIMEZONE?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone;
const runOnStartup = (process.env.PURCHASE_BOT_RUN_ON_STARTUP ?? "false").trim().toLowerCase() === "true";

if (!cron.validate(cronExpression)) {
  throw new Error(
    `Invalid cron expression in PURCHASE_BOT_CRON: "${cronExpression}". Example daily schedule: "0 9 * * *".`
  );
}

let isRunning = false;

async function executeRun(trigger) {
  if (isRunning) {
    console.warn(`[purchase-bot] Skipping ${trigger} run because the previous run is still in progress.`);
    return;
  }

  isRunning = true;
  try {
    console.log(`[purchase-bot] Starting ${trigger} run at ${new Date().toISOString()}`);
    const summary = await runPurchaseBot();
    console.log(
      `[purchase-bot] Completed ${trigger} run | status=${summary.status} | mode=${summary.mode} | artifacts=${summary.artifactDir}`
    );
  } catch (error) {
    console.error(
      `[purchase-bot] ${trigger} run failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    isRunning = false;
  }
}

cron.schedule(
  cronExpression,
  () => {
    void executeRun("scheduled");
  },
  {
    timezone
  }
);

console.log(`[purchase-bot] Scheduler active | cron="${cronExpression}" | timezone="${timezone}"`);
console.log(`[purchase-bot] Mode: ${process.env.PURCHASE_BOT_MODE ?? "dry-run"}`);

if (runOnStartup) {
  void executeRun("startup");
}
