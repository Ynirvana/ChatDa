import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth, signIn } from '@/lib/auth';
import {
  lookupInvite,
  INVITE_COOKIE_NAME,
  INVITE_COOKIE_MAX_AGE,
  INVITE_CAP,
  type InviteState,
} from '@/lib/invites';

interface Params {
  token: string;
}

// ── Metadata ────────────────────────────────────────────────────────
// OG 이미지는 /public/og-invite.jpg (1408x736, ~1.91:1).
export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { token } = await params;
  const invite = await lookupInvite(token);

  const title = invite.state === 'valid'
    ? "You're invited to ChatDa"
    : invite.state === 'expired' ? 'Invite expired — ChatDa'
    : invite.state === 'claimed' ? 'Invite already used — ChatDa'
    : 'Invite only — ChatDa';

  const description = invite.state === 'valid'
    ? "Find your people in Korea. Invite only while we're small."
    : "Korea's international community. Invite only while we're small.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: '/og-invite.jpg',
          width: 1408,
          height: 736,
          alt: "You're invited to ChatDa",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-invite.jpg'],
    },
    robots: { index: false, follow: false },  // invite URL은 index 하지 말기
  };
}

// ── Page ────────────────────────────────────────────────────────────

export default async function InvitePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;

  const session = await auth();
  if (session?.user?.id) redirect('/');

  const invite = await lookupInvite(token);

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: 'linear-gradient(135deg, #FFF5E1 0%, #FFE4C2 45%, #FFD4B3 100%)',
      overflow: 'hidden',
    }}>
      {/* Coral glow — top-left, OG 이미지와 동일한 분위기 */}
      <div style={{
        position: 'absolute',
        top: '-25%', left: '-15%',
        width: 'min(80vw, 900px)', height: 'min(80vw, 900px)',
        background: 'radial-gradient(circle, rgba(255,107,91,.32) 0%, rgba(255,107,91,.12) 32%, rgba(255,107,91,0) 62%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Warm magenta hint — bottom-right for depth */}
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
        animation: 'inviteFadeIn .6s ease-out',
      }}>
        {invite.state === 'valid' ? (
          <ValidInvitePanel
            token={token}
            expiresText={invite.expiresText ?? ''}
          />
        ) : (
          <InvalidInvitePanel state={invite.state} />
        )}
      </section>

      <style>{`
        @keyframes inviteFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Valid panel ─────────────────────────────────────────────────────

function ValidInvitePanel({
  token,
  expiresText,
}: {
  token: string;
  expiresText: string;
}) {
  async function acceptAndSignIn() {
    'use server';
    const cookieStore = await cookies();
    cookieStore.set(INVITE_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: INVITE_COOKIE_MAX_AGE,
      path: '/',
    });
    // '/' → home page가 status/onboarded 기반으로 라우팅. 신규 invited → /onboarding, 기존 유저는 각자 자리로.
    await signIn('google', { redirectTo: '/' });
  }

  return (
    <>
      {/* Sunset semicircle icon — OG 이미지와 동일 스타일 */}
      <svg
        width="64"
        height="38"
        viewBox="0 0 64 38"
        fill="none"
        aria-hidden="true"
        style={{ display: 'block', margin: '0 auto 40px' }}
      >
        <defs>
          <linearGradient id="sunsetSun" x1="32" y1="6" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFC140" />
            <stop offset="0.55" stopColor="#FF8A5C" />
            <stop offset="1" stopColor="#FF6B5B" />
          </linearGradient>
        </defs>
        {/* Horizon */}
        <line x1="0" y1="32" x2="64" y2="32" stroke="rgba(45,24,16,.18)" strokeWidth="1" />
        {/* Sun rising */}
        <path d="M 6 32 A 26 26 0 0 1 58 32 Z" fill="url(#sunsetSun)" />
      </svg>

      {/* YOU'RE INVITED label */}
      <p style={{
        fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
        fontWeight: 800,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: '#E84F3D',
        marginBottom: 36,
        marginTop: 0,
        lineHeight: 1,
        // indent 반대로 letter-spacing 보정 — 우측 잘림 방지
        paddingLeft: '0.25em',
      }}>
        You&apos;re invited
      </p>

      {/* Hero: Find your people / in Korea. */}
      <h1 style={{
        fontSize: 'clamp(3rem, 9vw, 5.25rem)',
        fontWeight: 900,
        letterSpacing: '-0.045em',
        lineHeight: 1.02,
        marginBottom: 32,
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

      {/* CTA — Continue with Google (더 크게) */}
      <form action={acceptAndSignIn}>
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

      {/* Expires */}
      <div style={{
        marginTop: 28,
        fontSize: 12,
        fontWeight: 800,
        color: 'rgba(45, 24, 16, .52)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}>
        {expiresText}
      </div>
    </>
  );
}

// ── Invalid panel ──────────────────────────────────────────────────

function InvalidInvitePanel({ state }: { state: InviteState }) {
  const title = state === 'expired' ? 'Invite expired'
    : state === 'claimed' ? 'Invite already used'
    : 'Invite link not recognized';

  const explainer = state === 'expired'
    ? "This invite link expired, but you can still sign up — we'll review your profile."
    : state === 'claimed'
      ? "This invite was already used, but you can still sign up — we'll review your profile."
      : "We couldn't find this invite. You can still sign up normally.";

  return (
    <>
      <div style={{
        width: 88, height: 88, borderRadius: 22,
        background: 'linear-gradient(135deg, rgba(45, 24, 16, .12), rgba(45, 24, 16, .05))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, margin: '0 auto 32px',
        border: '1px solid rgba(45, 24, 16, .1)',
      }}>
        🔒
      </div>

      <h1 style={{
        fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
        fontWeight: 900, letterSpacing: -1,
        marginBottom: 14, color: '#2D1810',
      }}>
        {title}
      </h1>
      <p style={{
        fontSize: 16, color: 'rgba(45, 24, 16, .68)',
        lineHeight: 1.55, marginBottom: 32,
      }}>
        {explainer}
      </p>

      <Link href="/join" style={{ textDecoration: 'none', display: 'inline-block', width: '100%' }}>
        <button style={{
          width: '100%',
          padding: '14px 28px', borderRadius: 999,
          fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
          background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
          color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: '0 10px 26px rgba(255, 107, 91, .3), inset 0 1px 0 rgba(255,255,255,.25)',
        }}>
          Sign up →
        </button>
      </Link>

      <p style={{
        marginTop: 36,
        fontSize: 12, fontWeight: 700,
        color: 'rgba(45, 24, 16, .45)',
        letterSpacing: 0.3,
      }}>
        First {INVITE_CAP} members. Keep it small.
      </p>
    </>
  );
}
