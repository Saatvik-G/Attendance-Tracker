import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force dynamic behavior so it doesn't cache today's logs at build time
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todayUtc = new Date().toISOString().split('T')[0];

    // Fetch logs for today, sorted by login_time ascending
    const { data: logs, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('date', todayUtc)
      .order('login_time', { ascending: true });

    if (error) {
      console.error('Database query error on fetching logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch today\'s attendance logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Admin logs GET route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
