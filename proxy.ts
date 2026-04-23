import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Approved 유저만 접근 가능 (pending → pending-approval, rejected → rejected로 튕김)
const APPROVED_ONLY_PREFIXES = ['/profile', '/host'];
// /people/[id] 상세도 approved only (bare /people는 peek 허용)
const PEOPLE_DETAIL_RE = /^\/people\/[^/]+/;
// 로그인 필요한 경로 (approval status 무관)
const AUTH_REQUIRED_PREFIXES = ['/onboarding', '/pending-approval', '/rejected'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;
  // Old JWT (배포 전에 발급된) 에는 approvalStatus가 없음 → approved로 간주
  const status = session?.user?.approvalStatus ?? 'approved';
  const onboarded = session?.user?.onboardingComplete ?? false;

  const needsAuth = AUTH_REQUIRED_PREFIXES.some(p => pathname.startsWith(p))
                 || APPROVED_ONLY_PREFIXES.some(p => pathname.startsWith(p))
                 || PEOPLE_DETAIL_RE.test(pathname);

  // 비로그인 유저가 auth 필요 경로 접근 → /login
  if (needsAuth && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 상태로 /login 접근 → 상태에 맞는 홈으로
  if (pathname === '/login' && isLoggedIn) {
    if (status === 'rejected') return NextResponse.redirect(new URL('/rejected', req.url));
    if (status === 'pending') {
      return NextResponse.redirect(new URL(onboarded ? '/pending-approval' : '/onboarding', req.url));
    }
    return NextResponse.redirect(new URL('/people', req.url));
  }

  if (!isLoggedIn) return NextResponse.next();

  // Rejected 유저 — /rejected, /, /onboarding, /profile 허용 (재신청 전 프로필 수정 가능)
  if (status === 'rejected') {
    const allowed = pathname === '/'
      || pathname === '/rejected'
      || pathname.startsWith('/onboarding')
      || pathname.startsWith('/profile');
    if (!allowed) {
      return NextResponse.redirect(new URL('/rejected', req.url));
    }
    return NextResponse.next();
  }

  // Pending 유저 — approved-only 경로 접근 시 onboarding / 승인 대기 페이지로 튕김.
  // JWT의 onboarded 값은 stale 가능(온보딩 완료 직후). 서버 페이지들이 DB-fresh 체크를 재확인함.
  if (status === 'pending') {
    const blocked = APPROVED_ONLY_PREFIXES.some(p => pathname.startsWith(p))
                 || PEOPLE_DETAIL_RE.test(pathname);
    if (blocked) {
      return NextResponse.redirect(new URL(onboarded ? '/pending-approval' : '/onboarding', req.url));
    }
    return NextResponse.next();
  }

  // Approved 유저는 status 대기/거절 페이지에 가면 안됨
  if (pathname === '/pending-approval' || pathname === '/rejected') {
    return NextResponse.redirect(new URL('/people', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon-|apple-touch|manifest).*)'],
};
