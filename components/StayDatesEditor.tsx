'use client';

import { useCallback, useState } from 'react';
import { useProfileEdit } from './ProfileEditProvider';

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

/** status별 라벨 / 입력 정밀도 정의 */
function getStatusConfig(status: string | null) {
  // long-term stays: month 정밀도. short-term: day 정밀도.
  switch (status) {
    case 'expat':
      return { arrivedLabel: 'Living here since', departedLabel: 'Planning to leave', precision: 'month' as const };
    case 'worker':
      return { arrivedLabel: 'Started work', departedLabel: 'Contract / plan ends', precision: 'month' as const };
    case 'exchange_student':
      return { arrivedLabel: 'Semester start', departedLabel: 'Semester end', precision: 'date' as const };
    case 'visitor':
      return { arrivedLabel: 'Arrival', departedLabel: 'Departure', precision: 'date' as const };
    // 레거시
    case 'visiting_soon':
      return { arrivedLabel: 'Arriving on', departedLabel: 'Leaving on', precision: 'date' as const };
    case 'visited_before':
      return { arrivedLabel: 'Arrived', departedLabel: 'Departed', precision: 'date' as const };
    default:
      return { arrivedLabel: 'Arrived', departedLabel: 'Leaving', precision: 'date' as const };
  }
}

export function StayDatesEditor({
  status,
  initialArrived,
  initialDeparted,
}: {
  status: string | null;
  initialArrived: string | null;
  initialDeparted: string | null;
}) {
  const cfg = getStatusConfig(status);
  const isMonth = cfg.precision === 'month';

  // Month picker면 'YYYY-MM-DD' → 'YYYY-MM'로 trim.
  const toMonth = (v: string | null) => (v ? v.slice(0, 7) : '');
  const initialA = isMonth ? toMonth(initialArrived) : (initialArrived ?? '');
  const initialD = isMonth ? toMonth(initialDeparted) : (initialDeparted ?? '');

  const [arrived, setArrived] = useState(initialA);
  const [departed, setDeparted] = useState(initialD);

  const dirty = arrived !== initialA || departed !== initialD;

  const save = useCallback(async () => {
    const normalize = (v: string): string | null => {
      if (!v) return null;
      if (isMonth && /^\d{4}-\d{2}$/.test(v)) return `${v}-01`;
      return v;
    };
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stayArrived: normalize(arrived),
        stayDeparted: normalize(departed),
      }),
    });
    if (!res.ok) throw new Error('Failed to save dates');
  }, [arrived, departed, isMonth]);

  useProfileEdit('stay-dates', dirty, save);

  if (status === 'local') return null;

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        <div>
          <label style={labelStyle}>{cfg.arrivedLabel}</label>
          <input
            type={isMonth ? 'month' : 'date'}
            value={arrived}
            onChange={e => setArrived(e.target.value)}
            style={dateInputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>
            {cfg.departedLabel}{' '}
            <span style={{ fontWeight: 500, opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}>
              (optional)
            </span>
          </label>
          <input
            type={isMonth ? 'month' : 'date'}
            value={departed}
            onChange={e => setDeparted(e.target.value)}
            min={arrived || undefined}
            style={dateInputStyle}
          />
        </div>
      </div>
    </div>
  );
}
