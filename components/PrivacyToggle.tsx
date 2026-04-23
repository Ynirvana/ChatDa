'use client';

import { useState } from 'react';

export function PrivacyToggle({ initial }: { initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !value;
    setValue(next);
    setBusy(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showPersonalInfo: next }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      setValue(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#2D1810', marginBottom: 4 }}>
          Show age & gender on my profile
        </p>
        <p style={{ fontSize: 12, color: 'rgba(45, 24, 16, .55)', lineHeight: 1.45 }}>
          {value
            ? 'Other members can see your age and gender on your profile page.'
            : 'Hidden from everyone except you. People will still see your name and nationality.'}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={value}
        style={{
          position: 'relative',
          width: 46, height: 26, borderRadius: 999,
          border: 'none', padding: 0, flexShrink: 0,
          cursor: busy ? 'wait' : 'pointer',
          background: value
            ? 'linear-gradient(135deg, #FF6B5B, #E84393)'
            : 'rgba(45, 24, 16, .18)',
          transition: 'background .2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3,
          left: value ? 23 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff',
          transition: 'left .2s',
          boxShadow: '0 1px 3px rgba(45, 24, 16, .2)',
        }} />
      </button>
    </div>
  );
}
