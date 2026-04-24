'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlatformIcon } from '@/components/ui/PlatformIcon';

export interface Attendee {
  id: string;
  rsvpId: string;  // empty string for host (no RSVP)
  name: string;
  nationality: string | null;
  bio: string | null;
  profileImage: string | null;
  socialLinks: { platform: string; url: string }[];
}

export function AttendeeCard({ attendee, isHost = false }: { attendee: Attendee; isHost?: boolean }) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (removed) return null;

  const canRemove = isHost && !!attendee.rsvpId;

  const handleRemove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/host/rsvp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvpId: attendee.rsvpId, status: 'cancelled' }),
      });
      if (res.ok) {
        setRemoved(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      display: 'flex', gap: 14, padding: 16,
      background: '#fff', border: '1px solid rgba(45,24,16,.1)',
      borderRadius: 14,
    }}>
      {/* Clickable avatar + info */}
      <Link href={`/people/${attendee.id}`} style={{ display: 'flex', gap: 14, flex: 1, textDecoration: 'none', minWidth: 0 }}>
        {attendee.profileImage ? (
          <img src={attendee.profileImage} alt=""
            style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
          }}>
            {attendee.name[0]}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#2D1810' }}>{attendee.name}</span>
            {attendee.nationality && (
              <span style={{ fontSize: 12, color: 'rgba(45,24,16,.45)' }}>{attendee.nationality}</span>
            )}
          </div>

          {attendee.bio && (
            <p style={{ fontSize: 13, color: 'rgba(45,24,16,.6)', marginBottom: 8, lineHeight: 1.4 }}>
              {attendee.bio}
            </p>
          )}

          {attendee.socialLinks.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {attendee.socialLinks.map(link => (
                <span key={link.platform} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 999,
                  background: 'rgba(45,24,16,.04)', border: '1px solid rgba(45,24,16,.1)',
                  fontSize: 12, fontWeight: 600, color: '#3D2416',
                }}>
                  <PlatformIcon platform={link.platform} size={14} />
                  {link.platform}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {canRemove && (
        <button type="button" onClick={handleRemove} disabled={busy}
          style={{
            alignSelf: 'flex-start', padding: '5px 12px', borderRadius: 999,
            border: '1px solid rgba(45,24,16,.15)', background: '#fff',
            fontSize: 11, fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
            color: 'rgba(45,24,16,.45)', fontFamily: 'inherit', flexShrink: 0,
          }}>
          {busy ? '...' : 'Remove'}
        </button>
      )}
    </div>
  );
}
