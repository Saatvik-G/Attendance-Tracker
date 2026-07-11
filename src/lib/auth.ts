import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Computes the SHA-256 hash of the admin password.
 * The hash is used as a secure cookie token.
 */
export function getAdminToken(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Checks if the current request has a valid admin session cookie.
 */
export async function verifyAdminSession(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // fallback for dev
  
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) return false;

  const expectedToken = getAdminToken(adminPassword);
  return token === expectedToken;
}
