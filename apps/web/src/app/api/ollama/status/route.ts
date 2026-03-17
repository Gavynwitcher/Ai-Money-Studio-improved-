import { NextResponse } from "next/server";
import { getOllamaStatus } from "@/lib/server/ollama";

export async function GET() {
  const status = await getOllamaStatus();
  return NextResponse.json(status);
}
