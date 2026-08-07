import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configure path matching groups to protect routes by role
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;
  const userRole = request.cookies.get('user_role')?.value; // 'USER' | 'BARBER' | 'ADMIN' | 'OWNER'

  // 1. Auth routes check: if logged in, prevent visiting login/signup pages
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  if (isAuthRoute && accessToken) {
    if (userRole === 'USER') return NextResponse.redirect(new URL('/dashboard', request.url));
    if (userRole === 'BARBER') return NextResponse.redirect(new URL('/schedule', request.url));
    if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/triage', request.url));
    if (userRole === 'OWNER') return NextResponse.redirect(new URL('/bi', request.url));
  }

  // 2. Client role protection
  const isClientRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tryon') ||
    pathname.startsWith('/ticket') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/barbers') ||
    pathname.startsWith('/book');
    
  if (isClientRoute && (!accessToken || userRole !== 'USER')) {
    const response = NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url));
    return response;
  }

  // 3. Barber role protection
  const isBarberRoute =
    pathname.startsWith('/schedule') ||
    pathname.startsWith('/crm') ||
    pathname.startsWith('/ledger') ||
    pathname.startsWith('/reputation');
    
  if (isBarberRoute && (!accessToken || userRole !== 'BARBER')) {
    return NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url));
  }

  // 4. Admin role protection
  const isAdminRoute = 
    pathname.startsWith('/triage') ||
    pathname.startsWith('/moderate') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/stats');
  if (isAdminRoute && (!accessToken || userRole !== 'ADMIN')) {
    return NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url));
  }

  // 5. Owner role protection
  const isOwnerRoute = 
    pathname.startsWith('/bi') ||
    pathname.startsWith('/telemetry') ||
    pathname.startsWith('/growth') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/admins');
  if (isOwnerRoute && (!accessToken || userRole !== 'OWNER')) {
    return NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url));
  }

  return NextResponse.next();
}

// Map path matcher configs to run middleware only on relevant routes
export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/tryon/:path*',
    '/ticket/:path*',
    '/profile/:path*',
    '/barbers/:path*',
    '/book/:path*',
    '/schedule/:path*',
    '/crm/:path*',
    '/ledger/:path*',
    '/reputation/:path*',
    '/triage/:path*',
    '/moderate/:path*',
    '/verify/:path*',
    '/stats/:path*',
    '/bi/:path*',
    '/telemetry/:path*',
    '/growth/:path*',
    '/settings/:path*',
    '/admins/:path*',
  ],
};
