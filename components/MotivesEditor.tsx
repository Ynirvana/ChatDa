'use client';

import { useCallback, useState } from 'react';
import { LookingForPicker } from '@/components/LookingForPicker';
import { useProfileEdit } from './ProfileEditProvider';

export function MotivesEditor({
  initialLookingFor,
  initialCustom,
}: {
  initialLookingFor: string[];
  initialCustom: string | null;
}) {
  const [lookingFor, setLookingFor] = useState<string[]>(initialLookingFor);
  const [custom, setCustom] = useState<string>(initialCustom ?? '');

  const dirty =
    lookingFor.join(',') !== initialLookingFor.join(',') ||
    (custom.trim() || null) !== (initialCustom?.trim() || null);

  const save = useCallback(async () => {
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
      throw new Error(body.detail ?? 'Failed to save motives');
    }
  }, [lookingFor, custom]);

  useProfileEdit('motives', dirty, save);

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
    </div>
  );
}
