import { NextResponse } from 'next/server';
import { getLogsForDate } from '@/lib/db';

// Force dynamic behavior so Next.js doesn't cache today's logs at build time
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todayUtc = new Date().toISOString().split('T')[0];

    // Fetch logs for today (sorted by login_time ascending in helper)
    const logs = getLogsForDate(todayUtc);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Admin logs GET route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
