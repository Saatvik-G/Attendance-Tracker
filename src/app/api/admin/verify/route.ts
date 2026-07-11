import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession();
    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 });
  }
}
