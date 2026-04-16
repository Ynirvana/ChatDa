'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PersonCard, type PersonData } from '@/components/PersonCard';
import { NATIONALITIES, USER_STATUSES, TAGS } from '@/lib/constants';

export default function PeopleClient({
  users,
  authed,
}: {
  users: PersonData[];
  authed: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [nationality, setNationality] = useState('');
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState('');

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q));
    }
    if (nationality) {
      list = list.filter(u => u.nationality === nationality);
    }
    if (status) {
      list = list.filter(u => u.status === status);
    }
    if (tag) {
      list = list.filter(u => u.tags?.some(t => t.tag === tag));
    }
    return list;
  }, [users, search, nationality, status, tag]);

  const handleConnect = async (recipientId: string) => {
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId }),
    });
    if (!res.ok) throw new Error('Failed');
    router.refresh();
  };

  const selectStyle = {
    padding: '10px 16px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    color: '#fff',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 120,
  } as const;

  return (
    <>
      {!authed && (
        <div style={{
          textAlign: 'center',
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(255,107,53,.15), rgba(232,67,147,.15))',
          border: '1px solid rgba(255,107,53,.2)',
          borderRadius: 14,
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>
            See who&apos;s here in Korea →{' '}
          </span>
          <a href="/login" style={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FF6B35, #E84393)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'underline',
          }}>
            Join chatda
          </a>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: 1, minWidth: 180 }}
        />
        <select value={nationality} onChange={e => setNationality(e.target.value)} style={selectStyle}>
          <option value="">All nationalities</option>
          {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          {USER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={tag} onChange={e => setTag(e.target.value)} style={selectStyle}>
          <option value="">All skills</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
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
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.35)' }}>
          <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No one here yet</p>
          <p style={{ fontSize: 14 }}>Be the first one! Sign up and create your profile.</p>
        </div>
      )}
    </>
  );
}
