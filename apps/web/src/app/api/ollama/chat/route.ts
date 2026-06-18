import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Northline AI uses OpenAI only. Use /api/assistant/chat for v1 transaction insights."
    },
    { status: 410 }
  );
}
