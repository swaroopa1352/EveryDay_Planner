import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Find user by name
    const user = await prisma.user.findFirst({
      where: { name: name.trim() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete all daily plans for this user first (cascade)
    await prisma.dailyPlan.deleteMany({
      where: { userId: user.id }
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: user.id }
    });

    // Clear session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session');

    return response;
  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
