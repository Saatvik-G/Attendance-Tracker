import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply IP restriction to the landing page (/) and session page (/session)
  if (pathname === '/' || pathname === '/session') {
    const allowedIp = process.env.OFFICE_IP;

    // If OFFICE_IP is not set, bypass the check to avoid locking out the app
    if (!allowedIp) {
      return NextResponse.next();
    }

    // Get the client's IP from x-forwarded-for header, falling back to request.ip
    const xForwardedFor = request.headers.get('x-forwarded-for');
    let clientIp = '';

    if (xForwardedFor) {
      // x-forwarded-for can be a comma-separated list (e.g. "client, proxy1, proxy2")
      // The client IP is the first entry
      clientIp = xForwardedFor.split(',')[0].trim();
    } else {
      clientIp = (request as any).ip || '';
    }

    // Split allowedIp by comma to support multiple allowed entries or subnets
    const allowedIps = allowedIp.split(',').map((ip) => ip.trim());

    // Check if the client IP matches any of the allowed entries or prefix wildcards
    const isAllowed = allowedIps.some((allowed) => {
      // Support wildcards (e.g., "122.173.28.*")
      if (allowed.endsWith('*')) {
        const prefix = allowed.slice(0, -1); // Remove the '*'
        return clientIp.startsWith(prefix);
      }
      
      // Support trailing dot matching (e.g., "122.173.28.")
      if (allowed.endsWith('.')) {
        return clientIp.startsWith(allowed);
      }

      // Exact match
      return clientIp === allowed;
    });

    // Block if the client IP is not in the allowed list/wildcards
    if (!isAllowed) {
      return new NextResponse(
        `Access denied: this app can only be used from the office network. (Your IP: ${clientIp})`,
        {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
