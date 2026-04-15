import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// 로그인 필요한 경로
const PROTECTED = ['/onboarding', '/profile', '/host'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const needsAuth = PROTECTED.some(p => pathname.startsWith(p));

  if (needsAuth && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 상태로 /login 접근 시 홈으로
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/meetups', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon-|apple-touch|manifest).*)'],
};
