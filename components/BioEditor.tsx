'use client';

import { useCallback, useState } from 'react';
import { useProfileEdit } from './ProfileEditProvider';

const BIO_MAX = 100;

export function BioEditor({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial ?? '');
  const dirty = (value ?? '') !== (initial ?? '');

  const save = useCallback(async () => {
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: value.trim() || null }),
    });
    if (!res.ok) throw new Error('Failed to save bio');
  }, [value]);

  useProfileEdit('bio', dirty, save);

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
      <p style={{ fontSize: 11, color: 'rgba(45, 24, 16, .45)', marginTop: 8 }}>
        {value.length}/{BIO_MAX}
      </p>
    </div>
  );
}
