import { NextResponse } from 'next/server';
import { getOrCreateAuthUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { generateStudyPlan } from '@/server/ai/study-plan-generator';

export async function POST() {
  try {
    const user = await getOrCreateAuthUser();

    if (!user.preparationGoal || !user.targetDate) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Preparation goal and target date are required. Update profile first.' } },
        { status: 400 }
      );
    }

    // Fetch latest weakness report
    const report = await prisma.weaknessReport.findUnique({
      where: { userId: user.id }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No weakness report found. Run weakness analysis first.' } },
        { status: 404 }
      );
    }

    const weakTopics = JSON.parse(report.reportData);

    const targetDate = new Date(user.targetDate);
    const daysRemaining = Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    // Generate study plan
    const plan = await generateStudyPlan(weakTopics, daysRemaining, user.targetDate.toISOString(), user.preparationGoal);

    // Save study plan
    const dbPlan = await prisma.studyPlan.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        targetDate,
        totalWeeks: plan.totalWeeks,
        nextAllowedAt: new Date(plan.nextAllowedAt)
      },
      update: {
        targetDate,
        totalWeeks: plan.totalWeeks,
        nextAllowedAt: new Date(plan.nextAllowedAt),
        generatedAt: new Date()
      }
    });

    // Clear old weeks & problems
    await prisma.studyPlanWeek.deleteMany({ where: { planId: dbPlan.id } });

    for (const week of plan.weeks) {
      const dbWeek = await prisma.studyPlanWeek.create({
        data: {
          planId: dbPlan.id,
          weekNumber: week.weekNumber,
          focusTopicSlug: week.focusTopicSlug,
          focusTopicName: week.focusTopicName,
          weekDescription: week.weekDescription
        }
      });

      await prisma.studyPlanProblem.createMany({
        data: week.problems.map(p => ({
          weekId: dbWeek.id,
          leetcodeSlug: p.leetcodeSlug,
          problemTitle: p.problemTitle,
          difficulty: p.difficulty,
          leetcodeUrl: p.leetcodeUrl,
          displayOrder: p.displayOrder
        }))
      });
    }

    // Return the updated plan
    const fullPlan = await prisma.studyPlan.findUnique({
      where: { id: dbPlan.id },
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

    const totalProblems = fullPlan!.weeks.reduce((acc, w) => acc + w.problems.length, 0);

    return NextResponse.json({
      success: true,
      data: {
        planId: fullPlan!.id,
        generatedAt: fullPlan!.generatedAt.toISOString(),
        nextAllowedAt: fullPlan!.nextAllowedAt.toISOString(),
        targetDate: fullPlan!.targetDate.toISOString().split('T')[0],
        daysRemaining,
        totalWeeks: fullPlan!.totalWeeks,
        completedProblems: 0,
        totalProblems,
        weeks: fullPlan!.weeks.map(w => ({
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
            completedAt: null,
            displayOrder: p.displayOrder
          }))
        }))
      }
    });
  } catch (error: any) {
    console.error('Regenerate Study Plan API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to regenerate study plan' } },
      { status: 500 }
    );
  }
}
