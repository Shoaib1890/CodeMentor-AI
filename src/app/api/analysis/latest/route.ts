import { NextResponse } from 'next/server';
import { getOrCreateAuthUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getOrCreateAuthUser();

    const report = await prisma.weaknessReport.findUnique({
      where: { userId: user.id }
    });

    if (!report) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: report.generatedAt.toISOString(),
        nextAllowedAt: report.nextAllowedAt.toISOString(),
        overallWeaknessScore: report.overallWeaknessScore || 0,
        aiSummary: report.aiSummary,
        weakTopics: JSON.parse(report.reportData)
      }
    });
  } catch (error: any) {
    console.error('Latest Analysis API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch latest analysis' } },
      { status: 500 }
    );
  }
}
