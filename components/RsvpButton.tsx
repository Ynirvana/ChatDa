'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface Props {
  eventId: string;
  isLoggedIn: boolean;
  isFull: boolean;
  existingStatus: string | null; // 'pending' | 'approved' | 'rejected' | 'cancelled' | null
}

const statusLabel: Record<string, { text: string; color: string }> = {
  pending:  { text: '⏳ Request sent — waiting for host', color: 'rgba(255,234,167,.9)' },
  approved: { text: "✅ You're in!", color: 'rgba(0,184,148,.9)' },
  rejected: { text: '✗ Not accepted this time', color: 'rgba(255,255,255,.4)' },
  cancelled:{ text: 'Cancelled', color: 'rgba(255,255,255,.4)' },
};

export function RsvpButton({ eventId, isLoggedIn, isFull, existingStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(existingStatus);

  if (status && statusLabel[status]) {
    const { text, color } = statusLabel[status];
    return (
      <div style={{
        padding: '14px 24px', borderRadius: 999, textAlign: 'center',
        background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
        color, fontWeight: 700, fontSize: 15,
      }}>
        {text}
      </div>
    );
  }

  if (isFull) {
    return (
      <div style={{
        padding: '14px 24px', borderRadius: 999, textAlign: 'center',
        background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.3)',
        fontWeight: 700, fontSize: 15,
      }}>
        This meetup is full
      </div>
    );
  }

  const handleRsvp = async () => {
    if (!isLoggedIn) {
      router.push(`/login?from=/meetups/${eventId}`);
      return;
    }

    setLoading(true);
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });

    if (res.ok) {
      setStatus('pending');
    }
    setLoading(false);
  };

  return (
    <Button
      variant="accent"
      full
      onClick={handleRsvp}
      disabled={loading}
      style={{ fontSize: 16, padding: '16px 28px', opacity: loading ? 0.7 : 1 }}
    >
      {loading ? 'Sending...' : isLoggedIn ? 'Request to join →' : 'Sign in to join →'}
    </Button>
  );
}
