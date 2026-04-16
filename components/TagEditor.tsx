'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TAGS } from '@/lib/constants';

interface Tag {
  tag: string;
  category: 'can_do' | 'looking_for';
}

export function TagEditor({ initial }: { initial: Tag[] }) {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toggle = (tag: string, category: 'can_do' | 'looking_for') => {
    setDirty(true);
    setTags(prev => {
      const exists = prev.find(t => t.tag === tag && t.category === category);
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

  const canDo = tags.filter(t => t.category === 'can_do');
  const lookingFor = tags.filter(t => t.category === 'looking_for');

  const pillStyle = (active: boolean, color: string) => ({
    padding: '5px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700 as const,
    cursor: 'pointer' as const,
    border: `1px solid ${active ? color : 'rgba(255,255,255,.1)'}`,
    background: active ? `${color}22` : 'transparent',
    color: active ? color : 'rgba(255,255,255,.4)',
    transition: 'all .15s',
  });

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#00B894', marginBottom: 8 }}>
          I can help with
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TAGS.map(t => (
            <button
              key={`can-${t}`}
              onClick={() => toggle(t, 'can_do')}
              style={pillStyle(canDo.some(x => x.tag === t), '#00B894')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#74B9FF', marginBottom: 8 }}>
          I&apos;m looking for
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TAGS.map(t => (
            <button
              key={`look-${t}`}
              onClick={() => toggle(t, 'looking_for')}
              style={pillStyle(lookingFor.some(x => x.tag === t), '#74B9FF')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '10px 28px', borderRadius: 999, border: 'none',
            fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #FF6B35, #E84393)',
            color: '#fff',
          }}
        >
          {saving ? 'Saving...' : 'Save Tags'}
        </button>
      )}
    </div>
  );
}
