import { NextResponse } from 'next/server';
import { getOrCreateAuthUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { fetchLeetCodeProfile } from '@/server/integrations/leetcode/leetcode-client';
import { normalizeLeetCodeStats } from '@/server/integrations/leetcode/leetcode-normaliser';
import { detectWeaknesses } from '@/server/ai/weakness-detector';
import { generateStudyPlan } from '@/server/ai/study-plan-generator';

export async function POST(req: Request) {
  try {
    const user = await getOrCreateAuthUser();
    const body = await req.json();
    const { leetcodeUsername } = body;

    if (!leetcodeUsername || typeof leetcodeUsername !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'LeetCode username is required' } },
        { status: 400 }
      );
    }

    // Fetch raw profile
    const rawProfile = await fetchLeetCodeProfile(leetcodeUsername);

    // Normalize topic stats
    const normalizedStats = normalizeLeetCodeStats(
      rawProfile.tagStats,
      rawProfile.easySolved,
      rawProfile.mediumSolved,
      rawProfile.hardSolved
    );

    let report: any = null;
    let plan: any = null;

    // Automatically trigger initial weakness report and study plan if goal exists
    if (user.preparationGoal && user.targetDate) {
      // Calculate weakness scores
      const statsForAi = normalizedStats.map(stat => ({
        topicSlug: stat.topicSlug,
        topicName: stat.topicName,
        totalAttempted: stat.totalSolved + Math.round(stat.totalSolved * 0.2), // Simulated attempt count
        totalSolved: stat.totalSolved,
        easySolved: stat.easySolved,
        mediumSolved: stat.mediumSolved,
        hardSolved: stat.hardSolved
      }));

      // Call AI APIs outside the database transaction to prevent holding/losing the DB connection
      report = await detectWeaknesses(statsForAi, user.preparationGoal);
      
      const targetDate = new Date(user.targetDate);
      const daysRemaining = Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      plan = await generateStudyPlan(report.weakTopics, daysRemaining, user.targetDate.toISOString(), user.preparationGoal);
    }

    // Write LeetCode profile and details inside a rapid database transaction to ensure atomicity
    let leetcodeProfile: any;

    await prisma.$transaction(async (tx) => {
      // Write LeetCode profile to DB
      leetcodeProfile = await tx.leetCodeProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          leetcodeUsername,
          totalSolved: rawProfile.totalSolved,
          easySolved: rawProfile.easySolved,
          mediumSolved: rawProfile.mediumSolved,
          hardSolved: rawProfile.hardSolved,
          acceptanceRate: rawProfile.acceptanceRate,
          currentStreak: rawProfile.currentStreak,
          lastSyncedAt: new Date(),
          isProfilePublic: true
        },
        update: {
          leetcodeUsername,
          totalSolved: rawProfile.totalSolved,
          easySolved: rawProfile.easySolved,
          mediumSolved: rawProfile.mediumSolved,
          hardSolved: rawProfile.hardSolved,
          acceptanceRate: rawProfile.acceptanceRate,
          currentStreak: rawProfile.currentStreak,
          lastSyncedAt: new Date()
        }
      });

      // Mark onboarding as complete for the user
      await tx.user.update({
        where: { id: user.id },
        data: { onboardingComplete: true }
      });

      // Clear old topic stats first to avoid orphaned categories
      await tx.topicStats.deleteMany({ where: { userId: user.id } });

      const topicStatsData = normalizedStats.map((stat) => {
        const weakTopic = report?.weakTopics?.find((wt: any) => wt.topicSlug === stat.topicSlug);
        return {
          userId: user.id,
          topicSlug: stat.topicSlug,
          topicName: stat.topicName,
          totalSolved: stat.totalSolved,
          totalAttempted: stat.totalSolved + Math.round(stat.totalSolved * 0.2), // Simulated attempt count
          easySolved: stat.easySolved,
          mediumSolved: stat.mediumSolved,
          hardSolved: stat.hardSolved,
          acceptanceRate: 60.0,
          weaknessScore: weakTopic ? weakTopic.weaknessScore : 0,
          lastComputedAt: new Date()
        };
      });

      await tx.topicStats.createMany({
        data: topicStatsData
      });

      if (report && plan && user.targetDate) {
        const targetDate = new Date(user.targetDate);

        await tx.weaknessReport.upsert({
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
            nextAllowedAt: new Date(report.nextAllowedAt)
          }
        });

        const dbPlan = await tx.studyPlan.upsert({
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
            nextAllowedAt: new Date(plan.nextAllowedAt)
          }
        });

        // Clear old weeks & problems
        await tx.studyPlanWeek.deleteMany({ where: { planId: dbPlan.id } });

        for (const week of plan.weeks) {
          const dbWeek = await tx.studyPlanWeek.create({
            data: {
              planId: dbPlan.id,
              weekNumber: week.weekNumber,
              focusTopicSlug: week.focusTopicSlug,
              focusTopicName: week.focusTopicName,
              weekDescription: week.weekDescription
            }
          });

          await tx.studyPlanProblem.createMany({
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
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        leetcodeUsername,
        totalSolved: leetcodeProfile.totalSolved,
        topicsFound: normalizedStats.filter(t => t.totalSolved > 0).length
      }
    });
  } catch (error: any) {
    console.error('LeetCode Connect API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to connect LeetCode profile' } },
      { status: 500 }
    );
  }
}
