import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { marketPilotConfig, supabaseIsConfigured } from "./config";
import { demoUserId } from "./demo-store";

export function createMarketPilotServerClient() {
  if (!supabaseIsConfigured()) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(marketPilotConfig.supabaseUrl, marketPilotConfig.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot always mutate cookies; Route Handlers can.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Components cannot always mutate cookies; Route Handlers can.
        }
      }
    }
  });
}

export async function getMarketPilotUser() {
  const supabase = createMarketPilotServerClient();
  if (!supabase) {
    const email = cookies().get("marketpilot_demo_email")?.value;
    return email ? { id: demoUserId(email), email } : null;
  }
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function requireMarketPilotUser() {
  const user = await getMarketPilotUser();
  if (!user) {
    redirect("/marketpilot/login");
  }
  return user;
}
