'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TAGS } from '@/lib/constants';

interface Tag {
  tag: string;
  category: 'can_do' | 'looking_for';
}

type Category = 'can_do' | 'looking_for';

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
    color: '#00B894',
    emptyCopy: 'Nothing yet — add what you can offer',
    addMoreCopy: 'Add what you can offer',
  },
  {
    id: 'looking_for',
    title: "I'm looking for",
    color: '#74B9FF',
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

  const toggle = (tag: string, category: Category) => {
    setDirty(true);
    setTags(prev => {
      const exists = prev.some(t => t.tag === tag && t.category === category);
      if (exists) return prev.filter(t => !(t.tag === tag && t.category === category));
      return [...prev, { tag, category }];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      router.refresh();
    } catch {
      alert('Failed to save tags');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {CATEGORIES.map(cat => {
        const selected = tags.filter(t => t.category === cat.id).map(t => t.tag);
        const available = TAGS.filter(t => !selected.includes(t));
        const isExpanded = expanded[cat.id];

        return (
          <div key={cat.id} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: cat.color, marginBottom: 10 }}>
              {cat.title}
            </p>

            {/* 선택된 태그 — 진한 fill + × 제거 */}
            {selected.length === 0 ? (
              <p style={{
                fontSize: 13, color: 'rgba(255,255,255,.3)',
                fontStyle: 'italic', marginBottom: 10,
              }}>
                {cat.emptyCopy}
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {selected.map(t => (
                  <button
                    key={`selected-${cat.id}-${t}`}
                    type="button"
                    onClick={() => toggle(t, cat.id)}
                    style={{
                      padding: '6px 10px 6px 14px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      border: `1.5px solid ${cat.color}`,
                      background: cat.color,
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all .15s',
                    }}
                    aria-label={`Remove ${t}`}
                  >
                    {t}
                    <span style={{
                      fontSize: 14, fontWeight: 800, lineHeight: 1,
                      opacity: 0.7, marginTop: -1,
                    }}>×</span>
                  </button>
                ))}
              </div>
            )}

            {/* Add more — 접이식 */}
            {available.length > 0 && (
              <>
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
                    border: `1.5px dashed ${cat.color}55`,
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

                {isExpanded && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 6,
                    marginTop: 10,
                    padding: 12,
                    background: 'rgba(255,255,255,.03)',
                    borderRadius: 12,
                    border: `1px dashed ${cat.color}22`,
                  }}>
                    {available.map(t => (
                      <button
                        key={`avail-${cat.id}-${t}`}
                        type="button"
                        onClick={() => toggle(t, cat.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,.15)',
                          background: 'transparent',
                          color: 'rgba(255,255,255,.6)',
                          transition: 'all .15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = cat.color;
                          e.currentTarget.style.color = cat.color;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
                          e.currentTarget.style.color = 'rgba(255,255,255,.6)';
                        }}
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          style={{
            marginTop: 8,
            padding: '10px 28px', borderRadius: 999, border: 'none',
            fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #FF6B35, #E84393)',
            color: '#fff',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Saving...' : 'Save Tags'}
        </button>
      )}
    </div>
  );
}
