import type { PlaidEnvironment } from "@/lib/plaid/types";

function readEnv(key: string, fallback = "") {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : fallback;
}

export function getPlaidEnvironment(): PlaidEnvironment {
  const value = readEnv("PLAID_ENV", "sandbox").toLowerCase();
  if (value === "production" || value === "development" || value === "sandbox") {
    return value;
  }
  return "sandbox";
}

export function getPlaidConfig() {
  return {
    clientId: readEnv("PLAID_CLIENT_ID"),
    secret: readEnv("PLAID_SECRET"),
    environment: getPlaidEnvironment(),
    webhookUrl: readEnv("PLAID_WEBHOOK_URL"),
    redirectUri: readEnv("PLAID_REDIRECT_URI"),
    products: readEnv("PLAID_PRODUCTS", "auth,transactions,transfer")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

export function shouldUseMockPlaid() {
  return readEnv("USE_PLAID_MOCKS", "true") !== "false";
}
