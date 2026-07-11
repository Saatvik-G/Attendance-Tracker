import Database from 'better-sqlite3';
import path from 'path';

// Store the SQLite database in the root of the project
const dbPath = path.join(process.cwd(), 'attendance.db');
const db = new Database(dbPath);

// Initialize DB schema automatically
db.exec(`
  CREATE TABLE IF NOT EXISTS attendance_logs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    login_time TEXT NOT NULL,
    logout_time TEXT,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('logged_in', 'logged_out'))
  );
  
  CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(date);
`);

export interface AttendanceLog {
  id: string;
  name: string;
  email: string;
  login_time: string;
  logout_time: string | null;
  date: string;
  status: 'logged_in' | 'logged_out';
}

/**
 * Retrieves a log entry by its unique ID.
 */
export function getLogById(id: string): AttendanceLog | null {
  try {
    const row = db.prepare('SELECT * FROM attendance_logs WHERE id = ?').get(id);
    return (row as AttendanceLog) || null;
  } catch (error) {
    console.error('Error in getLogById:', error);
    return null;
  }
}

/**
 * Checks if an active session ('logged_in') exists for the email and date.
 */
export function getActiveLogForToday(email: string, date: string): AttendanceLog | null {
  try {
    const row = db.prepare(
      'SELECT * FROM attendance_logs WHERE email = ? AND date = ? AND status = ?'
    ).get(email, date, 'logged_in');
    return (row as AttendanceLog) || null;
  } catch (error) {
    console.error('Error in getActiveLogForToday:', error);
    return null;
  }
}

/**
 * Inserts a new check-in attendance log.
 */
export function createLog(
  name: string,
  email: string,
  loginTime: string,
  date: string
): AttendanceLog {
  const id = crypto.randomUUID();
  const status = 'logged_in';

  db.prepare(
    'INSERT INTO attendance_logs (id, name, email, login_time, date, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, email, loginTime, date, status);

  return {
    id,
    name,
    email,
    login_time: loginTime,
    logout_time: null,
    date,
    status,
  };
}

/**
 * Updates a log to 'logged_out' with the current logout timestamp.
 */
export function updateLogToLoggedOut(id: string, logoutTime: string): AttendanceLog | null {
  db.prepare(
    'UPDATE attendance_logs SET logout_time = ?, status = ? WHERE id = ?'
  ).run(logoutTime, 'logged_out', id);

  return getLogById(id);
}

/**
 * Gets all logs for a specific date, sorted chronologically by check-in time.
 */
export function getLogsForDate(date: string): AttendanceLog[] {
  try {
    const rows = db.prepare(
      'SELECT * FROM attendance_logs WHERE date = ? ORDER BY login_time ASC'
    ).all(date);
    return rows as AttendanceLog[];
  } catch (error) {
    console.error('Error in getLogsForDate:', error);
    return [];
  }
}
