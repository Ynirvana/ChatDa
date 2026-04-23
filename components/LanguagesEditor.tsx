'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SPOKEN_LANGUAGES, LANGUAGE_LEVELS } from '@/lib/constants';
import { FilterSelect, type FilterOption } from '@/components/FilterSelect';

interface Lang { language: string; level: string; }

const levelColor: Record<string, string> = {
  native: '#00957A',
  fluent: '#3E82CB',
  conversational: '#C68600',
  learning: 'rgba(45, 24, 16, .5)',
};

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

  // 드롭다운에서 언어+레벨 선택만 하고 "+ Add" 안 누른 상태도 저장 대상으로 인식
  const hasPendingAdd = !!(selLang && selLevel && !alreadyAdded.has(selLang));
  const canSave = dirty || hasPendingAdd;

  const save = async () => {
    setSaving(true);
    try {
      // pending 선택이 있으면 자동으로 리스트에 포함
      const final = hasPendingAdd
        ? [...langs, { language: selLang, level: selLevel }]
        : langs;
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: final }),
      });
      if (!res.ok) throw new Error();
      setLangs(final);
      setSelLang('');
      setSelLevel('');
      setDirty(false);
      router.refresh();
    } catch {
      alert('Failed to save languages');
    } finally {
      setSaving(false);
    }
  };

  const canAdd = availableOpts.length > 1;

  return (
    <div>
      {langs.length === 0 ? (
        <p style={{
          fontSize: 13, color: 'rgba(45, 24, 16, .45)',
          fontStyle: 'italic', marginBottom: 14,
        }}>
          No languages yet — add one below.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {langs.map(l => {
            const color = levelColor[l.level] ?? 'rgba(45, 24, 16, .5)';
            const levelLabel = LANGUAGE_LEVELS.find(x => x.id === l.level)?.label ?? l.level;
            return (
              <div
                key={l.language}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px 7px 14px',
                  borderRadius: 999,
                  background: 'rgba(45, 24, 16, .03)',
                  border: `1.5px solid ${color}66`,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2D1810' }}>{l.language}</span>
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
                    color: 'rgba(45, 24, 16, .5)',
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
              background: '#FFFFFF',
              border: '1px solid rgba(45, 24, 16, .15)',
              color: '#3D2416',
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
              background: 'rgba(255, 255, 255, .55)',
              border: '1px solid rgba(45, 24, 16, .1)',
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
                    padding: '12px 20px', borderRadius: 999, border: 'none',
                    fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                    cursor: (!selLang || !selLevel) ? 'not-allowed' : 'pointer',
                    background: (!selLang || !selLevel) ? 'rgba(45, 24, 16, .08)' : 'linear-gradient(135deg, #FF6B5B, #E84393)',
                    color: (!selLang || !selLevel) ? 'rgba(45, 24, 16, .3)' : '#fff',
                    opacity: (!selLang || !selLevel) ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                    boxShadow: (!selLang || !selLevel) ? 'none' : '0 4px 14px rgba(255, 107, 91, .3)',
                  }}
                >
                  + Add
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={save}
        disabled={!canSave || saving}
        style={{
          marginTop: 12,
          padding: '11px 24px', borderRadius: 999, border: 'none',
          fontSize: 13, fontWeight: 800,
          cursor: saving ? 'wait' : !canSave ? 'not-allowed' : 'pointer',
          background: !canSave ? 'rgba(45, 24, 16, .08)' : 'linear-gradient(135deg, #FF6B5B, #E84393)',
          color: !canSave ? 'rgba(45, 24, 16, .35)' : '#fff',
          fontFamily: 'inherit',
          boxShadow: !canSave ? 'none' : '0 4px 14px rgba(255, 107, 91, .3)',
        }}
      >
        {saving ? 'Saving...' : 'Save languages'}
      </button>
    </div>
  );
}
