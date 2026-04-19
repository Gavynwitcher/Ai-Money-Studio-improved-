import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/server/http";
import { createContactInquiry, getContactInquiriesByEmail } from "@/lib/server/contact";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return errorJson("Missing email query parameter.", 400);
  }

  try {
    const inquiries = await getContactInquiriesByEmail(email);
    return NextResponse.json({ inquiries });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to load contact status.", 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      company?: string;
      message?: string;
    };

    const inquiry = await createContactInquiry({
      name: body.name ?? "",
      email: body.email ?? "",
      company: body.company ?? "",
      message: body.message ?? ""
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Failed to create contact inquiry.", 400);
  }
}
