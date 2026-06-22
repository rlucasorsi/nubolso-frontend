import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_KEYS } from '@/shared/constants/cookie-keys.constant';

// Requires no auth — redirects logged-in users to dashboard
const AUTH_PATHS = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];

// Accessible by anyone regardless of auth state (legal pages, etc.)
const OPEN_PATHS = ['/privacy', '/terms', '/faq'];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', request.url));
  }

  if (matches(pathname, OPEN_PATHS)) {
    return NextResponse.next();
  }

  if (!token && !matches(pathname, AUTH_PATHS)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && matches(pathname, AUTH_PATHS)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
};
