'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SchoolCombobox } from '@/components/SchoolCombobox';

export function SchoolEditor({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = (value.trim() || '') !== (initial?.trim() || '');

  const save = async () => {
    if (!value.trim()) {
      setError('School is required for students');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school: value.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(body.detail ?? 'Failed');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p style={{
        fontSize: 13, color: 'rgba(45, 24, 16, .55)',
        marginBottom: 10, lineHeight: 1.5,
      }}>
        🎓 Helps you connect with others at the same school.
      </p>
      <SchoolCombobox
        value={value}
        onChange={setValue}
        placeholder="e.g. Yonsei University, SKKU, or type your own"
      />
      {error && (
        <p style={{ fontSize: 12, color: '#E84F3D', marginTop: 8, fontWeight: 700 }}>{error}</p>
      )}
      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          style={{
            marginTop: 12,
            padding: '10px 22px', borderRadius: 999, border: 'none',
            fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
            color: '#fff',
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(255, 107, 91, .28)',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      )}
    </div>
  );
}
