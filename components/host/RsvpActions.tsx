'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RsvpActions({ rsvpId }: { rsvpId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null);
  const [done, setDone] = useState(false);

  if (done) return (
    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>Done</p>
  );

  const handle = async (status: 'approved' | 'rejected') => {
    setLoading(status);
    const res = await fetch('/api/host/rsvp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvpId, status }),
    });
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={() => handle('approved')}
        disabled={!!loading}
        style={{
          flex: 1, padding: '10px', borderRadius: 10, border: 'none',
          background: loading === 'approved' ? 'rgba(0,184,148,.3)' : 'rgba(0,184,148,.15)',
          color: 'rgba(0,184,148,.9)', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
        }}
      >
        {loading === 'approved' ? '...' : '✓ Approve'}
      </button>
      <button
        onClick={() => handle('rejected')}
        disabled={!!loading}
        style={{
          flex: 1, padding: '10px', borderRadius: 10, border: 'none',
          background: 'rgba(255,255,255,.06)',
          color: 'rgba(255,255,255,.4)', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
        }}
      >
        {loading === 'rejected' ? '...' : '✗ Decline'}
      </button>
    </div>
  );
}
