'use client';

import { LOOKING_FOR_OPTIONS, LOOKING_FOR_MAX, type LookingForId } from '@/lib/constants';

export function LookingForPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selectedSet = new Set(value);
  const atMax = value.length >= LOOKING_FOR_MAX;

  const toggle = (id: LookingForId) => {
    if (selectedSet.has(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      if (atMax) return;
      onChange([...value, id]);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8,
      }}>
        {LOOKING_FOR_OPTIONS.map(opt => {
          const selected = selectedSet.has(opt.id);
          const disabled = !selected && atMax;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              disabled={disabled}
              aria-pressed={selected}
              style={{
                padding: '9px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: selected
                  ? 'linear-gradient(135deg, rgba(255,107,53,.2), rgba(232,67,147,.2))'
                  : 'rgba(255,255,255,.06)',
                border: `1.5px solid ${selected ? '#FF6B35' : 'rgba(255,255,255,.12)'}`,
                color: selected ? '#fff' : disabled ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.7)',
                opacity: disabled ? 0.4 : 1,
                transition: 'all .15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p style={{
        fontSize: 12,
        color: atMax ? '#FF6B35' : 'rgba(255,255,255,.35)',
        marginTop: 10,
        fontWeight: atMax ? 700 : 500,
      }}>
        {value.length}/{LOOKING_FOR_MAX} selected{atMax ? ' — max reached' : ''}
      </p>
    </div>
  );
}
