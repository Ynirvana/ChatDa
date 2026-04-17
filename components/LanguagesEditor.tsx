'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SPOKEN_LANGUAGES, LANGUAGE_LEVELS } from '@/lib/constants';
import { FilterSelect, type FilterOption } from '@/components/FilterSelect';

interface Lang { language: string; level: string; }

const levelColor: Record<string, string> = {
  native: '#00B894',
  fluent: '#74B9FF',
  conversational: '#FFC107',
  learning: 'rgba(255,255,255,.4)',
};

const languageOpts: FilterOption[] = [
  { value: '', label: 'Language' },
  ...SPOKEN_LANGUAGES.map(l => ({ value: l, label: l })),
];

const levelOpts: FilterOption[] = [
  { value: '', label: 'Level' },
  ...LANGUAGE_LEVELS.map(lv => ({ value: lv.id, label: lv.label })),
];

export function LanguagesEditor({ initial }: { initial: Lang[] }) {
  const router = useRouter();
  const [langs, setLangs] = useState<Lang[]>(initial);
  const [selLang, setSelLang] = useState('');
  const [selLevel, setSelLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const alreadyAdded = new Set(langs.map(l => l.language));
  const availableOpts: FilterOption[] = [
    { value: '', label: 'Language' },
    ...SPOKEN_LANGUAGES.filter(l => !alreadyAdded.has(l)).map(l => ({ value: l, label: l })),
  ];

  const add = () => {
    if (!selLang || !selLevel) return;
    setLangs(prev => [...prev, { language: selLang, level: selLevel }]);
    setDirty(true);
    setSelLang('');
    setSelLevel('');
  };

  const remove = (language: string) => {
    setLangs(prev => prev.filter(l => l.language !== language));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: langs }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      router.refresh();
    } catch {
      alert('Failed to save languages');
    } finally {
      setSaving(false);
    }
  };

  const canAdd = availableOpts.length > 1; // 1 = placeholder only

  return (
    <div>
      {/* 이미 추가된 언어 */}
      {langs.length === 0 ? (
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,.3)',
          fontStyle: 'italic', marginBottom: 14,
        }}>
          No languages yet — add one below.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {langs.map(l => {
            const color = levelColor[l.level] ?? 'rgba(255,255,255,.4)';
            const levelLabel = LANGUAGE_LEVELS.find(x => x.id === l.level)?.label ?? l.level;
            return (
              <div
                key={l.language}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px 7px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.06)',
                  border: `1.5px solid ${color}66`,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{l.language}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color,
                  padding: '2px 8px', borderRadius: 999,
                  background: `${color}22`,
                }}>
                  {levelLabel}
                </span>
                <button
                  type="button"
                  onClick={() => remove(l.language)}
                  aria-label={`Remove ${l.language}`}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,.5)',
                    fontSize: 14, fontWeight: 800,
                    padding: 0, lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add toggle + panel */}
      {canAdd && (
        <>
          <button
            type="button"
            onClick={() => setAddOpen(o => !o)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.12)',
              color: 'rgba(255,255,255,.6)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all .15s',
            }}
          >
            <span>+ Add language</span>
            <span style={{
              fontSize: 10,
              transform: addOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .2s',
            }}>▼</span>
          </button>

          {addOpen && (
            <div style={{
              marginTop: 12,
              padding: 14,
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 14,
            }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8,
                alignItems: 'end',
              }}>
                <div>
                  <FilterSelect
                    value={selLang}
                    onChange={setSelLang}
                    options={availableOpts}
                    placeholder="Language"
                  />
                </div>
                <div>
                  <FilterSelect
                    value={selLevel}
                    onChange={setSelLevel}
                    options={levelOpts}
                    placeholder="Level"
                  />
                </div>
                <button
                  type="button"
                  onClick={add}
                  disabled={!selLang || !selLevel}
                  style={{
                    padding: '10px 20px', borderRadius: 999, border: 'none',
                    fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                    cursor: (!selLang || !selLevel) ? 'not-allowed' : 'pointer',
                    background: (!selLang || !selLevel) ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg, #FF6B35, #E84393)',
                    color: '#fff',
                    opacity: (!selLang || !selLevel) ? 0.4 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Add
                </button>
              </div>
            </div>
          )}
        </>
      )}

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
          {saving ? 'Saving...' : 'Save languages'}
        </button>
      )}
    </div>
  );
}
