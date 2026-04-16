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
        fontSize: 15, fontWeight: 700, color: '#00B894',
        background: 'rgba(0,184,148,.1)', border: '1px solid rgba(0,184,148,.2)',
      }}>
        Connected
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div style={{
        padding: '14px 0', textAlign: 'center', borderRadius: 999,
        fontSize: 15, fontWeight: 700, color: '#FFC107',
        background: 'rgba(255,193,7,.1)', border: '1px solid rgba(255,193,7,.2)',
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
        width: '100%', padding: '14px 0', borderRadius: 999, border: 'none',
        fontSize: 15, fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
        background: 'linear-gradient(135deg, #FF6B35, #E84393)',
        color: '#fff',
      }}
    >
      {busy ? 'Sending...' : 'Connect'}
    </button>
  );
}
