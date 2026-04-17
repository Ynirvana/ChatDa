'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const dateInputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.08)',
  border: '1.5px solid rgba(255,255,255,.12)',
  borderRadius: 12,
  color: '#fff',
  padding: '12px 16px',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  colorScheme: 'dark',   // 네이티브 date picker도 다크로
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(255,255,255,.55)',
  marginBottom: 6,
  display: 'block',
};

export function StayDatesEditor({
  status,
  initialArrived,
  initialDeparted,
}: {
  status: string | null;
  initialArrived: string | null;
  initialDeparted: string | null;
}) {
  const router = useRouter();
  const [arrived, setArrived] = useState(initialArrived ?? '');
  const [departed, setDeparted] = useState(initialDeparted ?? '');
  const [saving, setSaving] = useState(false);

  if (status === 'local') return null;

  const dirty = arrived !== (initialArrived ?? '') || departed !== (initialDeparted ?? '');

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stayArrived: arrived || null,
          stayDeparted: departed || null,
        }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const arrivedLabel = status === 'expat' ? 'Since when?'
    : status === 'visiting_soon' ? 'When are you arriving?'
    : status === 'visited_before' ? 'Arrived'
    : 'Arrived on';

  const showDeparted = status === 'visitor' || status === 'visited_before';
  const emphasized = status === 'visiting_soon';

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: showDeparted ? '1fr 1fr' : '1fr',
        gap: 12,
      }}>
        <div>
          <label style={{
            ...labelStyle,
            color: emphasized ? '#FF6B35' : 'rgba(255,255,255,.55)',
          }}>
            {arrivedLabel}
          </label>
          <input
            type="date"
            value={arrived}
            onChange={e => setArrived(e.target.value)}
            style={{
              ...dateInputStyle,
              borderColor: emphasized && !arrived ? '#FF6B35' : 'rgba(255,255,255,.12)',
            }}
          />
        </div>
        {showDeparted && (
          <div>
            <label style={labelStyle}>
              {status === 'visited_before' ? 'Departed' : 'Until'}
            </label>
            <input
              type="date"
              value={departed}
              onChange={e => setDeparted(e.target.value)}
              min={arrived || undefined}
              style={dateInputStyle}
            />
          </div>
        )}
      </div>

      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          style={{
            marginTop: 12,
            padding: '9px 22px', borderRadius: 999, border: 'none',
            fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #FF6B35, #E84393)',
            color: '#fff',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      )}
    </div>
  );
}
