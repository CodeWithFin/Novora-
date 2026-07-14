import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = [
  '/dashboard',
  '/items',
  '/stock-in',
  '/stock-out',
  '/expiring',
  '/transactions',
  '/shops',
  '/users',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('novora_token')?.value;

  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/accept-invite';

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/items/:path*',
    '/stock-in/:path*',
    '/stock-out/:path*',
    '/expiring/:path*',
    '/transactions/:path*',
    '/shops/:path*',
    '/users/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
    '/accept-invite',
  ],
};
