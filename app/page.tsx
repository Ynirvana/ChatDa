import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Orb } from '@/components/ui/Card';
import { Nav } from '@/components/ui/Nav';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { backendFetch, type ApiProfile } from '@/lib/server-api';
import { RefTracker } from '@/components/RefTracker';

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    // approval_status는 session callback에서 DB-fresh로 채워짐. undefined면 기존 유저(backfill 전) → approved 취급.
    const status = session.user.approvalStatus ?? 'approved';
    // 온보딩 여부는 backend/me 가 source of truth (JWT는 stale 가능)
    let onboarded = false;
    try {
      const me = await backendFetch<ApiProfile>('/users/me');
      onboarded = !!me.onboarding_complete;
    } catch {
      // profile 없음 → 신규 유저
    }

    if (status === 'rejected') redirect('/rejected');
    if (!onboarded) redirect('/onboarding');
    if (status === 'pending') redirect('/pending-approval');
    redirect('/people');
  }

  return (
    <div className="page-bg-light">
      <Suspense fallback={null}>
        <RefTracker />
      </Suspense>
      <Nav user={session?.user} isAdmin={isAdminEmail(session?.user?.email)} light />

      {/* Sunset orbs — 크림 베이스 위 워터컬러 같은 웜 톤 */}
      <Orb size={640} color="rgba(255, 140, 120, .22)" top={-140} left={-220} />
      <Orb size={440} color="rgba(232, 67, 147, .14)" top={180} right={-120} delay={2} />
      <Orb size={380} color="rgba(255, 196, 140, .20)" bottom={-80} left={80} delay={4} />

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center',
        padding: '110px 20px 140px',
        maxWidth: 640, margin: '0 auto',
      }}>
        {/* Tag pill — 엘리베이티드 글래스 + 코랄 라이브 닷 */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 18px', borderRadius: 999,
          background: 'rgba(255, 255, 255, .88)',
          border: '1px solid rgba(255, 107, 91, .18)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 10px rgba(45, 24, 16, .05)',
          fontSize: 13, fontWeight: 700, color: '#5C3E36',
          marginBottom: 36, letterSpacing: 0.3,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#FF6B5B',
            boxShadow: '0 0 0 3px rgba(255, 107, 91, .18)',
          }} />
          Korea&apos;s international community
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.25rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          marginBottom: 28,
          background: 'linear-gradient(135deg, #FF6B5B 0%, #E84393 55%, #6C5CE7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          // 크림 배경 위 텍스트에 미묘한 lift
          filter: 'drop-shadow(0 1px 0 rgba(255, 255, 255, .5))',
        }}>
          See who else is<br />here in Korea.
        </h1>

        <p style={{
          fontSize: 19, fontWeight: 500,
          color: '#3D2416',
          opacity: 0.72,
          maxWidth: 480, margin: '0 auto 48px',
          lineHeight: 1.55,
        }}>
          The person you&apos;re looking for already has a profile here.
        </p>

        {/* Clay-style CTA — 2단 그림자 + inset highlight */}
        <Link href="/people" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <button style={{
            padding: '18px 46px', borderRadius: 999,
            fontFamily: 'inherit',
            fontSize: 16, fontWeight: 800,
            letterSpacing: 0.2,
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #FF6B5B 0%, #E84393 100%)',
            color: '#ffffff',
            border: 'none',
            boxShadow: [
              '0 14px 38px rgba(255, 107, 91, .35)',          // 큰 코랄 글로우
              '0 4px 12px rgba(232, 67, 147, .22)',           // 핑크 베이스
              'inset 0 1px 0 rgba(255, 255, 255, .28)',       // 상단 highlight (clay)
              'inset 0 -2px 0 rgba(130, 20, 70, .15)',        // 하단 그림자 (clay)
            ].join(', '),
            transition: 'transform .2s, box-shadow .2s',
          }}>
            Browse Profiles →
          </button>
        </Link>

        <p style={{
          marginTop: 24,
          fontSize: 13, fontWeight: 700,
          color: '#3D2416',
          letterSpacing: 0.1,
        }}>
          Exchange students · Expats · Creators · Digital nomads{' '}
          <span style={{ opacity: 0.45, margin: '0 4px' }}>—</span>{' '}
          all in Korea
        </p>
      </section>
    </div>
  );
}
