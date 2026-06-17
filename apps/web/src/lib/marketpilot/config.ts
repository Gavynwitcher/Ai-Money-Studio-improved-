export const marketPilotConfig = {
  name: "MarketPilot AI",
  description: "Your AI Marketing CEO for Small Businesses",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  stripePrices: {
    starter: process.env.STRIPE_PRICE_MARKETPILOT_STARTER ?? "",
    growth: process.env.STRIPE_PRICE_MARKETPILOT_GROWTH ?? "",
    pro: process.env.STRIPE_PRICE_MARKETPILOT_PRO ?? ""
  }
};

export function supabaseIsConfigured() {
  return Boolean(marketPilotConfig.supabaseUrl && marketPilotConfig.supabaseAnonKey);
}

export function openAiIsConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function ollamaIsConfigured() {
  return Boolean(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL);
}
