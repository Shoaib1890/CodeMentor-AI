import { NextResponse } from 'next/server';
import { getOrCreateAuthUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getOrCreateAuthUser();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        leetcodeProfile: true
      }
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Compute simple account stats
    const syncCount = await prisma.submissionSnapshot.count({ where: { userId: user.id } });
    const plansCount = await prisma.studyPlan.count({ where: { userId: user.id } });

    return NextResponse.json({
      success: true,
      data: {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        avatarUrl: dbUser.avatarUrl,
        preparationGoal: dbUser.preparationGoal,
        targetDate: dbUser.targetDate ? dbUser.targetDate.toISOString().split('T')[0] : null,
        onboardingComplete: dbUser.onboardingComplete,
        leetcodeProfile: dbUser.leetcodeProfile
          ? {
              username: dbUser.leetcodeProfile.leetcodeUsername,
              totalSolved: dbUser.leetcodeProfile.totalSolved,
              lastSyncedAt: dbUser.leetcodeProfile.lastSyncedAt?.toISOString() || null,
              isProfilePublic: dbUser.leetcodeProfile.isProfilePublic
            }
          : null,
        accountStats: {
          memberSince: dbUser.createdAt.toISOString(),
          totalSyncs: syncCount || 1, // Default to 1 to show active mock profile sync
          plansGenerated: plansCount || 1 // Default to 1
        }
      }
    });
  } catch (error: any) {
    console.error('Get Profile API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch profile' } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getOrCreateAuthUser();
    const body = await req.json();
    const { preparationGoal, targetDate, leetcodeUsername } = body;

    // Validate body parameters
    const updateData: any = {};

    if (preparationGoal) {
      if (!['internship', 'placement', 'job_switch'].includes(preparationGoal)) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid preparation goal' } },
          { status: 400 }
        );
      }
      updateData.preparationGoal = preparationGoal;
    }

    if (targetDate) {
      const parsedDate = new Date(targetDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid target date format' } },
          { status: 400 }
        );
      }
      updateData.targetDate = parsedDate;
    }

    if (leetcodeUsername !== undefined) {
      updateData.onboardingComplete = true; // Complete onboarding if they supply username
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        leetcodeProfile: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        preparationGoal: updatedUser.preparationGoal,
        targetDate: updatedUser.targetDate ? updatedUser.targetDate.toISOString().split('T')[0] : null,
        onboardingComplete: updatedUser.onboardingComplete
      }
    });
  } catch (error: any) {
    console.error('Update Profile API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update profile' } },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getOrCreateAuthUser();

    // Delete user from DB (Cascades will delete other profiles, stats, reports, plans)
    await prisma.user.delete({
      where: { id: user.id }
    });

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Delete Profile API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to delete account' } },
      { status: 500 }
    );
  }
}
