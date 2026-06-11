import { NextResponse } from 'next/server';
import { getOrCreateAuthUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ problemId: string }> }
) {
  try {
    const user = await getOrCreateAuthUser();
    const { problemId } = await params;
    const body = await req.json();
    const { isCompleted } = body;

    if (typeof isCompleted !== 'boolean') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'isCompleted (boolean) is required in body' } },
        { status: 400 }
      );
    }

    // Verify problem exists and belongs to user's plan
    const problem = await prisma.studyPlanProblem.findFirst({
      where: {
        id: problemId,
        week: {
          plan: {
            userId: user.id
          }
        }
      }
    });

    if (!problem) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Problem not found in user study plan' } },
        { status: 404 }
      );
    }

    const updated = await prisma.studyPlanProblem.update({
      where: { id: problemId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        isCompleted: updated.isCompleted,
        completedAt: updated.completedAt?.toISOString() || null
      }
    });
  } catch (error: any) {
    console.error('Toggle Problem API failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to toggle problem status' } },
      { status: 500 }
    );
  }
}
