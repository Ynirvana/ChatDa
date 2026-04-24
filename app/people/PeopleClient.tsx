'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PersonCard, type PersonData } from '@/components/PersonCard';
import { track } from '@/lib/analytics';

type SortTab = 'recently_joined' | 'new_arrivals' | 'hosting';

const TABS: { id: SortTab; label: string }[] = [
  { id: 'recently_joined', label: 'Recently joined' },
  { id: 'new_arrivals',    label: 'New arrivals' },
  { id: 'hosting',         label: 'Hosting' },
];

export default function PeopleClient({
  users,
  authed,
  needsOnboarding = false,
  awaitingApproval = false,
  currentUserId,
}: {
  users: PersonData[];
  authed: boolean;
  needsOnboarding?: boolean;
  awaitingApproval?: boolean;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [search, setSearch]   = useState('');
  const [tab, setTab]         = useState<SortTab>('recently_joined');

  const filtered = useMemo(() => {
    let list = [...users];

    // Tab: sort / filter
    if (tab === 'recently_joined') {
      list.sort((a, b) => {
        const at = a.created_at ?? '';
        const bt = b.created_at ?? '';
        return bt.localeCompare(at);
      });
    } else if (tab === 'new_arrivals') {
      // Sort by stay_arrived DESC, nulls last
      list.sort((a, b) => {
        const as = a.stay_arrived ?? '';
        const bs = b.stay_arrived ?? '';
        if (!as && !bs) return 0;
        if (!as) return 1;
        if (!bs) return -1;
        return bs.localeCompare(as);
      });
    } else if (tab === 'hosting') {
      list = list.filter(u => u.is_hosting);
    }

    // Name search on top of sorted list
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q));
    }

    return list;
  }, [users, search, tab]);

  const handleConnect = async (recipientId: string) => {
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId }),
    });
    if (!res.ok) throw new Error('Failed');
    track('connect_request_send', { source: 'people_card', recipient_id: recipientId });
    router.refresh();
  };

  return (
    <>
      {/* Join banner — unauthenticated visitors only */}
      {!authed && !needsOnboarding && !awaitingApproval && (
        <div style={{
          textAlign: 'center',
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(255,107,91,.10), rgba(232,67,147,.08))',
          border: '1px solid rgba(255,107,91,.25)',
          borderRadius: 14,
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#3D2416' }}>
            See who&apos;s here in Korea →{' '}
          </span>
          <a href="/join" style={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'underline',
          }}>
            Join chatda
          </a>
        </div>
      )}

      {/* Sort tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: '9px 18px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all .15s',
              ...(tab === t.id
                ? {
                    background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                    border: 'none',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(255,107,91,.30)',
                  }
                : {
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(45,24,16,.18)',
                    color: '#2D1810',
                    boxShadow: '0 2px 8px rgba(45,24,16,.06)',
                  }),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Name search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          className="input-light"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            background: '#FFFFFF',
            border: '1.5px solid rgba(45,24,16,.18)',
            color: '#2D1810',
            outline: 'none',
            fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(45,24,16,.06)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Result count hint (search only) */}
      {search.trim() && (
        <p style={{
          fontSize: 12, color: 'rgba(45,24,16,.5)',
          marginBottom: 14, fontWeight: 600,
        }}>
          {filtered.length} {filtered.length === 1 ? 'person' : 'people'} matched
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (() => {
        const AWAITING_CAP = 30;
        const MIN_VISIBLE  = 12;
        const awaitingList = awaitingApproval ? filtered.slice(0, AWAITING_CAP) : filtered;
        const peek = !authed && !awaitingApproval && filtered.length >= 3;
        const fadeMask = 'linear-gradient(to bottom, black 0px, black 300px, rgba(0,0,0,.55) 500px, rgba(0,0,0,.2) 750px, transparent 960px)';
        const lockedHref = awaitingApproval ? '/pending-approval' : undefined;
        const ghostCount = (awaitingApproval || peek)
          ? Math.max(0, MIN_VISIBLE - awaitingList.length)
          : 0;
        return (
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              alignItems: 'stretch',
              ...(peek ? {
                WebkitMaskImage: fadeMask,
                maskImage: fadeMask,
                pointerEvents: 'none' as const,
              } : {}),
            }}>
              {awaitingList.map((u, i) => {
                const heavilyBlurred = awaitingApproval && i >= 3;
                const unblurred = awaitingApproval && i < 3;
                const card = (
                  <PersonCard
                    person={u}
                    authed={authed}
                    needsOnboarding={needsOnboarding}
                    lockedHref={lockedHref}
                    unblurred={unblurred}
                    onConnect={authed ? handleConnect : undefined}
                    isMe={!!currentUserId && u.id === currentUserId}
                  />
                );
                if (heavilyBlurred) {
                  return (
                    <div key={u.id} style={{
                      filter: 'blur(16px)',
                      pointerEvents: 'none',
                      opacity: 0.85,
                      userSelect: 'none',
                    }} aria-hidden="true">
                      {card}
                    </div>
                  );
                }
                return <div key={u.id}>{card}</div>;
              })}
              {/* Ghost placeholders for awaiting/peek modes */}
              {Array.from({ length: ghostCount }).map((_, i) => {
                const gradients = [
                  'linear-gradient(135deg, #FFB4A6, #FF6B5B)',
                  'linear-gradient(135deg, #A8E6CF, #4DCCBD)',
                  'linear-gradient(135deg, #FFC3A0, #FFAFBD)',
                  'linear-gradient(135deg, #B4A7F2, #7E74D4)',
                  'linear-gradient(135deg, #FFDDB0, #FFB87B)',
                  'linear-gradient(135deg, #FFB6D5, #E84393)',
                ];
                const cover = gradients[i % gradients.length];
                return (
                  <div
                    key={`ghost-${i}`}
                    aria-hidden="true"
                    style={{
                      filter: 'blur(16px)',
                      pointerEvents: 'none',
                      opacity: 0.85,
                      userSelect: 'none',
                      background: '#FFFFFF',
                      borderRadius: 18,
                      border: '1px solid rgba(45,24,16,.1)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: 280,
                    }}
                  >
                    <div style={{ height: 80, background: cover, position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: '50%', bottom: -40,
                        transform: 'translateX(-50%)',
                        width: 80, height: 80, borderRadius: '50%',
                        border: '3px solid #FFFFFF',
                        background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                      }} />
                    </div>
                    <div style={{ padding: '52px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ height: 14, background: 'rgba(45,24,16,.08)', borderRadius: 6, width: '50%', margin: '0 auto' }} />
                      <div style={{ height: 12, background: 'rgba(45,24,16,.06)', borderRadius: 6, width: '70%', margin: '0 auto' }} />
                      <div style={{ flex: 1 }} />
                      <div style={{ height: 32, background: 'linear-gradient(135deg, rgba(255,107,91,.3), rgba(232,67,147,.3))', borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {peek && (
              <div style={{
                marginTop: -40,
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 40,
                paddingBottom: 20,
                position: 'relative',
                zIndex: 2,
              }}>
                <Link
                  href={needsOnboarding ? '/onboarding' : '/join'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '16px 32px',
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                    color: '#fff',
                    textDecoration: 'none',
                    boxShadow: '0 14px 34px rgba(255,107,91,.34), 0 4px 12px rgba(232,67,147,.22), inset 0 1px 0 rgba(255,255,255,.28)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {needsOnboarding
                    ? 'Complete profile to see everyone →'
                    : `Join to see all ${users.length}+ people →`}
                </Link>
              </div>
            )}
          </div>
        );
      })() : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(45,24,16,.4)' }}>
          <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#3D2416' }}>
            {tab === 'hosting' ? 'No one hosting right now' : 'No one here yet'}
          </p>
          <p style={{ fontSize: 14 }}>
            {tab === 'hosting'
              ? 'Check back soon — meetups get added regularly.'
              : 'Be the first one! Sign up and create your profile.'}
          </p>
        </div>
      )}
    </>
  );
}
