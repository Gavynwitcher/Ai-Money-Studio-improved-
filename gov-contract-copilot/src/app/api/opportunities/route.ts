import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.rawText !== 'string') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { rawText } = body;

  if (!rawText || rawText.length < 50) {
    return NextResponse.json({ error: 'Text too short' }, { status: 400 });
  }

  const fitScore = 7;
  const recommendation = 'bid';
  const requirements = [
    'Licensed in the state',
    '3 past similar projects',
    'Insurance and bonding',
  ];
  const risks = ['No past gov performance', 'Tight timeline'];

  await prisma.opportunityAnalysis.create({
    data: {
      rawText,
      fitScore,
      recommendation,
      requirementsSummary: requirements,
      risks,
    },
  });

  return NextResponse.json({ fitScore, recommendation, requirements, risks });
}
