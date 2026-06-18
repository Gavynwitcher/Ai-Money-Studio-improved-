import type { BusinessProfile, CampaignInput, EmailInput, SocialInput } from "./types";
import { marketPilotConfig, openAiIsConfigured } from "./config";
import { specialistPromptContext } from "./specialists";
import { runOllamaChat } from "@/lib/server/ollama";

type GenerationKind = "plan" | "campaign" | "social" | "email";

function profileContext(profile: BusinessProfile) {
  return `
Business name: ${profile.business_name}
Industry: ${profile.industry}
Location: ${profile.location}
Website: ${profile.website_url || "Not provided"}
Target customer: ${profile.target_customer}
Main services/products: ${profile.main_services}
Brand tone: ${profile.brand_tone}
Monthly marketing goal: ${profile.monthly_marketing_goal}
Current marketing channels: ${profile.current_channels}
Biggest marketing challenge: ${profile.biggest_challenge}
`.trim();
}

const baseInstructions = `
You are MarketPilot AI, an AI Marketing CEO for local small businesses.
Give practical marketing recommendations, ideas, and strategy suggestions.
Think like a complete marketing leadership team with these specialist lenses:
${specialistPromptContext()}
For every generation, synthesize the relevant specialist perspectives instead of writing generic copy.
Avoid fake performance guarantees, revenue promises, or claims that results are certain.
Write in clean Markdown with clear headings and concise bullets.
Include this short disclaimer at the end: "Review AI-generated content before publishing."
`;

function promptFor(kind: GenerationKind, profile: BusinessProfile, input?: CampaignInput | SocialInput | EmailInput) {
  const context = profileContext(profile);

  if (kind === "plan") {
    return `
Create a complete 30-day marketing plan for this business.

${context}

Include:
- Executive marketing summary
- Market research signals and assumptions
- Target customer profile
- Buyer psychology, pain points, objections, and emotional triggers
- Positioning recommendation
- USP, core message, and brand voice notes
- 30-day content calendar
- 4 weekly marketing themes
- 3 promotional campaign ideas
- 10 social media post ideas
- 5 short-form video script ideas
- 5 email marketing ideas
- 3 local SEO blog topics
- 3 review generation ideas
- Funnel map from awareness to repeat purchase/referral
- KPI dashboard recommendations
- Weekly action checklist
`.trim();
  }

  if (kind === "campaign") {
    const campaign = input as CampaignInput;
    return `
Create a campaign for this business.

${context}

Campaign goal: ${campaign.campaignGoal}
Offer type: ${campaign.offerType}
Platform: ${campaign.platform}

Include:
- Campaign name
- Campaign objective
- Buyer insight and emotional trigger
- Offer angle
- Target audience
- Landing page copy
- Email copy
- Social media captions
- Ad copy
- SMS copy
- CTA suggestions
- Follow-up message
- KPI and testing recommendation
`.trim();
  }

  if (kind === "social") {
    const social = input as SocialInput;
    return `
Create a social content package for this business.

${context}

Platform: ${social.platform}
Theme: ${social.theme}
Posting frequency: ${social.frequency}

Include:
- Platform strategy
- Captions
- Hooks
- Hashtags
- Reel/TikTok scripts
- Carousel ideas
- Image prompts
- Posting schedule
- Engagement and conversion notes
`.trim();
  }

  const email = input as EmailInput;
  return `
Create an email marketing asset for this business.

${context}

Email goal: ${email.emailGoal}
Audience: ${email.audience}
Offer/message: ${email.offer}

Include:
- Subject lines
- Preview text
- Email body
- CTA
- Follow-up email
- Objection handled
- Funnel stage and success metric
`.trim();
}

export async function generateMarketingAsset(
  kind: GenerationKind,
  profile: BusinessProfile,
  input?: CampaignInput | SocialInput | EmailInput
) {
  const userPrompt = promptFor(kind, profile, input);

  if (!openAiIsConfigured()) {
    const response = await runOllamaChat({
      messages: [
        { role: "system", content: baseInstructions },
        { role: "user", content: userPrompt }
      ]
    });

    return response.reply;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: marketPilotConfig.openAiModel,
      instructions: baseInstructions,
      input: userPrompt,
      max_output_tokens: kind === "plan" ? 5000 : 2800
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${detail}`);
  }

  const payload = (await response.json()) as { output_text?: string };
  const text = payload.output_text?.trim();
  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return text;
}

export function generateFallbackMarketingAsset(
  kind: GenerationKind,
  profile: BusinessProfile,
  input?: CampaignInput | SocialInput | EmailInput
) {
  const business = profile.business_name || "your business";
  const sections = [
    `# ${kind === "plan" ? "30-Day Marketing Plan" : kind === "campaign" ? "Campaign Asset" : kind === "social" ? "Social Content Package" : "Email Asset"} for ${business}`,
    "## Executive Summary",
    `MarketPilot is running in local demo mode because neither OpenAI nor Ollama completed a generation. This draft uses your profile to show the intended output structure for ${profile.industry} in ${profile.location}.`,
    "## Specialist Strategy Lens",
    "- Market Research: Identify local demand signals, competitor gaps, and underserved customer segments.",
    "- Consumer Psychology: Focus on buyer pain points, objections, emotional triggers, and purchase motivations.",
    "- Brand Strategy: Keep the message clear, specific, and trust-building.",
    "- Content, SEO, Social, Ads, CRO, Funnel, Analytics: Tie every asset to a measurable next action.",
    "## Recommended Next Moves",
    `- Clarify the core offer around: ${profile.main_services || "your primary service"}.`,
    `- Speak directly to: ${profile.target_customer || "your ideal customer"}.`,
    `- Use this tone: ${profile.brand_tone || "friendly and trustworthy"}.`,
    `- Prioritize the monthly goal: ${profile.monthly_marketing_goal || "more qualified leads"}.`,
    "## Action Checklist",
    "- Publish one proof-driven social post.",
    "- Ask three happy customers for a review.",
    "- Create one local SEO page or Google Business Profile update.",
    "- Send one simple promotional or educational email.",
    "- Review CTR, bookings, replies, and lead quality at the end of the week.",
    input ? `## User Inputs\n${JSON.stringify(input, null, 2)}` : "",
    "Review AI-generated content before publishing."
  ].filter(Boolean);

  return sections.join("\n\n");
}
