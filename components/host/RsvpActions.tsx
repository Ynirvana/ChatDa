'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RsvpActions({ rsvpId }: { rsvpId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null);
  const [done, setDone] = useState(false);

  if (done) return (
    <p style={{ fontSize: 13, color: 'rgba(45,24,16,.4)', textAlign: 'center' }}>Done</p>
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
          background: loading === 'approved' ? 'rgba(0,184,148,.2)' : 'rgba(0,184,148,.1)',
          color: '#00957A', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
        }}
      >
        {loading === 'approved' ? '...' : '✓ Approve'}
      </button>
      <button
        onClick={() => handle('rejected')}
        disabled={!!loading}
        style={{
          flex: 1, padding: '10px', borderRadius: 10,
          border: '1px solid rgba(45,24,16,.12)',
          background: '#fff',
          color: 'rgba(45,24,16,.45)', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
        }}
      >
        {loading === 'rejected' ? '...' : '✗ Decline'}
      </button>
    </div>
  );
}
