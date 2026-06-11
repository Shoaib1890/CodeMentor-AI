import { NextResponse } from 'next/server';
import { getOrCreateAuthUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getOrCreateAuthUser();

    const plan = await prisma.studyPlan.findUnique({
      where: { userId: user.id },
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: {
            problems: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    const totalProblems = plan.weeks.reduce((acc, week) => acc + week.problems.length, 0);
    const completedProblems = plan.weeks.reduce(
      (acc, week) => acc + week.problems.filter(p => p.isCompleted).length,
      0
    );

    const targetDate = new Date(plan.targetDate);
    const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        generatedAt: plan.generatedAt.toISOString(),
        nextAllowedAt: plan.nextAllowedAt.toISOString(),
        targetDate: plan.targetDate.toISOString().split('T')[0],
        daysRemaining,
        totalWeeks: plan.totalWeeks,
        completedProblems,
        totalProblems,
        weeks: plan.weeks.map(w => ({
          weekId: w.id,
          weekNumber: w.weekNumber,
          focusTopicName: w.focusTopicName,
          focusTopicSlug: w.focusTopicSlug,
          weekDescription: w.weekDescription || '',
          problems: w.problems.map(p => ({
            id: p.id,
            problemTitle: p.problemTitle,
            difficulty: p.difficulty,
            leetcodeUrl: p.leetcodeUrl,
            isCompleted: p.isCompleted,
            completedAt: p.completedAt?.toISOString() || null,
            displayOrder: p.displayOrder
          }))
        }))
      }
    });
  } catch (error: any) {
    console.error('Latest Study Plan API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch current plan' } },
      { status: 500 }
    );
  }
}
