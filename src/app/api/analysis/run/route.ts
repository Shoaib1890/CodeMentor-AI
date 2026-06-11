import { NextResponse } from 'next/server';
import { getOrCreateAuthUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { detectWeaknesses } from '@/server/ai/weakness-detector';

export async function POST() {
  try {
    const user = await getOrCreateAuthUser();

    // Fetch topic stats
    const topicStats = await prisma.topicStats.findMany({
      where: { userId: user.id }
    });

    if (topicStats.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No topic statistics found. Connect LeetCode first.' } },
        { status: 404 }
      );
    }

    // Call AI weakness detector
    const statsForAi = topicStats.map((ts) => ({
      topicSlug: ts.topicSlug,
      topicName: ts.topicName,
      totalAttempted: ts.totalAttempted,
      totalSolved: ts.totalSolved,
      easySolved: ts.easySolved,
      mediumSolved: ts.mediumSolved,
      hardSolved: ts.hardSolved
    }));

    const report = await detectWeaknesses(statsForAi, user.preparationGoal || 'placement');

    // Update weakness report in database
    const dbReport = await prisma.weaknessReport.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        reportData: JSON.stringify(report.weakTopics),
        aiSummary: report.aiSummary,
        overallWeaknessScore: report.overallWeaknessScore,
        nextAllowedAt: new Date(report.nextAllowedAt)
      },
      update: {
        reportData: JSON.stringify(report.weakTopics),
        aiSummary: report.aiSummary,
        overallWeaknessScore: report.overallWeaknessScore,
        nextAllowedAt: new Date(report.nextAllowedAt),
        generatedAt: new Date()
      }
    });

    // Sync weakness scores back into topicStats
    for (const wt of report.weakTopics) {
      await prisma.topicStats.update({
        where: { userId_topicSlug: { userId: user.id, topicSlug: wt.topicSlug } },
        data: { weaknessScore: wt.weaknessScore }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: dbReport.generatedAt.toISOString(),
        nextAllowedAt: dbReport.nextAllowedAt.toISOString(),
        overallWeaknessScore: dbReport.overallWeaknessScore || 0,
        aiSummary: dbReport.aiSummary,
        weakTopics: report.weakTopics
      }
    });
  } catch (error: any) {
    console.error('Run Analysis API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to execute analysis' } },
      { status: 500 }
    );
  }
}
