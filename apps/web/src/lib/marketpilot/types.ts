export type BusinessProfile = {
  id?: string;
  user_id?: string;
  business_name: string;
  industry: string;
  location: string;
  website_url: string;
  target_customer: string;
  main_services: string;
  brand_tone: string;
  monthly_marketing_goal: string;
  current_channels: string;
  biggest_challenge: string;
  created_at?: string;
  updated_at?: string;
};

export type AssetType = "marketing_plan" | "campaign" | "social" | "email";

export type GeneratedAsset = {
  id: string;
  type: AssetType;
  title: string;
  preview: string;
  content: string;
  created_at: string;
};

export type CampaignInput = {
  campaignGoal: string;
  offerType: string;
  platform: string;
};

export type SocialInput = {
  platform: string;
  theme: string;
  frequency: string;
};

export type EmailInput = {
  emailGoal: string;
  audience: string;
  offer: string;
};
