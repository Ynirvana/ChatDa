import Link from 'next/link';
import { signIn, auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Orb } from '@/components/ui/Card';

// /login — 기존 회원 재로그인. 신규(초대) 유저는 /invite/[token]에서 signIn 흐름 탐.
// NextAuth pages.signIn: '/login' — 세션 만료나 직접 접근 시 여기 떨어짐.

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect('/');

  const { error } = await searchParams;
  // NextAuth signIn callback이 false 반환하면 error=AccessDenied로 돌아옴 (invite-only gate).
  // 다른 에러 코드(OAuthSignin, Configuration 등)는 일반 문구로 fallback.
  const showInviteError = error === 'AccessDenied';
  const showGenericError = !!error && error !== 'AccessDenied';

  return (
    <div className="page-bg-light" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Orb size={560} color="rgba(255, 140, 120, .22)" top={-120} left={-180} />
      <Orb size={400} color="rgba(232, 67, 147, .14)" bottom={-100} right={-100} delay={2} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        {/* Sunset semicircle — /invite/[token], /join과 동일 family */}
        <svg
          width="56" height="34" viewBox="0 0 56 34" fill="none"
          aria-hidden="true"
          style={{ display: 'block', marginBottom: 28 }}
        >
          <defs>
            <linearGradient id="loginSun" x1="28" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFC140" />
              <stop offset="0.55" stopColor="#FF8A5C" />
              <stop offset="1" stopColor="#FF6B5B" />
            </linearGradient>
          </defs>
          <line x1="0" y1="28" x2="56" y2="28" stroke="rgba(45,24,16,.18)" strokeWidth="1" />
          <path d="M 5 28 A 23 23 0 0 1 51 28 Z" fill="url(#loginSun)" />
        </svg>

        <h1 style={{
          fontSize: 32, fontWeight: 900, letterSpacing: -1,
          marginBottom: 10, color: '#2D1810',
        }}>
          {showInviteError ? 'Invite required' : 'Welcome back'}
        </h1>
        <p style={{
          fontSize: 16, color: 'rgba(45, 24, 16, .65)',
          marginBottom: showInviteError || showGenericError ? 24 : 36,
          lineHeight: 1.55,
        }}>
          {showInviteError
            ? "That Google account isn't registered with ChatDa."
            : showGenericError
              ? 'Something went wrong. Please try again.'
              : 'Sign in to ChatDa.'}
        </p>

        {/* Invite-only error banner — 더 자세한 안내 + /join 링크 */}
        {showInviteError && (
          <div style={{
            width: '100%',
            marginBottom: 24,
            padding: '16px 20px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(255, 107, 91, .12), rgba(232, 67, 147, .08))',
            border: '1px solid rgba(255, 107, 91, .28)',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: 13, color: 'rgba(45, 24, 16, .78)', lineHeight: 1.55, marginBottom: 10 }}>
              ChatDa is invite-only. If you have an invite link, just click it. Otherwise, request one on Threads.
            </p>
            <Link href="/join" style={{
              display: 'inline-block',
              fontSize: 13, fontWeight: 800, color: '#E84F3D',
              textDecoration: 'none',
            }}>
              Request an invite →
            </Link>
          </div>
        )}

        <div style={{
          width: '100%',
          background: 'rgba(255, 255, 255, .88)',
          border: '1px solid rgba(45, 24, 16, .08)',
          borderRadius: 18,
          padding: 24,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 28px rgba(45, 24, 16, .08), 0 2px 6px rgba(45, 24, 16, .04)',
        }}>
          <form action={async () => {
            'use server';
            // '/' → home page가 status/onboarded 기반 라우팅. approved → /people, pending → /pending-approval, rejected → /rejected.
            await signIn('google', { redirectTo: '/' });
          }}>
            <button type="submit" style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              background: '#FFFFFF', color: '#2D1810',
              padding: '14px 28px', borderRadius: 999,
              fontSize: 16, fontWeight: 700,
              border: '1.5px solid rgba(45, 24, 16, .12)',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(45, 24, 16, .06)',
              transition: 'all .15s',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        {/* New members route — 에러 배너에 이미 있으면 중복이라 숨김 */}
        {!showInviteError && (
        <p style={{
          fontSize: 13, color: 'rgba(45, 24, 16, .55)',
          marginTop: 24, lineHeight: 1.5,
        }}>
          New to ChatDa?{' '}
          <Link href="/join" style={{
            color: '#E84F3D', fontWeight: 700, textDecoration: 'none',
          }}>
            Request an invite →
          </Link>
        </p>
        )}
      </div>
    </div>
  );
}
