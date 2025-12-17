import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const plan = await prisma.dailyPlan.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: date,
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Get plan error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const body = await req.json();
    const { date, todos, mustDos, reminders } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Upsert (create or update) the daily plan
    const plan = await prisma.dailyPlan.upsert({
      where: {
        userId_date: {
          userId: session.userId,
          date: date,
        }
      },
      update: {
        todos: todos || [],
        mustDos: mustDos || [],
        reminders: reminders || [],
      },
      create: {
        userId: session.userId,
        date: date,
        todos: todos || [],
        mustDos: mustDos || [],
        reminders: reminders || [],
      }
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Save plan error:', error);
    return NextResponse.json(
      { error: 'Failed to save plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    await prisma.dailyPlan.delete({
      where: {
        userId_date: {
          userId: session.userId,
          date: date,
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
