import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { sendAttendanceReport } from '@/lib/email';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('attendance_session_id')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 400 }
      );
    }

    // 1. Fetch current session log
    const { data: log, error: fetchError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (fetchError || !log) {
      // Clear invalid cookie anyway
      cookieStore.delete('attendance_session_id');
      return NextResponse.json(
        { error: 'Session not found in database' },
        { status: 400 }
      );
    }

    // 2. If already logged out, just clear cookie and return success
    if (log.status === 'logged_out') {
      cookieStore.delete('attendance_session_id');
      return NextResponse.json({ success: true, message: 'Already logged out' });
    }

    const logoutTime = new Date().toISOString();

    // 3. Update status and logout time in Supabase
    const { data: updatedLog, error: updateError } = await supabase
      .from('attendance_logs')
      .update({
        logout_time: logoutTime,
        status: 'logged_out',
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error on logout:', updateError);
      return NextResponse.json(
        { error: 'Failed to update logout status' },
        { status: 500 }
      );
    }

    // Clear session cookie
    cookieStore.delete('attendance_session_id');

    // 4. Trigger Email Report for today's logs
    const todayUtc = log.date; // Use the date stored in the row (which is today's date in UTC)

    // Fetch all logs for today
    const { data: todayLogs, error: logsError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('date', todayUtc);

    let emailSent = false;
    let emailError = null;

    if (!logsError && todayLogs) {
      const emailResult = await sendAttendanceReport({
        logs: todayLogs,
        date: todayUtc,
        triggerType: 'logout',
        triggerByName: updatedLog.name,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error || null;
    } else {
      console.error('Failed to fetch today\'s logs for email report:', logsError);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      emailError,
    });
  } catch (error: any) {
    console.error('Logout POST route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
