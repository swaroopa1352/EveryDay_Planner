import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, pin } = body;

    if (!name || !pin) {
      return NextResponse.json(
        { error: 'Name and PIN are required' },
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

    // Verify PIN
    const isValidPin = await verifyPin(pin, user.pinHash);

    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Incorrect PIN' },
        { status: 401 }
      );
    }

    // Create session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        gender: user.gender,
        dayStartTime: user.dayStartTime,
        timeFormat: user.timeFormat,
      }
    });

    // Set session cookie
    response.cookies.set('session', JSON.stringify({ userId: user.id, name: user.name }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
