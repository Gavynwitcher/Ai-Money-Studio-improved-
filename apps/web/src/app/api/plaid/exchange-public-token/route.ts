import { NextRequest, NextResponse } from "next/server";
import { exchangePublicToken } from "@/lib/plaid/service";

type ExchangePayload = {
  publicToken?: string;
  institutionName?: string | null;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ExchangePayload;

  if (!body.publicToken) {
    return NextResponse.json({ error: "Missing publicToken" }, { status: 400 });
  }

  const result = await exchangePublicToken(body.publicToken, body.institutionName);

  return NextResponse.json(result);
}
