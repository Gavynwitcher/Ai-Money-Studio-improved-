import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorJson } from "@/lib/server/http";
import { hashPassword } from "@/lib/auth";
import { isDbUnavailableError } from "@/lib/server/moneyCopilotFallback";

type RegisterPayload = {
  email?: string;
  password?: string;
  name?: string;
  acceptedTerms?: boolean;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as RegisterPayload;
    const email = normalizeEmail(payload.email || "");
    const password = (payload.password || "").trim();
    const name = (payload.name || "").trim();

    if (!email || !password) {
      return errorJson("Email and password are required.", 400);
    }
    if (!email.includes("@")) {
      return errorJson("Enter a valid email address.", 400);
    }
    if (password.length < 8) {
      return errorJson("Password must be at least 8 characters.", 400);
    }
    if (!payload.acceptedTerms) {
      return errorJson("You must accept the Terms of Service and Privacy Policy to create a Northline account.", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    if (existing) {
      return errorJson("An account with this email already exists.", 409);
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name: name || null,
        termsAcceptedAt: new Date(),
        termsAcceptedIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        termsAcceptedVersion: "2026-06-private-beta"
      },
      select: { id: true }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      return errorJson("Database is unavailable. Start PostgreSQL and retry registration.", 503);
    }
    return errorJson(error instanceof Error ? error.message : "Failed to register account.", 500);
  }
}
