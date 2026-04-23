'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BIO_MAX = 100;

export function BioEditor({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = (value ?? '') !== (initial ?? '');

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: value.trim() || null }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert('Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value.slice(0, BIO_MAX))}
        placeholder="ex.) French founder living in Seoul"
        maxLength={BIO_MAX}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1.5px solid rgba(45, 24, 16, .15)',
          background: '#FFFFFF',
          fontSize: 14,
          color: '#2D1810',
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: '0 1px 4px rgba(45, 24, 16, .04)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <p style={{ fontSize: 11, color: 'rgba(45, 24, 16, .45)' }}>
          {value.length}/{BIO_MAX}
        </p>
        <button
          onClick={save}
          disabled={!dirty || saving}
          style={{
            padding: '8px 20px', borderRadius: 999, border: 'none',
            fontSize: 12, fontWeight: 800,
            cursor: saving ? 'wait' : !dirty ? 'not-allowed' : 'pointer',
            background: !dirty ? 'rgba(45, 24, 16, .08)' : 'linear-gradient(135deg, #FF6B5B, #E84393)',
            color: !dirty ? 'rgba(45, 24, 16, .35)' : '#fff',
            fontFamily: 'inherit',
            boxShadow: !dirty ? 'none' : '0 3px 10px rgba(255, 107, 91, .28)',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
