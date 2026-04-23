'use client';

import { useState, useRef, useEffect } from 'react';
import { LOOKING_FOR_OPTIONS, LOOKING_FOR_MAX, type LookingForId } from '@/lib/constants';

export const CUSTOM_MAX_LENGTH = 30;

export function LookingForPicker({
  value,
  customValue,
  onChange,
  onCustomChange,
}: {
  value: string[];
  customValue: string;
  onChange: (next: string[]) => void;
  onCustomChange: (next: string) => void;
}) {
  const selectedSet = new Set(value);
  const [showCustomInput, setShowCustomInput] = useState(customValue !== '');
  const inputRef = useRef<HTMLInputElement>(null);
  const total = value.length + (customValue.trim() ? 1 : 0);
  const atMax = total >= LOOKING_FOR_MAX;

  useEffect(() => {
    if (showCustomInput && inputRef.current) inputRef.current.focus();
  }, [showCustomInput]);

  const togglePreset = (id: LookingForId) => {
    if (selectedSet.has(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      if (atMax) return;
      onChange([...value, id]);
    }
  };

  const toggleCustomChip = () => {
    if (customValue.trim()) {
      // Clear custom
      onCustomChange('');
      setShowCustomInput(false);
    } else {
      // Open input slot
      if (atMax) return;
      setShowCustomInput(v => !v);
    }
  };

  const customChipActive = showCustomInput || !!customValue.trim();
  const customChipDisabled = !customChipActive && atMax;

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
              onClick={() => togglePreset(opt.id)}
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

        {/* Other chip */}
        <button
          type="button"
          onClick={toggleCustomChip}
          disabled={customChipDisabled}
          aria-pressed={customChipActive}
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: customChipDisabled ? 'not-allowed' : 'pointer',
            background: customChipActive
              ? 'linear-gradient(135deg, rgba(255,107,91,.14), rgba(232,67,147,.1))'
              : '#FFFFFF',
            border: `1.5px dashed ${customChipActive ? '#FF6B5B' : 'rgba(45, 24, 16, .2)'}`,
            color: customChipActive ? '#2D1810' : customChipDisabled ? 'rgba(45, 24, 16, .3)' : '#3D2416',
            opacity: customChipDisabled ? 0.5 : 1,
            transition: 'all .15s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: customChipActive ? '0 2px 10px rgba(255, 107, 91, .18)' : '0 1px 3px rgba(45, 24, 16, .04)',
          }}
        >
          <span>✨</span>
          <span>{customValue.trim() || 'Other…'}</span>
        </button>
      </div>

      {/* Inline input for custom value */}
      {showCustomInput && (
        <div style={{ marginTop: 12 }}>
          <input
            ref={inputRef}
            type="text"
            value={customValue}
            onChange={e => onCustomChange(e.target.value.slice(0, CUSTOM_MAX_LENGTH))}
            onBlur={() => { if (!customValue.trim()) setShowCustomInput(false); }}
            placeholder="What else? (max 30 chars)"
            maxLength={CUSTOM_MAX_LENGTH}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1.5px solid rgba(255, 107, 91, .45)',
              background: '#FFFFFF',
              fontSize: 14,
              fontFamily: 'inherit',
              color: '#2D1810',
              outline: 'none',
              boxShadow: '0 1px 4px rgba(45, 24, 16, .04)',
            }}
          />
          <p style={{
            fontSize: 11, color: 'rgba(45, 24, 16, .45)', marginTop: 6,
          }}>
            {customValue.length}/{CUSTOM_MAX_LENGTH}
          </p>
        </div>
      )}

      <p style={{
        fontSize: 12,
        color: atMax ? '#FF6B5B' : 'rgba(45, 24, 16, .5)',
        marginTop: 12,
        fontWeight: atMax ? 700 : 500,
      }}>
        {total}/{LOOKING_FOR_MAX} selected{atMax ? ' — max reached' : ''}
      </p>
    </div>
  );
}
