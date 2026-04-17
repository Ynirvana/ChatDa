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
                padding: '10px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: selected
                  ? 'linear-gradient(135deg, rgba(255,107,91,.14), rgba(232,67,147,.1))'
                  : '#FFFFFF',
                border: `1.5px solid ${selected ? '#FF6B5B' : 'rgba(45, 24, 16, .15)'}`,
                color: selected ? '#2D1810' : disabled ? 'rgba(45, 24, 16, .3)' : '#3D2416',
                opacity: disabled ? 0.5 : 1,
                transition: 'all .15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: selected ? '0 2px 10px rgba(255, 107, 91, .18)' : '0 1px 3px rgba(45, 24, 16, .04)',
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
        color: atMax ? '#FF6B5B' : 'rgba(45, 24, 16, .5)',
        marginTop: 12,
        fontWeight: atMax ? 700 : 500,
      }}>
        {value.length}/{LOOKING_FOR_MAX} selected{atMax ? ' — max reached' : ''}
      </p>
    </div>
  );
}
