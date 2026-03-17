import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, password, industry, location, teamSize, govExperienceLevel } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'User exists' }, { status: 400 });
  }

  const pwHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: pwHash,
      role: 'user',
      company: {
        create: {
          industry,
          location,
          teamSize: teamSize ? Number(teamSize) : null,
          govExperienceLevel,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
