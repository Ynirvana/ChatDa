'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProfileConnectButton({
  personId,
  initialStatus,
}: {
  personId: string;
  initialStatus: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  if (status === 'accepted') {
    return (
      <div style={{
        padding: '14px 0', textAlign: 'center', borderRadius: 999,
        fontSize: 15, fontWeight: 800, color: '#00957A',
        background: 'rgba(0, 184, 148, .1)',
        border: '1px solid rgba(0, 184, 148, .32)',
      }}>
        ✓ Connected
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div style={{
        padding: '14px 0', textAlign: 'center', borderRadius: 999,
        fontSize: 15, fontWeight: 800, color: '#C68600',
        background: 'rgba(255, 193, 7, .1)',
        border: '1px solid rgba(255, 193, 7, .42)',
      }}>
        Request Pending
      </div>
    );
  }

  const handleConnect = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: personId }),
      });
      if (!res.ok) throw new Error();
      setStatus('pending');
      router.refresh();
    } catch {
      alert('Failed to send request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={busy}
      style={{
        width: '100%', padding: '16px 0', borderRadius: 999, border: 'none',
        fontSize: 15, fontWeight: 800, cursor: busy ? 'wait' : 'pointer',
        background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
        color: '#fff',
        boxShadow: [
          '0 12px 32px rgba(255, 107, 91, .3)',
          '0 4px 10px rgba(232, 67, 147, .2)',
          'inset 0 1px 0 rgba(255, 255, 255, .25)',
          'inset 0 -2px 0 rgba(130, 20, 70, .15)',
        ].join(', '),
        fontFamily: 'inherit',
        transition: 'transform .15s, box-shadow .15s',
      }}
    >
      {busy ? 'Sending...' : '+ Connect'}
    </button>
  );
}
