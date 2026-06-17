import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { BusinessProfile } from "./types";

type DemoAsset = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  input?: Record<string, unknown>;
  created_at: string;
};

type DemoDatabase = {
  profiles: Record<string, BusinessProfile>;
  marketing_plans: DemoAsset[];
  campaigns: DemoAsset[];
  social_assets: DemoAsset[];
  email_assets: DemoAsset[];
};

const runtimeDir = path.join(process.cwd(), ".runtime", "marketpilot");
const dbPath = path.join(runtimeDir, "demo-db.json");

const emptyDb: DemoDatabase = {
  profiles: {},
  marketing_plans: [],
  campaigns: [],
  social_assets: [],
  email_assets: []
};

async function readDb(): Promise<DemoDatabase> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return { ...emptyDb, ...JSON.parse(raw) };
  } catch {
    return emptyDb;
  }
}

async function writeDb(db: DemoDatabase) {
  await mkdir(runtimeDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2));
}

export function demoUserId(email: string) {
  return `demo-${Buffer.from(email).toString("base64url")}`;
}

export async function getDemoProfile(userId: string) {
  const db = await readDb();
  return db.profiles[userId] ?? null;
}

export async function saveDemoProfile(userId: string, profile: BusinessProfile) {
  const db = await readDb();
  const now = new Date().toISOString();
  const saved = {
    ...profile,
    id: profile.id ?? `profile-${userId}`,
    user_id: userId,
    created_at: profile.created_at ?? now,
    updated_at: now
  };
  db.profiles[userId] = saved;
  await writeDb(db);
  return saved;
}

export async function listDemoAssets(userId: string) {
  const db = await readDb();
  const filter = (items: DemoAsset[]) => items.filter((item) => item.user_id === userId);
  return {
    marketing_plans: filter(db.marketing_plans),
    campaigns: filter(db.campaigns),
    social_assets: filter(db.social_assets),
    email_assets: filter(db.email_assets)
  };
}

export async function saveDemoAsset(
  table: "marketing_plans" | "campaigns" | "social_assets" | "email_assets",
  userId: string,
  title: string,
  content: string,
  input?: Record<string, unknown>
) {
  const db = await readDb();
  const asset = {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    content,
    input,
    created_at: new Date().toISOString()
  };
  db[table].unshift(asset);
  await writeDb(db);
  return asset;
}
