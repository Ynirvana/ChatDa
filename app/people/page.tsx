import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { backendFetch, type ApiProfile } from '@/lib/server-api';
import { Nav } from '@/components/ui/Nav';
import { Orb } from '@/components/ui/Card';
import type { PersonData } from '@/components/PersonCard';
import PeopleClient from './PeopleClient';

export const revalidate = 60;

interface DirectoryResponse {
  users: PersonData[];
}

export default async function PeoplePage() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  // 로그인했어도 onboarding 미완료면 "peek" 모드 — 미인증 유저처럼 블러
  let onboarded = false;
  if (loggedIn) {
    try {
      const me = await backendFetch<ApiProfile>('/users/me');
      onboarded = !!me.onboarding_complete;
    } catch {
      onboarded = false;
    }
  }
  // 승인 대기 중인 유저 — onboarded이지만 approvalStatus='pending'
  const awaitingApproval = loggedIn && onboarded && session?.user?.approvalStatus === 'pending';
  const authed = loggedIn && onboarded && !awaitingApproval;
  const needsOnboarding = loggedIn && !onboarded;

  const data = await backendFetch<DirectoryResponse>('/users/directory').catch(
    () => ({ users: [] }) as DirectoryResponse,
  );

  return (
    <div className="page-bg-light">
      <Nav user={session?.user} isAdmin={isAdminEmail(session?.user?.email)} light />
      <Orb size={500} color="rgba(255, 140, 120, .18)" top={100} left={-200} />
      <Orb size={350} color="rgba(232, 67, 147, .12)" top={300} right={-100} delay={2} />

      <section style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 20px 80px',
      }}>
        {awaitingApproval && (
          <div style={{
            marginBottom: 28,
            padding: '18px 22px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(255, 193, 64, .14), rgba(255, 138, 92, .10))',
            border: '1px solid rgba(255, 138, 92, .28)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}>
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#2D1810', marginBottom: 4 }}>
                ⏳ Waiting for approval
              </div>
              <div style={{ fontSize: 13, color: 'rgba(45, 24, 16, .65)', lineHeight: 1.5 }}>
                Here&apos;s a peek. We&apos;ll email you once your application is reviewed.
              </div>
            </div>
            <Link
              href="/pending-approval"
              style={{
                padding: '11px 22px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                background: 'rgba(255, 255, 255, .7)',
                color: '#2D1810',
                textDecoration: 'none',
                border: '1px solid rgba(45, 24, 16, .14)',
                whiteSpace: 'nowrap',
              }}
            >
              Application status →
            </Link>
          </div>
        )}

        {needsOnboarding && (
          <div style={{
            marginBottom: 28,
            padding: '18px 22px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(255, 107, 91, .10), rgba(232, 67, 147, .08))',
            border: '1px solid rgba(255, 107, 91, .22)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}>
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#2D1810', marginBottom: 4 }}>
                Finish your profile to connect
              </div>
              <div style={{ fontSize: 13, color: 'rgba(45, 24, 16, .65)', lineHeight: 1.5 }}>
                You&apos;re getting a preview. Complete your profile to see full bios, social links, and say hi.
              </div>
            </div>
            <Link
              href="/onboarding"
              style={{
                padding: '11px 22px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                color: '#fff',
                textDecoration: 'none',
                boxShadow: '0 8px 22px rgba(255, 107, 91, .28), inset 0 1px 0 rgba(255,255,255,.25)',
                whiteSpace: 'nowrap',
              }}
            >
              Complete profile →
            </Link>
          </div>
        )}

        <h1 style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          fontWeight: 900,
          letterSpacing: -1,
          marginBottom: 6,
          background: 'linear-gradient(135deg, #FF6B5B, #E84393, #6C5CE7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          People
        </h1>
        <p style={{
          fontSize: 14,
          color: 'rgba(45, 24, 16, .55)',
          marginBottom: 28,
        }}>
          See who&apos;s here in Korea
        </p>

        <PeopleClient
          users={data.users}
          authed={authed}
          needsOnboarding={needsOnboarding}
          awaitingApproval={awaitingApproval}
          currentUserId={session?.user?.id}
        />
      </section>
    </div>
  );
}
