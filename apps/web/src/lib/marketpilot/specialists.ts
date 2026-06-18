export const marketingSpecialists = [
  {
    name: "Market Research",
    shortName: "Research",
    description: "Finds trends, gaps, demand signals, competitor weaknesses, and underserved audiences."
  },
  {
    name: "Consumer Psychology",
    shortName: "Psychology",
    description: "Defines buyer personas, pain points, emotional triggers, objections, and what makes people buy."
  },
  {
    name: "Brand Strategy",
    shortName: "Brand",
    description: "Builds positioning, messaging, voice, USP, brand story, slogans, and core angles."
  },
  {
    name: "Content Marketing",
    shortName: "Content",
    description: "Creates content pillars, calendars, blog strategy, social posts, video scripts, email campaigns, and lead magnets."
  },
  {
    name: "SEO & Growth",
    shortName: "SEO",
    description: "Handles keyword research, content clusters, organic search strategy, growth loops, and traffic planning."
  },
  {
    name: "Social Media Marketing",
    shortName: "Social",
    description: "Builds platform-specific strategies for TikTok, Instagram, YouTube Shorts, LinkedIn, X, and other channels."
  },
  {
    name: "Paid Advertising",
    shortName: "Ads",
    description: "Develops ad angles, targeting, creative concepts, campaign structure, budgets, and ROAS-focused testing."
  },
  {
    name: "Conversion Rate Optimization",
    shortName: "CRO",
    description: "Improves landing pages, offers, funnels, CTAs, checkout flows, and A/B tests."
  },
  {
    name: "Funnel Strategy",
    shortName: "Funnel",
    description: "Maps awareness, lead capture, nurture, sales, upsells, retention, referrals, and monetization."
  },
  {
    name: "Analytics & Optimization",
    shortName: "Analytics",
    description: "Tracks CTR, CPL, CAC, LTV, ROAS, conversion rate, AOV, churn, retention, and optimization priorities."
  }
] as const;

export function specialistPromptContext() {
  return marketingSpecialists.map((specialist) => `- ${specialist.name}: ${specialist.description}`).join("\n");
}
