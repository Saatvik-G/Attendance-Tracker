import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLogById, getActiveLogForToday, createLog } from '@/lib/db';

// GET: Check current session from cookies
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('attendance_session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ active: false });
    }

    // Query the database for this session
    const log = getLogById(sessionId);

    if (!log) {
      // Clear invalid cookie
      cookieStore.delete('attendance_session_id');
      return NextResponse.json({ active: false });
    }

    const todayUtc = new Date().toISOString().split('T')[0];

    // Check if the session is for today and still logged in
    if (log.status === 'logged_in' && log.date === todayUtc) {
      return NextResponse.json({ active: true, session: log });
    } else {
      // Session has expired (older date) or is already logged out
      cookieStore.delete('attendance_session_id');
      return NextResponse.json({ active: false });
    }
  } catch (error: any) {
    console.error('Session GET route error:', error);
    return NextResponse.json(
      { active: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Form submission (Login / Re-entry recovery)
export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const todayUtc = new Date().toISOString().split('T')[0];
    const cookieStore = await cookies();

    // 1. Check if a row already exists for this email + today's date with status 'logged_in'
    const existingSession = getActiveLogForToday(trimmedEmail, todayUtc);

    // 2. If yes: set cookie, return session and flag that they are already logged in
    if (existingSession) {
      cookieStore.set('attendance_session_id', existingSession.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({
        success: true,
        session: existingSession,
        alreadyLoggedIn: true,
        message: "You're already logged in today.",
      });
    }

    // 3. If no: require Name for first check-in
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required to log in for the first time today' },
        { status: 400 }
      );
    }

    // 4. Create new attendance entry
    const newSession = createLog(
      name.trim(),
      trimmedEmail,
      new Date().toISOString(),
      todayUtc
    );

    // 5. Set session cookie
    cookieStore.set('attendance_session_id', newSession.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      session: newSession,
      alreadyLoggedIn: false,
    });
  } catch (error: any) {
    console.error('Session POST route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
