import { NextResponse } from 'next/server';
import { getLogsForDate } from '@/lib/db';
import { verifyAdminSession } from '@/lib/auth';

// Force dynamic behavior so Next.js doesn't cache today's logs at build time
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Protect API endpoint
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayUtc = new Date().toISOString().split('T')[0];

    // Fetch logs for today
    const logs = await getLogsForDate(todayUtc);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Admin logs GET route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
