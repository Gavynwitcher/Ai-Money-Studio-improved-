import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { chromium } from "playwright";

dotenv.config();

const PROJECT_ROOT = process.cwd();
const DEFAULT_CONFIG_PATH = path.resolve(PROJECT_ROOT, "scripts/purchase-bot/config.json");
const DEFAULT_STORAGE_STATE_PATH = path.resolve(PROJECT_ROOT, "scripts/purchase-bot/auth-state.json");
const DEFAULT_TIMEOUT_MS = 30_000;
const VALID_ACTIONS = new Set([
  "goto",
  "click",
  "fill",
  "press",
  "waitForSelector",
  "waitForTimeout",
  "selectOption",
  "check",
  "uncheck"
]);

function timestampTag() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function resolvePath(envValue, fallbackPath) {
  if (!envValue || !envValue.trim()) {
    return fallbackPath;
  }

  return path.resolve(PROJECT_ROOT, envValue);
}

function parsePositiveInt(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
}

function getRunMode() {
  const mode = (process.env.PURCHASE_BOT_MODE ?? "dry-run").trim().toLowerCase();
  if (mode !== "dry-run" && mode !== "live") {
    throw new Error('PURCHASE_BOT_MODE must be either "dry-run" or "live".');
  }

  return mode;
}

function assertActionShape(step, index) {
  if (!step || typeof step !== "object" || Array.isArray(step)) {
    throw new Error(`Step ${index} must be an object.`);
  }

  if (typeof step.action !== "string" || !VALID_ACTIONS.has(step.action)) {
    throw new Error(
      `Step ${index} has an unsupported action. Supported actions: ${[...VALID_ACTIONS].join(", ")}`
    );
  }

  const actionsRequiringSelector = new Set([
    "click",
    "fill",
    "waitForSelector",
    "selectOption",
    "check",
    "uncheck"
  ]);

  if (actionsRequiringSelector.has(step.action) && typeof step.selector !== "string") {
    throw new Error(`Step ${index} (${step.action}) requires a selector.`);
  }

  if (step.action === "goto" && typeof step.url !== "string") {
    throw new Error(`Step ${index} (goto) requires a url.`);
  }

  if (step.action === "fill" && typeof step.value !== "string" && typeof step.value !== "number") {
    throw new Error(`Step ${index} (fill) requires a string or number value.`);
  }

  if (step.action === "press" && typeof step.key !== "string") {
    throw new Error(`Step ${index} (press) requires a key value.`);
  }

  if (step.action === "waitForTimeout") {
    const timeoutMs = Number.parseInt(String(step.ms), 10);
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
      throw new Error(`Step ${index} (waitForTimeout) requires a non-negative ms value.`);
    }
  }

  if (step.action === "selectOption" && step.value === undefined) {
    throw new Error(`Step ${index} (selectOption) requires a value.`);
  }
}

async function loadConfig(configPath) {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const fileContents = await fs.readFile(configPath, "utf8");
  const parsed = JSON.parse(fileContents);

  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error('Config must include a non-empty "steps" array.');
  }

  parsed.steps.forEach((step, idx) => assertActionShape(step, idx + 1));

  if (parsed.startUrl !== undefined && typeof parsed.startUrl !== "string") {
    throw new Error('Config field "startUrl" must be a string when present.');
  }

  if (parsed.loginUrl !== undefined && typeof parsed.loginUrl !== "string") {
    throw new Error('Config field "loginUrl" must be a string when present.');
  }

  return parsed;
}

async function executeStep(page, step, defaultTimeoutMs) {
  const timeout = parsePositiveInt(step.timeoutMs, defaultTimeoutMs);

  switch (step.action) {
    case "goto": {
      await page.goto(step.url, {
        timeout,
        waitUntil: step.waitUntil ?? "domcontentloaded"
      });
      break;
    }
    case "click": {
      await page.waitForSelector(step.selector, { timeout, state: "visible" });
      await page.click(step.selector, { timeout });
      break;
    }
    case "fill": {
      await page.waitForSelector(step.selector, { timeout, state: "visible" });
      await page.fill(step.selector, String(step.value), { timeout });
      break;
    }
    case "press": {
      if (typeof step.selector === "string") {
        await page.waitForSelector(step.selector, { timeout, state: "visible" });
        await page.press(step.selector, step.key, { timeout });
      } else {
        await page.keyboard.press(step.key);
      }
      break;
    }
    case "waitForSelector": {
      await page.waitForSelector(step.selector, {
        timeout,
        state: step.state ?? "visible"
      });
      break;
    }
    case "waitForTimeout": {
      await page.waitForTimeout(Number.parseInt(String(step.ms), 10));
      break;
    }
    case "selectOption": {
      await page.waitForSelector(step.selector, { timeout, state: "visible" });
      await page.selectOption(step.selector, step.value, { timeout });
      break;
    }
    case "check": {
      await page.waitForSelector(step.selector, { timeout, state: "visible" });
      await page.check(step.selector, { timeout });
      break;
    }
    case "uncheck": {
      await page.waitForSelector(step.selector, { timeout, state: "visible" });
      await page.uncheck(step.selector, { timeout });
      break;
    }
    default:
      throw new Error(`Unsupported action encountered: ${step.action}`);
  }

  if (step.postWaitMs !== undefined) {
    const postWait = Number.parseInt(String(step.postWaitMs), 10);
    if (Number.isFinite(postWait) && postWait > 0) {
      await page.waitForTimeout(postWait);
    }
  }
}

