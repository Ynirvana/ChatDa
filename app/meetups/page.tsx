import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Nav } from '@/components/ui/Nav';
import { Orb } from '@/components/ui/Card';
import { EventCard, type EventSummary } from '@/components/EventCard';
import { backendFetch, type ApiEventSummary } from '@/lib/server-api';
import { HostFab } from '@/components/HostFab';

export const revalidate = 60;

export default async function MeetupsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const { tab } = await searchParams;
  const isPast = tab === 'past';

  const raw = await backendFetch<ApiEventSummary[]>(isPast ? '/events?past=true' : '/events');
  const rows: EventSummary[] = raw.map(ev => ({
    id: ev.id,
    title: ev.title,
    date: ev.date,
    time: ev.time,
    endTime: ev.end_time,
    coverImage: ev.cover_image,
    location: ev.location,
    area: ev.area,
    capacity: ev.capacity,
    fee: ev.fee,
    approvedCount: ev.approved_count,
    attendeePreviews: ev.attendee_previews.map(a => ({
      id: a.id,
      name: a.name,
      profileImage: a.profile_image,
    })),
  }));

  const tabStyle = (active: boolean) => ({
    padding: '8px 18px', borderRadius: 999, cursor: 'pointer',
    fontSize: 13, fontWeight: 700, textDecoration: 'none',
    background: active ? 'linear-gradient(135deg, #FF6B35, #E84393)' : 'rgba(255,255,255,.06)',
    color: active ? '#fff' : 'rgba(255,255,255,.55)',
    border: active ? 'none' : '1px solid rgba(255,255,255,.08)',
    transition: 'all .15s',
  });

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Nav user={session?.user} />

      <Orb size={400} color="rgba(108,92,231,.25)" top={-50} left={-100} />
      <Orb size={300} color="rgba(255,107,53,.2)" top={300} right={-80} delay={2} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>Meetups</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>
          Meet real people in Seoul.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <Link href="/meetups" style={tabStyle(!isPast)}>Upcoming</Link>
          <Link href="/meetups?tab=past" style={tabStyle(isPast)}>Past</Link>
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,.3)' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>{isPast ? '📸' : '🗓️'}</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>
              {isPast ? 'No past meetups yet' : 'First meetup dropping soon!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {rows.map(ev => <EventCard key={ev.id} event={ev} />)}
          </div>
        )}
      </div>

      {session?.user && <HostFab />}
    </div>
  );
}
