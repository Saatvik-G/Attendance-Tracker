import Database from 'better-sqlite3';
import postgres from 'postgres';
import path from 'path';
import crypto from 'crypto';

export interface AttendanceLog {
  id: string;
  name: string;
  email: string;
  login_time: string;
  logout_time: string | null;
  date: string;
  status: 'logged_in' | 'logged_out';
}

const postgresUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
const isProduction = !!postgresUrl;

// DB client references
let sqliteDb: any = null;
let pgClient: any = null;

// Initialize database based on environment
if (isProduction) {
  console.log('Hybrid DB: Initializing Vercel Postgres client...');
  pgClient = postgres(postgresUrl!, { ssl: 'require' });
  
  // Create table if it doesn't exist asynchronously
  pgClient`
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      login_time TEXT NOT NULL,
      logout_time TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('logged_in', 'logged_out'))
    )
  `.then(() => {
    return pgClient`CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(date)`;
  }).catch((err: any) => {
    console.error('Failed to initialize Vercel Postgres table:', err);
  });
} else {
  console.log('Hybrid DB: Initializing local SQLite database (attendance.db)...');
  const dbPath = path.join(process.cwd(), 'attendance.db');
  sqliteDb = new Database(dbPath);
  
  // Initialize table
  sqliteDb.exec(`
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
}

/**
 * Retrieves a log entry by its unique ID.
 */
export async function getLogById(id: string): Promise<AttendanceLog | null> {
  try {
    if (isProduction) {
      const rows = await pgClient`SELECT * FROM attendance_logs WHERE id = ${id}`;
      return (rows[0] as AttendanceLog) || null;
    } else {
      const row = sqliteDb.prepare('SELECT * FROM attendance_logs WHERE id = ?').get(id);
      return (row as AttendanceLog) || null;
    }
  } catch (error) {
    console.error('Error in getLogById:', error);
    return null;
  }
}

/**
 * Checks if an active session ('logged_in') exists for the email and date.
 */
export async function getActiveLogForToday(email: string, date: string): Promise<AttendanceLog | null> {
  try {
    if (isProduction) {
      const rows = await pgClient`
        SELECT * FROM attendance_logs 
        WHERE email = ${email} AND date = ${date} AND status = 'logged_in'
        LIMIT 1
      `;
      return (rows[0] as AttendanceLog) || null;
    } else {
      const row = sqliteDb.prepare(
        'SELECT * FROM attendance_logs WHERE email = ? AND date = ? AND status = ?'
      ).get(email, date, 'logged_in');
      return (row as AttendanceLog) || null;
    }
  } catch (error) {
    console.error('Error in getActiveLogForToday:', error);
    return null;
  }
}

/**
 * Inserts a new check-in attendance log.
 */
export async function createLog(
  name: string,
  email: string,
  loginTime: string,
  date: string
): Promise<AttendanceLog> {
  const id = crypto.randomUUID();
  const status = 'logged_in';

  if (isProduction) {
    await pgClient`
      INSERT INTO attendance_logs (id, name, email, login_time, date, status)
      VALUES (${id}, ${name}, ${email}, ${loginTime}, ${date}, ${status})
    `;
  } else {
    sqliteDb.prepare(
      'INSERT INTO attendance_logs (id, name, email, login_time, date, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, email, loginTime, date, status);
  }

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
export async function updateLogToLoggedOut(id: string, logoutTime: string): Promise<AttendanceLog | null> {
  if (isProduction) {
    await pgClient`
      UPDATE attendance_logs 
      SET logout_time = ${logoutTime}, status = 'logged_out' 
      WHERE id = ${id}
    `;
  } else {
    sqliteDb.prepare(
      'UPDATE attendance_logs SET logout_time = ?, status = ? WHERE id = ?'
    ).run(logoutTime, 'logged_out', id);
  }

  return getLogById(id);
}

/**
 * Gets all logs for a specific date, sorted chronologically by check-in time.
 */
export async function getLogsForDate(date: string): Promise<AttendanceLog[]> {
  try {
    if (isProduction) {
      const rows = await pgClient`
        SELECT * FROM attendance_logs 
        WHERE date = ${date} 
        ORDER BY login_time ASC
      `;
      return rows as AttendanceLog[];
    } else {
      const rows = sqliteDb.prepare(
        'SELECT * FROM attendance_logs WHERE date = ? ORDER BY login_time ASC'
      ).all(date);
      return rows as AttendanceLog[];
    }
  } catch (error) {
    console.error('Error in getLogsForDate:', error);
    return [];
  }
}
