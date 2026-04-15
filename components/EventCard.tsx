import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatTime } from '@/lib/utils';

export interface AttendeePreview {
  id: string;
  name: string;
  profileImage: string | null;
}

export interface EventSummary {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string | null;
  coverImage: string | null;
  location: string;
  area: string | null;
  capacity: number;
  fee: number;
  approvedCount: number;
  attendeePreviews: AttendeePreview[];
}

const AVATAR_SIZE = 28;
const AVATAR_OVERLAP = 10;
const MAX_AVATARS = 5;

function AttendeeStack({ previews, total }: { previews: AttendeePreview[]; total: number }) {
  if (total === 0) {
    return (
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>
        Be the first to join →
      </span>
    );
  }

  const shown = previews.slice(0, MAX_AVATARS);
  const overflow = total - shown.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex' }}>
        {shown.map((p, i) => (
          <div
            key={p.id}
            title={p.name}
            style={{
              width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%',
              border: '2px solid #1a1033',
              marginLeft: i === 0 ? 0 : -AVATAR_OVERLAP,
              background: p.profileImage
                ? `url(${p.profileImage}) center/cover`
                : 'linear-gradient(135deg, #FF6B35, #E84393)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff',
              flexShrink: 0,
            }}
          >
            {!p.profileImage && (p.name?.[0] ?? '?')}
          </div>
        ))}
        {overflow > 0 && (
          <div style={{
            width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%',
            border: '2px solid #1a1033',
            marginLeft: -AVATAR_OVERLAP,
            background: 'rgba(255,255,255,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.85)',
            flexShrink: 0,
          }}>
            +{overflow}
          </div>
        )}
      </div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>
        {total === 1 ? '1 going' : `${total} going`}
      </span>
    </div>
  );
}

export function EventCard({ event }: { event: EventSummary }) {
  const spotsLeft = event.capacity - event.approvedCount;
  const d = new Date(event.date + 'T00:00');

  return (
    <Link href={`/meetups/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card clickable style={{ padding: 0, overflow: 'hidden' }}>
        {/* Cover image */}
        {event.coverImage && (
          <div style={{ width: '100%', height: 160, overflow: 'hidden', flexShrink: 0 }}>
            <img
              src={event.coverImage}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, padding: 20 }}>
          {/* Date block */}
          <div style={{
            width: 58, minWidth: 58, height: 58, borderRadius: 14,
            background: 'rgba(255,107,53,.2)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#FF6B35', textTransform: 'uppercase' }}>
              {d.toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#FF6B35' }}>
              {d.getDate()}
            </span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>
                {event.title}
              </h3>
              <span style={{
                fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                color: spotsLeft <= 3 ? '#FF6B35' : 'rgba(255,255,255,.3)',
              }}>
                {spotsLeft === 0 ? 'Full' : `${spotsLeft} left`}
              </span>
            </div>

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
              {event.area && <span>📍 {event.area}</span>}
              <span>🕖 {formatTime(event.time)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''}</span>
              <span>👥 {event.approvedCount}/{event.capacity}</span>
              {event.fee > 0 && (
                <span style={{ color: '#FF6B35', fontWeight: 700 }}>₩{event.fee.toLocaleString()}</span>
              )}
            </div>

            <AttendeeStack previews={event.attendeePreviews} total={event.approvedCount} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
