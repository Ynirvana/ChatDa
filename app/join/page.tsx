import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';

// /join — 일반 회원가입 안내 페이지. "Apply" 프레이밍 X — 평범한 signup flow.
// 승인 대기 안내는 온보딩 완료 후 /pending-approval 에서만.
// 토큰이 있는 실제 초대 링크는 /invite/[token] (즉시 승인 경로).

export default async function JoinPage() {
  const session = await auth();
  // 이미 로그인된 유저는 상태 기반 라우팅 (approved → /people, pending → /pending-approval 등).
  if (session?.user?.id) redirect('/');

  async function continueWithGoogle() {
    'use server';
    // '/' 로 redirect — home page가 status 기반으로 정확한 목적지로 라우팅.
    // 신규 → /onboarding, 기존 approved+onboarded → /people, pending → /pending-approval 등.
    await signIn('google', { redirectTo: '/' });
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: 'linear-gradient(135deg, #FFF5E1 0%, #FFE4C2 45%, #FFD4B3 100%)',
      overflow: 'hidden',
    }}>
      {/* Coral glow — top-left, same family as /invite/[token] */}
      <div style={{
        position: 'absolute',
        top: '-25%', left: '-15%',
        width: 'min(80vw, 900px)', height: 'min(80vw, 900px)',
        background: 'radial-gradient(circle, rgba(255,107,91,.32) 0%, rgba(255,107,91,.12) 32%, rgba(255,107,91,0) 62%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Warm magenta hint — bottom-right */}
      <div style={{
        position: 'absolute',
        bottom: '-20%', right: '-18%',
        width: 'min(70vw, 720px)', height: 'min(70vw, 720px)',
        background: 'radial-gradient(circle, rgba(232,67,147,.14) 0%, rgba(232,67,147,.05) 40%, rgba(232,67,147,0) 65%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 640, margin: '0 auto',
        padding: '88px 24px 120px',
        textAlign: 'center',
        animation: 'joinFadeIn .6s ease-out',
      }}>
        {/* Sunset semicircle icon — OG와 /invite/[token]과 동일 family */}
        <svg
          width="64"
          height="38"
          viewBox="0 0 64 38"
          fill="none"
          aria-hidden="true"
          style={{ display: 'block', margin: '0 auto 40px' }}
        >
          <defs>
            <linearGradient id="joinSun" x1="32" y1="6" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFC140" />
              <stop offset="0.55" stopColor="#FF8A5C" />
              <stop offset="1" stopColor="#FF6B9D" />
            </linearGradient>
          </defs>
          <line x1="0" y1="32" x2="64" y2="32" stroke="rgba(45,24,16,.18)" strokeWidth="1" />
          <path d="M 6 32 A 26 26 0 0 1 58 32 Z" fill="url(#joinSun)" />
        </svg>

        {/* Eyebrow — /invite/[token]의 "YOU'RE INVITED" 대응. 초대 없이 온 방문자용. */}
        <p style={{
          fontSize: 'clamp(1rem, 2.8vw, 1.5rem)',
          fontWeight: 500,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#5C3E36',
          marginBottom: 48,
          marginTop: 0,
          lineHeight: 1,
          // letter-spacing 우측 잘림 보정
          paddingLeft: '0.25em',
        }}>
          You found us
        </p>

        {/* Hero: Find your people / in Korea. */}
        <h1 style={{
          fontSize: 'clamp(3rem, 9vw, 5.25rem)',
          fontWeight: 900,
          letterSpacing: '-0.045em',
          lineHeight: 1.02,
          marginBottom: 36,
          marginTop: 0,
        }}>
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, #FF6B5B 0%, #E84393 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 0 rgba(255,255,255,.5))',
          }}>
            Find your people
          </span>
          <span style={{ display: 'block', color: '#2D1810' }}>
            in Korea.
          </span>
        </h1>

        {/* Subline */}
        <p style={{
          fontSize: 'clamp(1.0625rem, 2.4vw, 1.375rem)',
          color: '#5C3E36',
          fontWeight: 500,
          lineHeight: 1.5,
          marginBottom: 52,
          marginTop: 0,
        }}>
          Korea&apos;s international community
        </p>

        {/* CTA — Continue with Google */}
        <form action={continueWithGoogle}>
          <button type="submit" style={{
            width: '100%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            padding: '20px 32px', borderRadius: 999,
            fontSize: 17, fontWeight: 800, fontFamily: 'inherit',
            background: 'linear-gradient(135deg, #FF6B5B 0%, #E84393 100%)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: [
              '0 20px 48px rgba(255, 107, 91, .38)',
              '0 6px 16px rgba(232, 67, 147, .26)',
              'inset 0 1px 0 rgba(255, 255, 255, .32)',
              'inset 0 -2px 0 rgba(130, 20, 70, .18)',
            ].join(', '),
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".85"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".7"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".55"/>
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Footer — already a member */}
        <p style={{
          fontSize: 14,
          color: 'rgba(45, 24, 16, .52)',
          marginTop: 28,
          lineHeight: 1.5,
        }}>
          Already a member?{' '}
          <Link href="/login" style={{
            color: '#E84F3D', fontWeight: 700, textDecoration: 'none',
          }}>
            Log in →
          </Link>
        </p>
      </section>

      <style>{`
        @keyframes joinFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