function createRunSummary({
  mode,
  configPath,
  storageStatePath,
  artifactDir
}) {
  return {
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    mode,
    configPath,
    storageStatePath,
    artifactDir,
    steps: [],
    error: null
  };
}

async function persistRunSummary(summary, artifactDir) {
  const outputPath = path.join(artifactDir, "run-report.json");
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

export async function runPurchaseBot() {
  const mode = getRunMode();
  const configPath = resolvePath(process.env.PURCHASE_BOT_CONFIG_PATH, DEFAULT_CONFIG_PATH);
  const storageStatePath = resolvePath(
    process.env.PURCHASE_BOT_STORAGE_STATE_PATH,
    DEFAULT_STORAGE_STATE_PATH
  );

  const timeoutMs = parsePositiveInt(process.env.PURCHASE_BOT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const artifactDir = path.resolve(PROJECT_ROOT, "output/playwright/purchase-bot", timestampTag());
  await fs.mkdir(artifactDir, { recursive: true });

  const summary = createRunSummary({
    mode,
    configPath,
    storageStatePath,
    artifactDir
  });

  const config = await loadConfig(configPath);

  const browser = await chromium.launch({
    headless: parseBoolean(process.env.PURCHASE_BOT_HEADLESS, true)
  });

  const contextOptions = {};
  if (existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.setDefaultTimeout(timeoutMs);

  page.on("console", (message) => {
    if (message.type() === "error") {
      console.error(`[browser-console] ${message.text()}`);
    }
  });

  try {
    if (typeof config.startUrl === "string" && config.startUrl.trim().length > 0) {
      await page.goto(config.startUrl, { waitUntil: "domcontentloaded" });
    }

    for (let index = 0; index < config.steps.length; index += 1) {
      const step = config.steps[index];
      const stepNumber = index + 1;
      const description =
        typeof step.description === "string" && step.description.trim().length > 0
          ? step.description.trim()
          : step.action;

      if (mode !== "live" && step.dangerous === true) {
        summary.steps.push({
          step: stepNumber,
          action: step.action,
          description,
          status: "skipped",
          reason: "dangerous_step_in_dry_run"
        });
        continue;
      }

      await executeStep(page, step, timeoutMs);

      summary.steps.push({
        step: stepNumber,
        action: step.action,
        description,
        status: "completed"
      });
    }

    if (config.confirmation?.selector) {
      await page.waitForSelector(config.confirmation.selector, {
        timeout: parsePositiveInt(config.confirmation.timeoutMs, timeoutMs),
        state: config.confirmation.state ?? "visible"
      });
    }

    if (typeof config.confirmation?.urlIncludes === "string") {
      const currentUrl = page.url();
      if (!currentUrl.includes(config.confirmation.urlIncludes)) {
        throw new Error(
          `Confirmation URL check failed. Expected URL containing "${config.confirmation.urlIncludes}", got "${currentUrl}".`
        );
      }
    }

    await page.screenshot({
      path: path.join(artifactDir, "final.png"),
      fullPage: true
    });

    await fs.mkdir(path.dirname(storageStatePath), { recursive: true });
    await context.storageState({ path: storageStatePath });

    summary.status = "success";
    summary.finishedAt = new Date().toISOString();
  } catch (error) {
    summary.status = "failed";
    summary.error = error instanceof Error ? error.message : String(error);
    summary.finishedAt = new Date().toISOString();

    try {
      await page.screenshot({
        path: path.join(artifactDir, "error.png"),
        fullPage: true
      });
    } catch {
      // Ignore screenshot failures during error handling.
    }

    throw error;
  } finally {
    await persistRunSummary(summary, artifactDir);
    await context.close();
    await browser.close();
  }

  return summary;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  runPurchaseBot()
    .then((summary) => {
      console.log(
        `[purchase-bot] Success (${summary.mode}) | Artifacts: ${summary.artifactDir} | Steps executed: ${summary.steps.filter((step) => step.status === "completed").length}`
      );
    })
    .catch((error) => {
      console.error(`[purchase-bot] Failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    });
}
