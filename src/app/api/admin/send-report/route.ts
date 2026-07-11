import { NextRequest, NextResponse } from 'next/server';
import { getLogsForDate } from '@/lib/db';
import { sendAttendanceReport } from '@/lib/email';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Protect API endpoint
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the target date from body (if provided)
    let body = { date: '' };
    try {
      body = await req.json();
    } catch (e) {
      // Body might be empty, ignore parsing error
    }
    
    const targetDate = body.date || new Date().toISOString().split('T')[0];

    // Fetch all logs for target date from DB
    const targetLogs = await getLogsForDate(targetDate);

    // Trigger Email Report manually for the selected date
    const emailResult = await sendAttendanceReport({
      logs: targetLogs,
      date: targetDate,
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
      count: targetLogs.length,
    });
  } catch (error: any) {
    console.error('Admin send-report POST route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
