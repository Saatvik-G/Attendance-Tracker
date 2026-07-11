'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface SessionInfo {
  id: string;
  name: string;
  email: string;
  login_time: string;
  status: string;
}

export default function SessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        if (data.active && data.session) {
          setSession(data.session);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  // Format date client-side in the user's local timezone to avoid hydration mismatch
  useEffect(() => {
    if (session?.login_time) {
      const loginDate = new Date(session.login_time);
      const timeFormatter = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      });
      setFormattedTime(
        `${dateFormatter.format(loginDate)} at ${timeFormatter.format(loginDate)}`
      );
    }
  }, [session]);

  const handleLogout = async () => {
    setLoggingOut(true);
    setError(null);

    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to check out');
      }

      if (data.success) {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'An error occurred during log out. Please try again.');
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-2 text-sm text-slate-500 font-medium">Verifying active session...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
      <div className="w-full max-w-[420px] bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Active Work Session
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{session.name}</span>
          </p>
        </div>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 border border-slate-100 space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Logged In Since
              </span>
              <span className="mt-0.5 block text-sm font-medium text-slate-800">
                {formattedTime || 'Loading local time...'}
              </span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-2 flex items-start gap-3">
            <div className="h-2 w-2 mt-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Session Status
              </span>
              <span className="mt-0.5 block text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                Currently Checked In
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 px-6 py-4 text-lg font-bold text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-rose-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            {loggingOut ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Logging Out...
              </>
            ) : (
              <>
                <LogOut className="h-6 w-6" />
                Log Out & Submit Time
              </>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Logging out will end your session and a report will be sent.
          </p>
        </div>
      </div>
    </div>
  );
}
