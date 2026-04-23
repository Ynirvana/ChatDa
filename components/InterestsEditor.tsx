'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { INTERESTS, INTERESTS_MAX } from '@/lib/constants';

const COLOR = '#6C5CE7';

export function InterestsEditor({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initial);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const atMax = selected.length >= INTERESTS_MAX;
  const selectedSet = new Set(selected);
  const available = INTERESTS.filter(i => !selectedSet.has(i));

  const toggle = (t: string) => {
    setDirty(true);
    setSelected(prev => {
      if (prev.includes(t)) return prev.filter(x => x !== t);
      if (atMax) return prev;
      return [...prev, t];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selected }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      router.refresh();
    } catch {
      alert('Failed to save interests');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {selected.length === 0 ? (
        <p style={{
          fontSize: 13, color: 'rgba(45, 24, 16, .45)',
          fontStyle: 'italic', marginBottom: 10,
        }}>
          Nothing yet — pick up to {INTERESTS_MAX} things you&apos;re into.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {selected.map(t => (
            <button
              key={`sel-${t}`}
              type="button"
              onClick={() => toggle(t)}
              style={{
                padding: '6px 10px 6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                border: `1.5px solid ${COLOR}`,
                background: COLOR,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              aria-label={`Remove ${t}`}
            >
              {t}
              <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1, opacity: 0.7, marginTop: -1 }}>×</span>
            </button>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(x => !x)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: 'transparent',
              border: `1.5px dashed ${COLOR}66`,
              color: COLOR,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>+ Add interests</span>
            <span style={{ fontSize: 10, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>▼</span>
          </button>

          {expanded && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
              marginTop: 10, padding: 12,
              background: 'rgba(108, 92, 231, .04)',
              borderRadius: 12,
              border: `1px dashed ${COLOR}33`,
            }}>
              {available.map(t => (
                <button
                  key={`avail-${t}`}
                  type="button"
                  onClick={() => toggle(t)}
                  disabled={atMax}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: atMax ? 'not-allowed' : 'pointer',
                    border: '1px solid rgba(45, 24, 16, .18)',
                    background: '#FFFFFF',
                    color: atMax ? 'rgba(45, 24, 16, .25)' : '#3D2416',
                    opacity: atMax ? 0.5 : 1,
                  }}
                >
                  + {t}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <p style={{
        fontSize: 11, color: atMax ? '#FF6B5B' : 'rgba(45, 24, 16, .5)',
        marginTop: 8, fontWeight: atMax ? 700 : 500,
      }}>
        {selected.length}/{INTERESTS_MAX}{atMax ? ' — max reached' : ''}
      </p>

      <button
        onClick={save}
        disabled={!dirty || saving}
        style={{
          marginTop: 10,
          padding: '11px 24px', borderRadius: 999, border: 'none',
          fontSize: 13, fontWeight: 800,
          cursor: saving ? 'wait' : !dirty ? 'not-allowed' : 'pointer',
          background: !dirty ? 'rgba(45, 24, 16, .08)' : 'linear-gradient(135deg, #FF6B5B, #E84393)',
          color: !dirty ? 'rgba(45, 24, 16, .35)' : '#fff',
          fontFamily: 'inherit',
          boxShadow: !dirty ? 'none' : '0 4px 14px rgba(255, 107, 91, .3)',
        }}
      >
        {saving ? 'Saving...' : 'Save interests'}
      </button>
    </div>
  );
}
