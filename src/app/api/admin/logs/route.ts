import { NextRequest, NextResponse } from 'next/server';
import { getLogsForDate, deleteLog } from '@/lib/db';
import { verifyAdminSession } from '@/lib/auth';

// Force dynamic behavior so Next.js doesn't cache today's logs at build time
export const dynamic = 'force-dynamic';

// GET: Fetch logs for a specific date
export async function GET(req: NextRequest) {
  try {
    // Protect API endpoint
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the date query parameter (if any)
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    // Fetch logs for the target date
    const logs = await getLogsForDate(targetDate);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Admin logs GET route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a log entry
export async function DELETE(req: NextRequest) {
  try {
    // Protect API endpoint
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    const success = await deleteLog(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin logs DELETE route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
