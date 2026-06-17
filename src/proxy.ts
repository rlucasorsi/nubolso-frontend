import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_KEYS } from '@/shared/constants/cookie-keys.constant';

export function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const { pathname } = request.nextUrl;

  const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
  ];
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Sem token e tentando acessar rota privada
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Com token e tentando acessar login ou registro
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/painel', request.url));
  }

  // Redirecionamento da raiz
  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/painel' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
