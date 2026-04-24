import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BACKEND_PUBLIC = process.env.BACKEND_URL ?? 'http://localhost:8001';

interface EventBasic {
  title: string;
  date: string;
  time: string;
  location: string;
  area: string | null;
  fee: number;
  approved_count: number;
  capacity: number;
  host: { name: string; profile_image: string | null } | null;
  attendees: { id: string; profile_image: string | null; name: string }[];
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [boldFont, regularFont] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/Inter-Bold.woff')),
    readFile(join(process.cwd(), 'public/fonts/Inter-Regular.woff')),
  ]);

  const fonts = [
    { name: 'Inter', data: regularFont, weight: 400 as const },
    { name: 'Inter', data: boldFont,    weight: 700 as const },
  ];

  let event: EventBasic | null = null;
  try {
    const res = await fetch(`${BACKEND_PUBLIC}/events/${id}`, { cache: 'no-store' });
    if (res.ok) event = await res.json() as EventBasic;
  } catch { /* fallback */ }

  if (!event) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF6B5B, #E84393)' }}>
        <span style={{ fontSize: 48, fontWeight: 700, color: '#fff', fontFamily: 'Inter' }}>ChatDa</span>
      </div>,
      { width: 1200, height: 630, fonts },
    );
  }

  const d = new Date(event.date + 'T00:00');
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const locationStr = event.area ?? event.location.slice(0, 24);
  const metaLine = `${dateStr}  ·  ${event.time}  ·  ${locationStr}`;
  const going = event.approved_count;
  const spotsLeft = event.capacity - going;
  const feeStr = event.fee === 0 ? 'Free' : `₩${event.fee.toLocaleString()}`;
  const statusLine = spotsLeft > 0
    ? `${going} joined  ·  ${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`
    : `${going} joined  ·  Full`;

  type Av = { src: string | null; letter: string };
  const avatarList: Av[] = [];
  if (event.host) avatarList.push({ src: event.host.profile_image, letter: event.host.name[0] });
  for (const a of event.attendees.slice(0, 3)) {
    if (avatarList.length >= 4) break;
    avatarList.push({ src: a.profile_image, letter: a.name[0] });
  }

  const AV = 80;
  const OVERLAP = 20;
  const BORDER = '3px solid rgba(255,255,255,.35)';
  const titleSize = event.title.length > 36 ? 48 : event.title.length > 24 ? 56 : 64;

  const renderAvatar = (src: string | null, letter: string, s: number) => {
    const valid = src && (src.startsWith('http') || src.startsWith('data:image'));
    if (valid) {
      return <img src={src!} width={s} height={s} style={{ borderRadius: s / 2, objectFit: 'cover', border: BORDER, flexShrink: 0 }} />;
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: s, height: s, borderRadius: s / 2, background: 'rgba(255,255,255,.2)', border: BORDER, flexShrink: 0, fontSize: s * 0.38, fontWeight: 700, color: 'rgba(255,255,255,.9)' }}>
        {letter.toUpperCase()}
      </div>
    );
  };

  // Reversed so first avatar paints on top
  const reversed = [...avatarList].reverse();

  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B5B 0%, #E84393 100%)', fontFamily: 'Inter', padding: '48px 64px' }}>

      {/* Wordmark */}
      <div style={{ display: 'flex', marginBottom: 28 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>ChatDa</span>
      </div>

      {/* Avatar stack centered */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          {reversed.map((av, ri) => {
            const origIdx = avatarList.length - 1 - ri;
            return (
              <div key={ri} style={{ display: 'flex', marginLeft: origIdx === 0 ? 0 : -OVERLAP }}>
                {renderAvatar(av.src, av.letter, AV)}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex' }}>
          <span style={{ fontSize: 22, fontWeight: 400, color: 'rgba(255,255,255,.75)' }}>{statusLine}</span>
        </div>
      </div>

      {/* Title */}
      <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: -1, marginBottom: 14 }}>
        {event.title}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', fontSize: 22, fontWeight: 400, color: 'rgba(255,255,255,.7)', letterSpacing: -0.2, marginBottom: 'auto' }}>
        {metaLine}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {event.host
            ? renderAvatar(event.host.profile_image, event.host.name[0], 36)
            : null}
          <div style={{ display: 'flex' }}>
            <span style={{ fontSize: 18, fontWeight: 400, color: 'rgba(255,255,255,.65)' }}>
              {event.host ? event.host.name : ''}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>{feeStr}</span>
        </div>
      </div>

    </div>,
    { width: 1200, height: 630, fonts },
  );
}
