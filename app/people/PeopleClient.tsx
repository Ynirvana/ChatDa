'use client';

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
}: {
  users: PersonData[];
  authed: boolean;
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
      {!authed && (
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
          <a href="/login" style={{
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
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}>
          {filtered.map(u => (
            <PersonCard
              key={u.id}
              person={u}
              authed={authed}
              onConnect={authed ? handleConnect : undefined}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(45, 24, 16, .4)' }}>
          <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#3D2416' }}>No one here yet</p>
          <p style={{ fontSize: 14 }}>Be the first one! Sign up and create your profile.</p>
        </div>
      )}
    </>
  );
}
