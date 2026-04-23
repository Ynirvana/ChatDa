'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LookingForPicker } from '@/components/LookingForPicker';

export function MotivesEditor({
  initialLookingFor,
  initialCustom,
}: {
  initialLookingFor: string[];
  initialCustom: string | null;
}) {
  const router = useRouter();
  const [lookingFor, setLookingFor] = useState<string[]>(initialLookingFor);
  const [custom, setCustom] = useState<string>(initialCustom ?? '');
  const [saving, setSaving] = useState(false);

  const dirty =
    lookingFor.join(',') !== initialLookingFor.join(',') ||
    (custom.trim() || null) !== (initialCustom?.trim() || null);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookingFor,
          lookingForCustom: custom.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(body.detail ?? 'Failed');
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save motives');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p style={{
        fontSize: 13, color: 'rgba(45, 24, 16, .55)',
        marginBottom: 12, lineHeight: 1.5,
      }}>
        Pick up to 3. Helps others find you on the People tab.
      </p>
      <LookingForPicker
        value={lookingFor}
        customValue={custom}
        onChange={setLookingFor}
        onCustomChange={setCustom}
      />
      <button
        onClick={save}
        disabled={!dirty || saving}
        style={{
          marginTop: 14,
          padding: '10px 24px', borderRadius: 999, border: 'none',
          fontSize: 13, fontWeight: 800,
          cursor: saving ? 'wait' : !dirty ? 'not-allowed' : 'pointer',
          background: !dirty ? 'rgba(45, 24, 16, .08)' : 'linear-gradient(135deg, #FF6B5B, #E84393)',
          color: !dirty ? 'rgba(45, 24, 16, .35)' : '#fff',
          fontFamily: 'inherit',
          boxShadow: !dirty ? 'none' : '0 4px 12px rgba(255, 107, 91, .28)',
        }}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
