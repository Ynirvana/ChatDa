'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PersonCard, type PersonData } from '@/components/PersonCard';
import {
  LOCATIONS, USER_STATUSES, TAGS,
  SPOKEN_LANGUAGES, LOOKING_FOR_OPTIONS, PLATFORMS,
} from '@/lib/constants';
import { NationalityCombobox } from '@/components/NationalityCombobox';
import { FilterSelect, type FilterOption } from '@/components/FilterSelect';
import { track } from '@/lib/analytics';

const trackFilter = (type: string, value: string) => {
  if (value) track('people_filter_apply', { filter_type: type, value });
};

export default function PeopleClient({
  users,
  authed,
  needsOnboarding = false,
  awaitingApproval = false,
}: {
  users: PersonData[];
  authed: boolean;
  /** logged in but onboarding not complete — CTA goes to /onboarding instead of /join */
  needsOnboarding?: boolean;
  /** onboarded but approval_status='pending' — 3 teaser cards, blocked clicks, CTA to /pending-approval */
  awaitingApproval?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [nationality, setNationality] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [offer, setOffer] = useState('');
  const [language, setLanguage] = useState('');
  const [motivation, setMotivation] = useState('');
  const [social, setSocial] = useState('');

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q));
    }
    if (nationality) list = list.filter(u => u.nationality === nationality);
    if (location)    list = list.filter(u => u.location === location);
    if (status)      list = list.filter(u => u.status === status);
    if (offer)       list = list.filter(u => u.tags?.some(t => t.tag === offer && t.category === 'can_do'));
    if (language)    list = list.filter(u => (u.languages ?? []).some(l => l.language === language));
    if (motivation)  list = list.filter(u => (u.looking_for ?? []).includes(motivation));
    if (social)      list = list.filter(u => (u.social_platforms ?? []).includes(social));
    return list;
  }, [users, search, nationality, location, status, offer, language, motivation, social]);

  const activeCount =
    (nationality ? 1 : 0) + (location ? 1 : 0) + (status ? 1 : 0) +
    (offer ? 1 : 0) + (language ? 1 : 0) + (motivation ? 1 : 0) + (social ? 1 : 0);

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

  const clearAll = () => {
    setNationality(''); setLocation(''); setStatus('');
    setOffer(''); setLanguage(''); setMotivation(''); setSocial('');
  };

  // Option 빌더 (맨 위에 '빈 값 = placeholder' 옵션 삽입)
  const locationOpts: FilterOption[] = [
    { value: '', label: 'Any location' },
    ...LOCATIONS.map(l => ({ value: l, label: l })),
  ];
  const statusOpts: FilterOption[] = [
    { value: '', label: 'Everyone' },
    ...USER_STATUSES.map(s => ({ value: s.id, label: s.label })),
  ];
  const offerOpts: FilterOption[] = [
    { value: '', label: 'What they offer' },
    ...TAGS.map(t => ({ value: t, label: t })),
  ];
  const languageOpts: FilterOption[] = [
    { value: '', label: 'Any language' },
    ...SPOKEN_LANGUAGES.map(l => ({ value: l, label: l })),
  ];
  const motivationOpts: FilterOption[] = [
    { value: '', label: 'What brings them' },
    ...LOOKING_FOR_OPTIONS.map(o => ({
      value: o.id,
      label: o.label,
      prefix: <span style={{ fontSize: 14 }}>{o.emoji}</span>,
    })),
  ];
  const socialOpts: FilterOption[] = [
    { value: '', label: 'Any social' },
    ...PLATFORMS.map(p => ({ value: p.id, label: `${p.label} only` })),
  ];

  return (
    <>
      {/* "Join chatda" 배너는 로그인 안 한 방문자에게만. needsOnboarding / awaitingApproval 은 페이지 상단에 전용 배너 있음. */}
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

      {/* Search + Filters toggle */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: filtersOpen ? 14 : 24,
      }}>
        <input
          type="text"
          className="input-light"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '11px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            background: '#FFFFFF',
            border: '1.5px solid rgba(45, 24, 16, .18)',
            color: '#2D1810',
            outline: 'none',
            fontFamily: 'inherit',
            flex: 1,
            minWidth: 0,
            boxShadow: '0 2px 8px rgba(45, 24, 16, .06)',
          }}
        />
        <button
          type="button"
          onClick={() => setFiltersOpen(o => !o)}
          style={{
            padding: '11px 20px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            background: activeCount > 0
              ? 'linear-gradient(135deg, #FF6B5B, #E84393)'
              : '#FFFFFF',
            border: activeCount > 0 ? 'none' : '1.5px solid rgba(45, 24, 16, .18)',
            color: activeCount > 0 ? '#fff' : '#2D1810',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            boxShadow: activeCount > 0
              ? '0 4px 14px rgba(255, 107, 91, .3)'
              : '0 2px 8px rgba(45, 24, 16, .06)',
          }}
        >
          <span>⚙︎ Filters</span>
          {activeCount > 0 && (
            <span style={{
              padding: '1px 7px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              background: 'rgba(255,255,255,.25)',
            }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div style={{
          position: 'relative',
          zIndex: 30,
          padding: 16,
          marginBottom: 24,
          background: 'rgba(255, 255, 255, .55)',
          border: '1px solid rgba(45, 24, 16, .08)',
          borderRadius: 16,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}>
            <FilterSelect
              value={location}
              onChange={v => { setLocation(v); trackFilter('location', v); }}
              options={locationOpts}
              placeholder="Any location"
            />
            {/* Nationality는 197개라 검색 필요 → 기존 Combobox 유지 (variant) */}
            <NationalityCombobox
              value={nationality}
              onChange={v => { setNationality(v); trackFilter('nationality', v); }}
              placeholder="Any nationality"
            />
            <FilterSelect
              value={status}
              onChange={v => { setStatus(v); trackFilter('status', v); }}
              options={statusOpts}
              placeholder="Everyone"
            />
            <FilterSelect
              value={offer}
              onChange={v => { setOffer(v); trackFilter('offer', v); }}
              options={offerOpts}
              placeholder="What they offer"
            />
            <FilterSelect
              value={language}
              onChange={v => { setLanguage(v); trackFilter('language', v); }}
              options={languageOpts}
              placeholder="Any language"
            />
            <FilterSelect
              value={motivation}
              onChange={v => { setMotivation(v); trackFilter('motivation', v); }}
              options={motivationOpts}
              placeholder="What brings them"
            />
            <FilterSelect
              value={social}
              onChange={v => { setSocial(v); trackFilter('social', v); }}
              options={socialOpts}
              placeholder="Any social"
            />
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                marginTop: 12,
                padding: '6px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer',
                background: 'transparent',
                border: '1px solid rgba(45, 24, 16, .18)',
                color: 'rgba(45, 24, 16, .65)',
              }}
            >
              Clear all ({activeCount})
            </button>
          )}
        </div>
      )}

      {/* Result count hint */}
      {(search || activeCount > 0) && (
        <p style={{
          fontSize: 12, color: 'rgba(45, 24, 16, .5)',
          marginBottom: 14, fontWeight: 600,
        }}>
          {filtered.length} {filtered.length === 1 ? 'person' : 'people'} matched
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (() => {
        // 승인 대기: 첫 3장은 선명 teaser, 나머지는 완전 블러. 최소 12장 보이도록 ghost 플레이스홀더로 패딩.
        const AWAITING_CAP = 30;                  // 실제 렌더링 상한
        const MIN_VISIBLE = 12;                   // 빈 슬롯 없이 그리드 꽉 차도록 최소 채움 (awaiting + peek 공용)
        const awaitingList = awaitingApproval ? filtered.slice(0, AWAITING_CAP) : filtered;
        // peek 모드 (!authed, 미인증/미온보딩): 첫 행 sharp, 2~3행 progressive fade
        const peek = !authed && !awaitingApproval && filtered.length >= 3;
        // 3행(≈ 900px) 까지 progressive fade — 밀도감 있게
        const fadeMask = 'linear-gradient(to bottom, black 0px, black 300px, rgba(0,0,0,.55) 500px, rgba(0,0,0,.2) 750px, transparent 960px)';
        const lockedHref = awaitingApproval ? '/pending-approval' : undefined;
        // Ghost 플레이스홀더 — 데이터 부족 시 그리드 빈 슬롯 채움 (awaiting/peek 공용)
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
                // Awaiting 유저의 첫 3장은 unblurred teaser — 사진/이름/정보 선명, 클릭만 lockedHref로 막음
                const unblurred = awaitingApproval && i < 3;
                const card = (
                  <PersonCard
                    person={u}
                    authed={authed}
                    needsOnboarding={needsOnboarding}
                    lockedHref={lockedHref}
                    unblurred={unblurred}
                    onConnect={authed ? handleConnect : undefined}
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
              {/* Ghost 플레이스홀더 — 그리드 마지막 행을 꽉 채우기 위한 blurred 빈 카드 */}
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
                      border: '1px solid rgba(45, 24, 16, .1)',
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

            {/* Awaiting-approval에는 하단 CTA 없음 — 상단 배너에 이미 'Application status' 버튼 있음. peek(비로그인/미온보딩)만 CTA 표시. */}
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
                    boxShadow: '0 14px 34px rgba(255, 107, 91, .34), 0 4px 12px rgba(232, 67, 147, .22), inset 0 1px 0 rgba(255,255,255,.28)',
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
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(45, 24, 16, .4)' }}>
          <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#3D2416' }}>No one here yet</p>
          <p style={{ fontSize: 14 }}>Be the first one! Sign up and create your profile.</p>
        </div>
      )}
    </>
  );
}
