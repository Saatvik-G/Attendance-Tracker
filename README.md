# Attendance Tracker

A clean, minimal, and professional full-stack web application for internal staff attendance tracking. Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL)**, and **Resend** for transactional email reporting.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router) & React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4)
- **Database**: Supabase (Postgres)
- **Email Delivery**: Resend (Transactional Email API)
- **Deployment**: Vercel

---

## Key Features
1. **Easy Portal Login (`/`)**: A centered form for staff to enter their Name and Email to check in.
2. **Duplicate Prevention**: Users cannot check in twice in a single day (UTC date context). Attempting to do so recovers their active session or prevents duplicate database logs.
3. **Session Persistence (`/session`)**: Stores check-in IDs in cookies so a browser refresh or close does not drop the session.
4. **Active Session Page**: Shows exact check-in time and a prominent "Log Out" button.
5. **Admin Dashboard (`/admin`)**: Gives HR/Bosses a view of today's logs (Name, Email, Login, Logout, Status Badge) and a **"Send Report Now"** button to trigger reports on-demand.
6. **Automated HR Emails**: When an employee logs out, or when the admin triggers manually, an HTML report table is emailed to `BOSS_EMAIL` via Resend, sorted by check-in time.

---

## Database Schema (Supabase)

To set up the database table, run the following SQL script in your Supabase project's **SQL Editor**:

```sql
-- Create the attendance_logs table
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'logged_in' CHECK (status IN ('logged_in', 'logged_out'))
);

-- Index for date column since queries filter by today's date
CREATE INDEX idx_attendance_logs_date ON attendance_logs (date);

-- Enable Row Level Security (RLS)
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Simple public policies allowing tracking without user accounts
CREATE POLICY "Allow public select" ON attendance_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON attendance_logs FOR UPDATE USING (true);
```

---

## Timezone Architecture
- **Database**: All timestamps (`login_time`, `logout_time`, `date`) are stored in **UTC** inside Supabase to maintain server-side consistency.
- **Client UI**: To avoid React hydration mismatch issues, times are formatted dynamically on the browser client-side using `Intl.DateTimeFormat` to show in the user's local browser timezone.
- **Email Reports**: Since email generation happens asynchronously on the server, dates are formatted to **Asia/Kolkata** (IST) timezone (with clear code comments) to ensure the recipient receives standard India local times.

---

## Setup & Local Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Saatvik-G/Attendance-Tracker.git
cd Attendance-Tracker
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory (based on `.env.example`) and fill in your credentials:

```env
# Supabase keys (Find in Supabase settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Resend API configuration (Create key at resend.com)
RESEND_API_KEY=re_your_api_key

# Destination email for daily attendance reports (e.g. your email or Boss's email)
BOSS_EMAIL=boss@example.com
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Known Limitation (Authentication Gap)

> [!WARNING]
> **No Identity Authentication**:
> There is currently no active user login authentication (such as password, magic links, or OAuth) verifying that a person is actually who they claim to be when checking in. Anyone who knows an employee's email address can check in or out on their behalf.
> 
> While this is acceptable for a low-stakes, high-trust internal demo or check-in system, **this app must not be used for high-stakes payroll, compliance, or legally-binding logs without first implementing secure authentication** (e.g., Supabase Auth or NextAuth.js).

---

## License
Created for demonstration and HR internal portal tracking.
