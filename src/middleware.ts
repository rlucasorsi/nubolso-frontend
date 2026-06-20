import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { COOKIE_KEYS } from '@/shared/constants/cookie-keys.constant';

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => {
    const withoutLocale = pathname.replace(/^\/(en|pt-BR|es)/, '');
    return withoutLocale === p || withoutLocale.startsWith(p + '/');
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

  const localeMatch = pathname.match(/^\/(en|pt-BR|es)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  const pathWithoutLocale = localeMatch ? pathname.slice(localeMatch[0].length - 1) || '/' : pathname;

  if (pathWithoutLocale === '/') {
    const dest = token ? `/${locale}/dashboard` : `/${locale}/login`;
    return NextResponse.redirect(new URL(dest, request.url));
  }

  const pub = isPublicPath(pathname);

  if (!token && !pub) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (token && pub) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
};
