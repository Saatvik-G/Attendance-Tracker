import { Resend } from 'resend';
import { AttendanceLog } from './db';

const resendApiKey = process.env.RESEND_API_KEY || '';
const bossEmail = process.env.BOSS_EMAIL || '';

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Formats a UTC ISO timestamp to Asia/Kolkata (IST) time for the email report.
 * NOTE: Since the email is generated on the server and sent to the boss,
 * we explicitly hardcode the Asia/Kolkata timezone here to match the local organization standard.
 */
function formatTimeIST(utcString: string | null): string {
  if (!utcString) return 'Still logged in';
  try {
    const date = new Date(utcString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error('Error formatting IST time:', error);
    return utcString;
  }
}

/**
 * Formats a YYYY-MM-DD date string to a human-readable format.
 */
function formatDateIST(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
    }).format(date);
  } catch (error) {
    return dateStr;
  }
}

interface SendEmailParams {
  logs: AttendanceLog[];
  date: string;
  triggerType: 'logout' | 'manual';
  triggerByName?: string;
}

export async function sendAttendanceReport({
  logs,
  date,
  triggerType,
  triggerByName,
}: SendEmailParams) {
  if (!resend) {
    console.error('Resend is not initialized. Check RESEND_API_KEY.');
    return { success: false, error: 'Resend API key is missing' };
  }

  if (!bossEmail) {
    console.error('Boss email is not configured. Check BOSS_EMAIL.');
    return { success: false, error: 'Boss email recipient is missing' };
  }

  // Sort logs by login_time ascending
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(a.login_time).getTime() - new Date(b.login_time).getTime();
  });

  const formattedDate = formatDateIST(date);
  const subject = `Attendance Report — ${formattedDate}`;

  // Build the email HTML report
  const tableRowsHtml = sortedLogs
    .map((log) => {
      const isLoggedOut = log.status === 'logged_out';
      const statusText = isLoggedOut ? 'Logged Out' : 'Still Logged In';
      const statusColor = isLoggedOut ? '#10b981' : '#eab308'; // green vs yellow
      const logoutDisplay = log.logout_time ? formatTimeIST(log.logout_time) : 'Still logged in';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 500;">${log.name}</td>
          <td style="padding: 12px; font-size: 14px; color: #64748b;">${log.email}</td>
          <td style="padding: 12px; font-size: 14px; color: #1e293b;">${formatTimeIST(log.login_time)}</td>
          <td style="padding: 12px; font-size: 14px; color: #1e293b; font-style: ${
            log.logout_time ? 'normal' : 'italic'
          };">${logoutDisplay}</td>
          <td style="padding: 12px; font-size: 14px;">
            <span style="background-color: ${statusColor}15; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block;">
              ${statusText}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const triggerDescription =
    triggerType === 'manual'
      ? 'This report was generated manually by the Admin.'
      : `This report was triggered automatically because ${
          triggerByName || 'a user'
        } logged out.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #1e293b; padding: 24px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.025em;">Attendance Tracker Report</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #94a3b8;">Date: ${formattedDate} (IST)</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 24px;">
            <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
              Hello Boss,<br/><br/>
              Please find below the current attendance status log for today. ${triggerDescription}
            </p>
            
            <!-- Table -->
            <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 24px;">
              <thead>
                <tr style="border-bottom: 2px solid #cbd5e1; background-color: #f1f5f9;">
                  <th style="padding: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Name</th>
                  <th style="padding: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Email</th>
                  <th style="padding: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Login Time</th>
                  <th style="padding: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Logout Time</th>
                  <th style="padding: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${
                  sortedLogs.length > 0
                    ? tableRowsHtml
                    : `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #64748b; font-style: italic; font-size: 14px;">No check-ins logged for today.</td></tr>`
                }
              </tbody>
            </table>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
              This is an automated report from your Attendance Tracker app.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    // Send email using Resend
    // Resend free tier allows sending from onboarding@resend.dev to verified domain/owners
    const data = await resend.emails.send({
      from: 'Attendance Tracker <onboarding@resend.dev>',
      to: bossEmail,
      subject: subject,
      html: htmlContent,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send email via Resend:', error);
    return { success: false, error: error.message || 'Unknown Resend error' };
  }
}
