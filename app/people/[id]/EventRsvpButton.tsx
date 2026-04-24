'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function EventRsvpButton({
  eventId,
  initialStatus,
}: {
  eventId: string;
  initialStatus: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  if (status === 'approved') {
    return (
      <span style={{
        fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
        background: 'rgba(0, 184, 148, .1)', color: '#00957A',
        border: '1px solid rgba(0, 184, 148, .3)',
      }}>✓ You&apos;re in</span>
    );
  }

  if (status === 'pending') {
    return (
      <span style={{
        fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
        background: 'rgba(255, 193, 7, .1)', color: '#C68600',
        border: '1px solid rgba(255, 193, 7, .4)',
      }}>Requested</span>
    );
  }

  const handleRequest = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('pending');
      router.refresh();
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={handleRequest} disabled={busy}
      style={{
        padding: '6px 16px', borderRadius: 999,
        border: '1.5px solid rgba(255,107,91,.5)',
        fontSize: 12, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
        background: 'transparent', color: '#FF6B5B',
      }}>
      {busy ? '...' : 'Request to join'}
    </button>
  );
}
