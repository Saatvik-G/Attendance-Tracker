import { NextResponse } from 'next/server';
import { getLogsForDate } from '@/lib/db';
import { sendAttendanceReport } from '@/lib/email';

export async function POST() {
  try {
    const todayUtc = new Date().toISOString().split('T')[0];

    // Fetch all logs for today from DB (awaited)
    const todayLogs = await getLogsForDate(todayUtc);

    // Trigger Email Report manually
    const emailResult = await sendAttendanceReport({
      logs: todayLogs,
      date: todayUtc,
      triggerType: 'manual',
    });

    if (!emailResult.success) {
      console.error('Failed to send report manually:', emailResult.error);
      return NextResponse.json(
        { error: `Resend email error: ${emailResult.error}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      count: todayLogs.length,
    });
  } catch (error: any) {
    console.error('Admin send-report POST route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
