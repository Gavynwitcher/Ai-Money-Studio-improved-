"use client";

import { createBrowserClient } from "@supabase/ssr";
import { marketPilotConfig } from "./config";

export function createMarketPilotBrowserClient() {
  return createBrowserClient(marketPilotConfig.supabaseUrl, marketPilotConfig.supabaseAnonKey);
}
