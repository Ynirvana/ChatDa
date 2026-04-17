'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const dateInputStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1.5px solid rgba(45, 24, 16, .15)',
  borderRadius: 12,
  color: '#2D1810',
  padding: '12px 16px',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  colorScheme: 'light',
  width: '100%',
  boxShadow: '0 1px 4px rgba(45, 24, 16, .04)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: 'rgba(45, 24, 16, .6)',
  marginBottom: 6,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
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
            color: emphasized ? '#FF6B5B' : 'rgba(45, 24, 16, .6)',
          }}>
            {arrivedLabel}
          </label>
          <input
            type="date"
            value={arrived}
            onChange={e => setArrived(e.target.value)}
            style={{
              ...dateInputStyle,
              borderColor: emphasized && !arrived ? '#FF6B5B' : 'rgba(45, 24, 16, .15)',
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
            padding: '11px 24px', borderRadius: 999, border: 'none',
            fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
            color: '#fff',
            fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(255, 107, 91, .3)',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      )}
    </div>
  );
}
