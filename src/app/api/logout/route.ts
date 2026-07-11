import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLogById, updateLogToLoggedOut, getLogsForDate } from '@/lib/db';
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
    const log = getLogById(sessionId);

    if (!log) {
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

    // 3. Update status and logout time in SQLite
    const updatedLog = updateLogToLoggedOut(sessionId, logoutTime);

    if (!updatedLog) {
      return NextResponse.json(
        { error: 'Failed to update logout status' },
        { status: 500 }
      );
    }

    // Clear session cookie
    cookieStore.delete('attendance_session_id');

    // 4. Trigger Email Report for today's logs
    const todayUtc = log.date;

    // Fetch all logs for today
    const todayLogs = getLogsForDate(todayUtc);

    let emailSent = false;
    let emailError = null;

    if (todayLogs) {
      const emailResult = await sendAttendanceReport({
        logs: todayLogs,
        date: todayUtc,
        triggerType: 'logout',
        triggerByName: updatedLog.name,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error || null;
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
