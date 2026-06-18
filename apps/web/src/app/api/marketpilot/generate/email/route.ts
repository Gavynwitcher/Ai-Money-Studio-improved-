import { NextResponse } from "next/server";
import { generateFallbackMarketingAsset, generateMarketingAsset } from "@/lib/marketpilot/ai";
import { getDemoProfile, saveDemoAsset } from "@/lib/marketpilot/demo-store";
import { createMarketPilotServerClient, getMarketPilotUser } from "@/lib/marketpilot/supabase-server";
import type { BusinessProfile, EmailInput } from "@/lib/marketpilot/types";

export async function POST(req: Request) {
  const supabase = createMarketPilotServerClient();
  if (!supabase) {
    const user = await getMarketPilotUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const input = (await req.json()) as EmailInput;
    const profile = await getDemoProfile(user.id);
    if (!profile) return NextResponse.json({ error: "Create a business profile before generating emails." }, { status: 400 });
    let content: string;
    try {
      content = await generateMarketingAsset("email", profile, input);
    } catch {
      content = generateFallbackMarketingAsset("email", profile, input);
    }
    const asset = await saveDemoAsset("email_assets", user.id, `${input.emailGoal} Email`, content, input);
    return NextResponse.json({ asset });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const input = (await req.json()) as EmailInput;
  const { data: profile, error: profileError } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Create a business profile before generating emails." }, { status: 400 });

  try {
    const content = await generateMarketingAsset("email", profile as BusinessProfile, input);
    const title = `${input.emailGoal} Email`;
    const { data, error } = await supabase
      .from("email_assets")
      .insert({ user_id: user.id, business_profile_id: profile.id, title, content, input })
      .select("id,title,content,created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ asset: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed." }, { status: 500 });
  }
}
