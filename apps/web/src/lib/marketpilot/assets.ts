import type { GeneratedAsset } from "./types";

type TableAsset = {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
};

export function previewFrom(content: string) {
  return content.replace(/[#*_`>-]/g, "").replace(/\s+/g, " ").trim().slice(0, 180);
}

export function normalizeAssets(
  plans: TableAsset[] = [],
  campaigns: TableAsset[] = [],
  social: TableAsset[] = [],
  emails: TableAsset[] = []
): GeneratedAsset[] {
  return [
    ...plans.map((item) => ({
      id: item.id,
      type: "marketing_plan" as const,
      title: item.title ?? "30-Day Marketing Plan",
      preview: previewFrom(item.content),
      content: item.content,
      created_at: item.created_at
    })),
    ...campaigns.map((item) => ({
      id: item.id,
      type: "campaign" as const,
      title: item.title ?? "Campaign",
      preview: previewFrom(item.content),
      content: item.content,
      created_at: item.created_at
    })),
    ...social.map((item) => ({
      id: item.id,
      type: "social" as const,
      title: item.title ?? "Social Content",
      preview: previewFrom(item.content),
      content: item.content,
      created_at: item.created_at
    })),
    ...emails.map((item) => ({
      id: item.id,
      type: "email" as const,
      title: item.title ?? "Email Asset",
      preview: previewFrom(item.content),
      content: item.content,
      created_at: item.created_at
    }))
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
