'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user already has an active session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/session');
        const data = await res.json();
        if (data.active) {
          router.push('/session');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to check session:', error);
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to check in');
      }

      if (data.success) {
        if (data.alreadyLoggedIn) {
          // Double login prevention: Show error and then redirect to active session
          setErrorMessage("You're already logged in today.");
          setSuccessMessage('Recovering your active session...');
          setTimeout(() => {
            router.push('/session');
          }, 1500);
        } else {
          router.push('/session');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      setSubmitting(false);
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

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
            Attendance Tracker
          </h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            Internal HR Check-in Portal
          </p>
        </div>

        <div className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="e.g. john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-500" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Log In
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
