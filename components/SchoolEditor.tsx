'use client';

import { useCallback, useState } from 'react';
import { SchoolCombobox } from '@/components/SchoolCombobox';
import { useProfileEdit } from './ProfileEditProvider';

export function SchoolEditor({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial ?? '');

  const dirty = (value.trim() || '') !== (initial?.trim() || '');

  const save = useCallback(async () => {
    if (!value.trim()) {
      throw new Error('School is required for students');
    }
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school: value.trim() }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { detail?: string };
      throw new Error(body.detail ?? 'Failed to save school');
    }
  }, [value]);

  useProfileEdit('school', dirty, save);

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
    </div>
  );
}
