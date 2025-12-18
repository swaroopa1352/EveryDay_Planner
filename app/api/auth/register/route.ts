import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, gender, pin, dayStartTime, timeFormat } = body;

    // Validation
    if (!name || !gender || !pin || !dayStartTime || !timeFormat) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4-6 digits' },
        { status: 400 }
      );
    }

    // Check if user already exists with this name
    const existingUser = await prisma.user.findFirst({
      where: { name: name.trim() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this name already exists' },
        { status: 409 }
      );
    }

    // Hash the PIN
    const pinHash = await hashPin(pin);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        gender,
        pinHash,
        dayStartTime,
        timeFormat,
      },
      select: {
        id: true,
        name: true,
        gender: true,
        dayStartTime: true,
        timeFormat: true,
      }
    });

    // Create session
    const response = NextResponse.json({
      success: true,
      user,
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
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Check for unique constraint violation
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
