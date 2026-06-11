import prisma from './prisma';

// Checks if Clerk keys are configured
export const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

export interface SessionUser {
  id: string;
  clerkId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  preparationGoal: string | null;
  targetDate: Date | null;
  onboardingComplete: boolean;
}

const MOCK_USER_ID = 'user_mock_priya_codes_123';

export async function getOrCreateAuthUser(): Promise<SessionUser> {
  // If Clerk is configured, we will import Clerk and get the user
  if (isClerkConfigured) {
    try {
      const { auth, currentUser } = await import('@clerk/nextjs/server');
      const session = await auth();
      const clerkUser = await currentUser();

      if (!session.userId || !clerkUser) {
        throw new Error('Unauthorized');
      }

      // Check if user exists in database, otherwise create
      let dbUser = await prisma.user.findUnique({
        where: { clerkId: session.userId }
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            clerkId: session.userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
            avatarUrl: clerkUser.imageUrl || null,
            onboardingComplete: false
          }
        });
      }

      return dbUser;
    } catch (e) {
      console.warn('Error fetching Clerk user, falling back to mock mode:', e);
    }
  }

  // Fallback / Mock Mode: Auto-login a default user
  let mockUser = await prisma.user.findUnique({
    where: { clerkId: MOCK_USER_ID }
  });

  if (!mockUser) {
    mockUser = await prisma.user.create({
      data: {
        clerkId: MOCK_USER_ID,
        email: 'priya@example.com',
        fullName: 'Priya S (Mock User)',
        avatarUrl: null,
        preparationGoal: 'placement',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        onboardingComplete: true
      }
    });

    // Also populate LeetCode profile for Priya so she has stats out of the box
    await prisma.leetCodeProfile.create({
      data: {
        userId: mockUser.id,
        leetcodeUsername: 'priya_codes',
        totalSolved: 153,
        easySolved: 92,
        mediumSolved: 54,
        hardSolved: 7,
        acceptanceRate: 58.4,
        currentStreak: 4,
        lastSyncedAt: new Date(),
        isProfilePublic: true
      }
    });

    // Seed topic stats for Priya
    const initialTopics = [
      { topicSlug: 'arrays', topicName: 'Arrays', totalSolved: 42, easySolved: 25, mediumSolved: 15, hardSolved: 2 },
      { topicSlug: 'strings', topicName: 'Strings', totalSolved: 30, easySolved: 20, mediumSolved: 10, hardSolved: 0 },
      { topicSlug: 'linked-lists', topicName: 'Linked Lists', totalSolved: 15, easySolved: 10, mediumSolved: 5, hardSolved: 0 },
      { topicSlug: 'stacks', topicName: 'Stacks', totalSolved: 10, easySolved: 6, mediumSolved: 4, hardSolved: 0 },
      { topicSlug: 'recursion', topicName: 'Recursion', totalSolved: 12, easySolved: 8, mediumSolved: 4, hardSolved: 0 },
      { topicSlug: 'dynamic-programming', topicName: 'Dynamic Programming', totalSolved: 5, easySolved: 5, mediumSolved: 0, hardSolved: 0 },
      { topicSlug: 'trees', topicName: 'Trees', totalSolved: 8, easySolved: 8, mediumSolved: 0, hardSolved: 0 }
    ];

    for (const ts of initialTopics) {
      await prisma.topicStats.create({
        data: {
          userId: mockUser.id,
          topicSlug: ts.topicSlug,
          topicName: ts.topicName,
          totalSolved: ts.totalSolved,
          totalAttempted: ts.totalSolved + 3,
          easySolved: ts.easySolved,
          mediumSolved: ts.mediumSolved,
          hardSolved: ts.hardSolved,
          acceptanceRate: Math.round((ts.totalSolved / (ts.totalSolved + 3)) * 1000) / 10,
          weaknessScore: ts.topicSlug === 'dynamic-programming' ? 89.2 : (ts.topicSlug === 'trees' ? 70.0 : 35.0),
          lastComputedAt: new Date()
        }
      });
    }
  }

  return mockUser;
}
