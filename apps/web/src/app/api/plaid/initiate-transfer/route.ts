import { NextRequest, NextResponse } from "next/server";
import { initiateTransfer } from "@/lib/plaid/service";
import type { TransferRequest } from "@/lib/plaid/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as TransferRequest;

  if (!body.fromAccountId || !body.toAccountId || !body.amount || body.amount <= 0) {
    return NextResponse.json(
      { error: "fromAccountId, toAccountId, and a positive amount are required" },
      { status: 400 }
    );
  }

  const transfer = await initiateTransfer(body);

  return NextResponse.json(transfer);
}
