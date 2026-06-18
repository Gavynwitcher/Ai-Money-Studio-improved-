import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      provider: "disabled",
      available: false,
      message: "Northline AI uses OpenAI only. Legacy local model endpoints are disabled for v1."
    },
    { status: 410 }
  );
}
