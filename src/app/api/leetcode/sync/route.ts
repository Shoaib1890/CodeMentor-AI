import { NextResponse } from 'next/server';
import { getOrCreateAuthUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { fetchLeetCodeProfile } from '@/server/integrations/leetcode/leetcode-client';
import { normalizeLeetCodeStats } from '@/server/integrations/leetcode/leetcode-normaliser';

export async function POST() {
  try {
    const user = await getOrCreateAuthUser();

    const leetcodeProfile = await prisma.leetCodeProfile.findUnique({
      where: { userId: user.id }
    });

    if (!leetcodeProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No LeetCode profile connected. Connect during onboarding.' } },
        { status: 404 }
      );
    }

    // Fetch raw profile
    const rawProfile = await fetchLeetCodeProfile(leetcodeProfile.leetcodeUsername);

    // Normalize topic stats
    const normalizedStats = normalizeLeetCodeStats(
      rawProfile.tagStats,
      rawProfile.easySolved,
      rawProfile.mediumSolved,
      rawProfile.hardSolved
    );

    // Update profile
    const updatedProfile = await prisma.leetCodeProfile.update({
      where: { userId: user.id },
      data: {
        totalSolved: rawProfile.totalSolved,
        easySolved: rawProfile.easySolved,
        mediumSolved: rawProfile.mediumSolved,
        hardSolved: rawProfile.hardSolved,
        acceptanceRate: rawProfile.acceptanceRate,
        currentStreak: rawProfile.currentStreak,
        lastSyncedAt: new Date()
      }
    });

    // Capture snapshot for historical log
    await prisma.submissionSnapshot.create({
      data: {
        userId: user.id,
        rawData: JSON.stringify(rawProfile)
      }
    });

    // Update topic stats in DB
    const oldStats = await prisma.topicStats.findMany({ where: { userId: user.id } });

    for (const stat of normalizedStats) {
      const existing = oldStats.find(os => os.topicSlug === stat.topicSlug);

      await prisma.topicStats.upsert({
        where: { userId_topicSlug: { userId: user.id, topicSlug: stat.topicSlug } },
        create: {
          userId: user.id,
          topicSlug: stat.topicSlug,
          topicName: stat.topicName,
          totalSolved: stat.totalSolved,
          totalAttempted: stat.totalSolved + Math.round(stat.totalSolved * 0.2),
          easySolved: stat.easySolved,
          mediumSolved: stat.mediumSolved,
          hardSolved: stat.hardSolved,
          acceptanceRate: 60.0,
          weaknessScore: existing?.weaknessScore || 0,
          lastComputedAt: new Date()
        },
        update: {
          totalSolved: stat.totalSolved,
          totalAttempted: stat.totalSolved + Math.round(stat.totalSolved * 0.2),
          easySolved: stat.easySolved,
          mediumSolved: stat.mediumSolved,
          hardSolved: stat.hardSolved,
          lastComputedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        syncedAt: updatedProfile.lastSyncedAt?.toISOString(),
        totalSolved: updatedProfile.totalSolved
      }
    });
  } catch (error: any) {
    console.error('LeetCode Sync API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to sync LeetCode data' } },
      { status: 500 }
    );
  }
}
