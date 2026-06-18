import { NextResponse } from "next/server";
import { normalizeAssets } from "@/lib/marketpilot/assets";
import { listDemoAssets } from "@/lib/marketpilot/demo-store";
import { getMarketPilotUser } from "@/lib/marketpilot/supabase-server";
import { createMarketPilotServerClient } from "@/lib/marketpilot/supabase-server";

export async function GET() {
  const supabase = createMarketPilotServerClient();
  if (!supabase) {
    const user = await getMarketPilotUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const assets = await listDemoAssets(user.id);
    return NextResponse.json({
      assets: normalizeAssets(assets.marketing_plans, assets.campaigns, assets.social_assets, assets.email_assets)
    });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const [plans, campaigns, social, emails] = await Promise.all([
    supabase.from("marketing_plans").select("id,title,content,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("campaigns").select("id,title,content,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("social_assets").select("id,title,content,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("email_assets").select("id,title,content,created_at").eq("user_id", user.id).order("created_at", { ascending: false })
  ]);

  const firstError = [plans.error, campaigns.error, social.error, emails.error].find(Boolean);
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    assets: normalizeAssets(plans.data ?? [], campaigns.data ?? [], social.data ?? [], emails.data ?? [])
  });
}
