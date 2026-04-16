'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PendingRequest {
  connection_id: string;
  requester_id: string;
  requester_name: string;
  requester_image: string | null;
  requester_nationality: string | null;
  requester_status: string | null;
  created_at: string | null;
}

export function ConnectionRequests() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/connections/pending')
      .then(r => r.json())
      .then(data => { setPending(data.pending ?? []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || pending.length === 0) return null;

  const respond = async (connectionId: string, action: 'accept' | 'reject') => {
    setBusyId(connectionId);
    try {
      const res = await fetch(`/api/connections/${connectionId}?action=${action}`, { method: 'PUT' });
      if (!res.ok) throw new Error();
      setPending(prev => prev.filter(p => p.connection_id !== connectionId));
      router.refresh();
    } catch {
      alert('Failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>
        Connection Requests
        <span style={{
          marginLeft: 8, fontSize: 13, fontWeight: 700,
          padding: '2px 10px', borderRadius: 999,
          background: 'rgba(255,107,53,.15)', color: '#FF6B35',
        }}>
          {pending.length}
        </span>
      </h2>

      <div style={{ display: 'grid', gap: 10 }}>
        {pending.map(p => (
          <div
            key={p.connection_id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 14,
            }}
          >
            {p.requester_image ? (
              <img src={p.requester_image} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: '#fff',
              }}>
                {p.requester_name[0]}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{p.requester_name}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
                {p.requester_nationality ?? ''} wants to connect
              </p>
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => respond(p.connection_id, 'accept')}
                disabled={busyId === p.connection_id}
                style={{
                  padding: '7px 16px', borderRadius: 999, border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(0,184,148,.85)', color: '#fff',
                }}
              >
                Accept
              </button>
              <button
                onClick={() => respond(p.connection_id, 'reject')}
                disabled={busyId === p.connection_id}
                style={{
                  padding: '7px 16px', borderRadius: 999, border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)',
                }}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
