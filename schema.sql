-- ====================================================================
-- ATTENDANCE TRACKER DATABASE SCHEMA
-- Execute this SQL script in your Supabase SQL Editor to set up the database.
-- ====================================================================

-- 1. Create the attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    -- Uses CURRENT_DATE (returns date in server UTC time zone)
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'logged_in' CHECK (status IN ('logged_in', 'logged_out'))
);

-- 2. Create index on the date column for optimized performance since 
-- every attendance tracking and reporting query filters by today's date.
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs (date);

-- 3. Enable Row Level Security (RLS) if you want to lock it down.
-- For simple low-stakes setups, you can disable RLS or write permissive policies.
-- Here is a basic policy allowing select, insert, and update operations:
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON attendance_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON attendance_logs FOR UPDATE USING (true);
