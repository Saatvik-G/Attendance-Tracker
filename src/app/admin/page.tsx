'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Send, 
  RefreshCw, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MailCheck,
  ChevronLeft,
  Lock,
  Unlock,
  LogOut,
  Calendar,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface AttendanceLog {
  id: string;
  name: string;
  email: string;
  login_time: string;
  logout_time: string | null;
  date: string;
  status: 'logged_in' | 'logged_out';
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize selectedDate with local date string in YYYY-MM-DD format
  const getLocalTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalTodayString());
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if admin session is active on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/verify');
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
          await fetchLogs(false, selectedDate);
        }
      } catch (err) {
        console.error('Failed to verify admin status:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setAuthenticated(true);
      await fetchLogs(false, selectedDate);
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect password.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setAuthenticated(false);
      setPassword('');
      setLogs([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchLogs = async (isSilent = false, dateStr = selectedDate) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/logs?date=${dateStr}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch attendance logs');
      }
      setLogs(data.logs || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while loading logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchLogs(false, newDate);
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send report');
      }

      if (data.success) {
        setSuccessMessage(`Attendance report for ${formatSelectedDate()} successfully sent to boss! (${data.count} entries included)`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while sending report.');
    } finally {
      setSendingReport(false);
    }
  };

  const handleDeleteLog = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the check-in entry for ${name}?`)) {
      return;
    }

    setDeletingId(id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete log entry');
      }

      setSuccessMessage(`Successfully deleted entry for ${name}.`);
      await fetchLogs(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete entry. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side helper to convert ISO string to browser timezone format
  const formatTimeLocal = (isoString: string | null) => {
    if (!isoString) return 'Still logged in';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch (e) {
      return isoString;
    }
  };

  // Stats calculation
  const totalEmployees = logs.length;
  const activeCount = logs.filter((log) => log.status === 'logged_in').length;
  const loggedOutCount = totalEmployees - activeCount;

  // Format selected date nicely
  const formatSelectedDate = () => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full',
      }).format(d);
    } catch (e) {
      return selectedDate;
    }
  };

  if (loading && !authenticated) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-2 text-sm text-slate-500 font-medium">Verifying admin session...</p>
      </div>
    );
  }

  // Render Login Card if not authenticated
  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-[400px] bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Admin Access
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter password to unlock the logs dashboard
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleAdminLogin}>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700">
                Admin Password
              </label>
              <div className="mt-2">
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loggingIn}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 sm:text-sm"
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <span className="font-medium">{loginError}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loggingIn || !password}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Unlock Dashboard
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-indigo-600 transition flex items-center justify-center gap-1">
              <ChevronLeft className="h-3 w-3" /> Back to Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard if authenticated
  return (
    <div className="flex-1 bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1 hover:text-indigo-600 transition">
              <ChevronLeft className="h-4 w-4" />
              <Link href="/">Back to Portal</Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-indigo-600 font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatSelectedDate()}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-3 py-1.5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date:</span>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={loading || refreshing || sendingReport || deletingId !== null}
                className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
              />
            </div>

            <button
              onClick={() => fetchLogs(true)}
              disabled={loading || refreshing || sendingReport || deletingId !== null}
              className="inline-flex items-center gap-2 rounded-md bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition"
              title="Refresh attendance table"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleSendReport}
              disabled={loading || refreshing || sendingReport || deletingId !== null}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {sendingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Report
                </>
              )}
            </button>
            
            {/* Admin Logout Button */}
            <button
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-2 rounded-md bg-slate-200 hover:bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition"
              title="Log out from admin"
            >
              <LogOut className="h-4 w-4" />
              Lock
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <span className="font-semibold">Error:</span> {errorMessage}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
            <MailCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <span className="font-semibold">Success:</span> {successMessage}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow-sm border border-slate-200 rounded-lg p-5 flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-md">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 truncate">Total Check-ins</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{totalEmployees}</dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm border border-slate-200 rounded-lg p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-md border border-yellow-100">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 truncate">Active (Logged In)</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{activeCount}</dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm border border-slate-200 rounded-lg p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 truncate">Completed (Logged Out)</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{loggedOutCount}</dd>
            </div>
          </div>
        </div>

        {/* Attendance Logs Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-2 text-sm text-slate-500">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 px-4">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No activity logged</h3>
              <p className="mt-1 text-xs text-slate-500">
                Staff check-ins for this date will show up here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Login Time
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Logout Time
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {logs.map((log, idx) => {
                    const isLoggedOut = log.status === 'logged_out';
                    const isDeleting = deletingId === log.id;
                    return (
                      <tr 
                        key={log.id} 
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {log.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {log.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatTimeLocal(log.login_time)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isLoggedOut ? 'text-slate-900' : 'text-slate-400 italic font-normal'
                        }`}>
                          {formatTimeLocal(log.logout_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isLoggedOut ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/50">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Logged Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-800 border border-yellow-200/50">
                              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                              Still Logged In
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteLog(log.id, log.name)}
                            disabled={deletingId !== null}
                            className="text-rose-600 hover:text-rose-900 font-semibold disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer transition"
                            title={`Delete log for ${log.name}`}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footnote about timezone */}
        <p className="text-center text-xs text-slate-400">
          * Displaying logs in your local browser time zone. Server databases and email reports operate on UTC/IST standards.
        </p>
      </div>
    </div>
  );
}
