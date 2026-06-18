import { NextResponse } from "next/server";

export function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function authRequiredJson(message = "Please sign in to use this private beta feature.") {
  return NextResponse.json(
    {
      error: message,
      signInPath: "/signin"
    },
    { status: 401 }
  );
}

export function privateBetaUnavailableJson(featureName: string) {
  return NextResponse.json(
    {
      error: `${featureName} is not available in the Northline private beta.`,
      message:
        "Northline is currently limited to account linking, balances, transaction visibility, billing, support, and account management. Regulated workflows require additional compliance, partner, and legal review before launch.",
      status: "planned"
    },
    { status: 403 }
  );
}
