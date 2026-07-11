import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

// GET: Check current session from cookies
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('attendance_session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ active: false });
    }

    // Query the database for this session
    const { data: log, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !log) {
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
    const { data: existingSession, error: selectError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('email', trimmedEmail)
      .eq('date', todayUtc)
      .eq('status', 'logged_in')
      .maybeSingle();

    if (selectError) {
      console.error('Database query error:', selectError);
      return NextResponse.json(
        { error: 'Failed to verify session status' },
        { status: 500 }
      );
    }

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
    const { data: newSession, error: insertError } = await supabase
      .from('attendance_logs')
      .insert({
        name: name.trim(),
        email: trimmedEmail,
        login_time: new Date().toISOString(),
        date: todayUtc,
        status: 'logged_in',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create login session' },
        { status: 500 }
      );
    }

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
