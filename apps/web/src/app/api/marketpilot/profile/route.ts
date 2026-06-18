import { NextResponse } from "next/server";
import { getDemoProfile, saveDemoProfile } from "@/lib/marketpilot/demo-store";
import { getMarketPilotUser } from "@/lib/marketpilot/supabase-server";
import { createMarketPilotServerClient } from "@/lib/marketpilot/supabase-server";
import type { BusinessProfile } from "@/lib/marketpilot/types";

export async function GET() {
  const supabase = createMarketPilotServerClient();
  if (!supabase) {
    const user = await getMarketPilotUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return NextResponse.json({ profile: await getDemoProfile(user.id) });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

export async function POST(req: Request) {
  const supabase = createMarketPilotServerClient();
  if (!supabase) {
    const user = await getMarketPilotUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = (await req.json()) as BusinessProfile;
    return NextResponse.json({ profile: await saveDemoProfile(user.id, body) });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await req.json()) as BusinessProfile;
  const profile = {
    user_id: user.id,
    business_name: body.business_name,
    industry: body.industry,
    location: body.location,
    website_url: body.website_url,
    target_customer: body.target_customer,
    main_services: body.main_services,
    brand_tone: body.brand_tone,
    monthly_marketing_goal: body.monthly_marketing_goal,
    current_channels: body.current_channels,
    biggest_challenge: body.biggest_challenge,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("business_profiles")
    .upsert(profile, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
