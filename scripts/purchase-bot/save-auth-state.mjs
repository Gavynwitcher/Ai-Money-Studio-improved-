import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import dotenv from "dotenv";
import { chromium } from "playwright";

dotenv.config();

const PROJECT_ROOT = process.cwd();
const DEFAULT_CONFIG_PATH = path.resolve(PROJECT_ROOT, "scripts/purchase-bot/config.json");
const DEFAULT_STORAGE_STATE_PATH = path.resolve(PROJECT_ROOT, "scripts/purchase-bot/auth-state.json");

function resolvePath(envValue, fallbackPath) {
  if (!envValue || !envValue.trim()) {
    return fallbackPath;
  }

  return path.resolve(PROJECT_ROOT, envValue);
}

async function loadConfig(configPath) {
  const fileContents = await fs.readFile(configPath, "utf8");
  return JSON.parse(fileContents);
}

async function promptForContinue(promptText) {
  const terminal = readline.createInterface({ input, output });
  await terminal.question(promptText);
  terminal.close();
}

async function main() {
  const configPath = resolvePath(process.env.PURCHASE_BOT_CONFIG_PATH, DEFAULT_CONFIG_PATH);
  const storageStatePath = resolvePath(
    process.env.PURCHASE_BOT_STORAGE_STATE_PATH,
    DEFAULT_STORAGE_STATE_PATH
  );

  const config = await loadConfig(configPath);
  const loginUrl =
    process.env.PURCHASE_BOT_LOGIN_URL ??
    (typeof config.loginUrl === "string" && config.loginUrl.trim().length > 0 ? config.loginUrl : null) ??
    (typeof config.startUrl === "string" && config.startUrl.trim().length > 0 ? config.startUrl : null);

  if (!loginUrl) {
    throw new Error(
      "No login URL found. Set PURCHASE_BOT_LOGIN_URL or add loginUrl/startUrl in the bot config file."
    );
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

    await promptForContinue(
      "Complete login in the opened browser window, then press Enter here to save session state. "
    );

    await fs.mkdir(path.dirname(storageStatePath), { recursive: true });
    await context.storageState({ path: storageStatePath });

    console.log(`[purchase-bot] Saved auth state to: ${storageStatePath}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`[purchase-bot] Failed to save auth state: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
