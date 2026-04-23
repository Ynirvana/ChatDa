'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TAGS } from '@/lib/constants';

interface Tag {
  tag: string;
  category: 'can_do' | 'looking_for';
}

type Category = 'can_do' | 'looking_for';

export const TAG_CAP = 3;
const CUSTOM_MIN = 1;
const CUSTOM_MAX = 24;

const CATEGORIES: {
  id: Category;
  title: string;
  color: string;
  emptyCopy: string;
  addMoreCopy: string;
}[] = [
  {
    id: 'can_do',
    title: 'I can help with',
    color: '#00957A',
    emptyCopy: 'Nothing yet — add what you can offer',
    addMoreCopy: 'Add what you can offer',
  },
  {
    id: 'looking_for',
    title: "I'm looking for",
    color: '#3E82CB',
    emptyCopy: 'Nothing yet — add what you need',
    addMoreCopy: "Add what you're looking for",
  },
];

export function TagEditor({ initial }: { initial: Tag[] }) {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expanded, setExpanded] = useState<Record<Category, boolean>>({
    can_do: false,
    looking_for: false,
  });
  const [customInput, setCustomInput] = useState<Record<Category, string>>({
    can_do: '',
    looking_for: '',
  });
  const [customOpen, setCustomOpen] = useState<Record<Category, boolean>>({
    can_do: false,
    looking_for: false,
  });
  const [error, setError] = useState<string | null>(null);

  const countIn = (cat: Category) => tags.filter(t => t.category === cat).length;

  const toggle = (tag: string, category: Category) => {
    setError(null);
    setTags(prev => {
      const exists = prev.some(t => t.tag === tag && t.category === category);
      if (exists) {
        setDirty(true);
        return prev.filter(t => !(t.tag === tag && t.category === category));
      }
      // Adding: check cap
      if (countIn(category) >= TAG_CAP) {
        setError(`Max ${TAG_CAP} tags per category — remove one first`);
        return prev;
      }
      setDirty(true);
      return [...prev, { tag, category }];
    });
  };

  const addCustom = (category: Category) => {
    const raw = customInput[category].trim();
    if (raw.length < CUSTOM_MIN) return;
    if (raw.length > CUSTOM_MAX) {
      setError(`Custom tag must be ${CUSTOM_MAX} chars or fewer`);
      return;
    }
    if (tags.some(t => t.tag === raw && t.category === category)) {
      setError('You already have that tag');
      return;
    }
    if (countIn(category) >= TAG_CAP) {
      setError(`Max ${TAG_CAP} tags per category — remove one first`);
      return;
    }
    setTags(prev => [...prev, { tag: raw, category }]);
    setCustomInput(p => ({ ...p, [category]: '' }));
    setCustomOpen(p => ({ ...p, [category]: false }));
    setDirty(true);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/users/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string; error?: string };
        throw new Error(body.detail ?? body.error ?? 'Failed');
      }
      setDirty(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save tags');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {CATEGORIES.map(cat => {
        const selectedInCat = tags.filter(t => t.category === cat.id);
        const selectedSet = new Set(selectedInCat.map(t => t.tag));
        const availablePresets = TAGS.filter(t => !selectedSet.has(t));
        const count = selectedInCat.length;
        const atCap = count >= TAG_CAP;
        const isExpanded = expanded[cat.id];
        const isCustomOpen = customOpen[cat.id];

        return (
          <div key={cat.id} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: cat.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {cat.title}
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: atCap ? cat.color : 'rgba(45, 24, 16, .4)' }}>
                {count}/{TAG_CAP}
              </p>
            </div>

            {selectedInCat.length === 0 ? (
              <p style={{
                fontSize: 13, color: 'rgba(45, 24, 16, .45)',
                fontStyle: 'italic', marginBottom: 10,
              }}>
                {cat.emptyCopy}
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {selectedInCat.map(t => {
                  const isCustom = !(TAGS as readonly string[]).includes(t.tag);
                  return (
                    <button
                      key={`selected-${cat.id}-${t.tag}`}
                      type="button"
                      onClick={() => toggle(t.tag, cat.id)}
                      style={{
                        padding: '6px 10px 6px 14px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        border: isCustom ? `1.5px dashed ${cat.color}` : `1.5px solid ${cat.color}`,
                        background: cat.color,
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all .15s',
                      }}
                      aria-label={`Remove ${t.tag}`}
                      title={isCustom ? 'Custom tag' : undefined}
                    >
                      {t.tag}
                      <span style={{
                        fontSize: 14, fontWeight: 800, lineHeight: 1,
                        opacity: 0.7, marginTop: -1,
                      }}>×</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!atCap && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {availablePresets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(p => ({ ...p, [cat.id]: !p[cat.id] }))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: `1.5px dashed ${cat.color}77`,
                      color: cat.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>+ {cat.addMoreCopy}</span>
                    <span style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform .2s',
                      fontSize: 10,
                    }}>▼</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCustomOpen(p => ({ ...p, [cat.id]: !p[cat.id] }))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: `1.5px dashed ${cat.color}77`,
                    color: cat.color,
                  }}
                >
                  + Custom
                </button>
              </div>
            )}

            {atCap && (
              <p style={{ fontSize: 12, fontWeight: 700, color: cat.color, marginTop: 4 }}>
                Max reached — remove one to add another
              </p>
            )}

            {isCustomOpen && !atCap && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={customInput[cat.id]}
                  onChange={e => setCustomInput(p => ({ ...p, [cat.id]: e.target.value.slice(0, CUSTOM_MAX) }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(cat.id); } }}
                  placeholder="Your own tag (max 24)"
                  maxLength={CUSTOM_MAX}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 999,
                    border: `1.5px solid ${cat.color}55`,
                    background: '#FFFFFF',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#2D1810',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => addCustom(cat.id)}
                  disabled={customInput[cat.id].trim().length < CUSTOM_MIN}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: customInput[cat.id].trim() ? 'pointer' : 'not-allowed',
                    background: cat.color,
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 800,
                    opacity: customInput[cat.id].trim() ? 1 : 0.45,
                  }}
                >
                  Add
                </button>
              </div>
            )}

            {isExpanded && availablePresets.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6,
                marginTop: 10,
                padding: 12,
                background: `${cat.color}0A`,
                borderRadius: 12,
                border: `1px dashed ${cat.color}33`,
              }}>
                {availablePresets.map(t => (
                  <button
                    key={`avail-${cat.id}-${t}`}
                    type="button"
                    onClick={() => toggle(t, cat.id)}
                    disabled={atCap}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      cursor: atCap ? 'not-allowed' : 'pointer',
                      border: '1px solid rgba(45, 24, 16, .18)',
                      background: '#FFFFFF',
                      color: atCap ? 'rgba(45, 24, 16, .3)' : '#3D2416',
                      opacity: atCap ? 0.5 : 1,
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      if (atCap) return;
                      e.currentTarget.style.borderColor = cat.color;
                      e.currentTarget.style.color = cat.color;
                    }}
                    onMouseLeave={e => {
                      if (atCap) return;
                      e.currentTarget.style.borderColor = 'rgba(45, 24, 16, .18)';
                      e.currentTarget.style.color = '#3D2416';
                    }}
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {error && (
        <p style={{ fontSize: 12, fontWeight: 700, color: '#E84F3D', marginBottom: 10 }}>
          {error}
        </p>
      )}

      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          style={{
            marginTop: 8,
            padding: '12px 28px', borderRadius: 999, border: 'none',
            fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
            color: '#fff',
            fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(255, 107, 91, .3)',
          }}
        >
          {saving ? 'Saving...' : 'Save Tags'}
        </button>
      )}
    </div>
  );
}
