# Attendance Tracker (SQLite Version)

A clean, minimal, and professional full-stack web application for internal staff attendance tracking. Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Resend** for transactional email reporting.

This version uses a **local SQLite database** (`attendance.db`), making it 100% self-contained and requiring **zero cloud database configuration** (no Supabase setup required!).

---

## Tech Stack
- **Framework**: Next.js 16 (App Router) & React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4)
- **Database**: SQLite (Local-first, managed via `better-sqlite3`)
- **Email Delivery**: Resend (Transactional Email API)

---

## Key Features
1. **Easy Portal Login (`/`)**: A centered form for staff to enter their Name and Email to check in.
2. **Duplicate Prevention**: Users cannot check in twice in a single day (UTC date context). Attempting to do so recovers their active session or prevents duplicate database logs.
3. **Session Persistence (`/session`)**: Stores check-in IDs in cookies so a browser refresh or close does not drop the session.
4. **Active Session Page**: Shows exact check-in time and a prominent "Log Out" button.
5. **Admin Dashboard (`/admin`)**: Gives HR/Bosses a view of today's logs (Name, Email, Login, Logout, Status Badge) and a **"Send Report Now"** button to trigger reports on-demand.
6. **Automated HR Emails**: When an employee logs out, or when the admin triggers manually, an HTML report table is emailed to `BOSS_EMAIL` via Resend, sorted by check-in time.

---

## Timezone Architecture
- **Database**: All timestamps (`login_time`, `logout_time`, `date`) are stored in **UTC** inside SQLite to maintain consistency.
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
Create a `.env.local` file in the root directory (based on `.env.example`) and fill in your Resend credentials:

```env
# Resend API configuration (Create key at https://resend.com)
RESEND_API_KEY=re_your_api_key

# Destination email for daily attendance reports (e.g. your email or Boss's email)
BOSS_EMAIL=boss@example.com
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application. The application will **automatically create** the local database file `attendance.db` in your root folder and set up all required tables.

---

## Deployment to Vercel (Important Node)

> [!IMPORTANT]
> **Ephemeral Storage Limitation**:
> Since Vercel deployments run on serverless functions, the local SQLite file system is **ephemeral**. This means any check-in logs saved to `attendance.db` will disappear when the serverless function spins down or restarts.
> 
> * **For Local Runs / Demos**: SQLite is completely permanent and runs perfectly.
> * **For Production Deployments**: If you need to deploy this to Vercel for actual production usage, it is recommended to connect Vercel Postgres (Neon) or Supabase.

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
