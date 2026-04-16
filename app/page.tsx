import Link from 'next/link';
import { Orb, Card } from '@/components/ui/Card';
import { Nav } from '@/components/ui/Nav';
import { Button } from '@/components/ui/Button';
import { AttendeeCard, type Attendee } from '@/components/AttendeeCard';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { backendFetch, type ApiEventSummary, type ApiEventDetail } from '@/lib/server-api';

export const revalidate = 60;

export default async function Home() {
  const session = await auth();

  const events = await backendFetch<ApiEventSummary[]>('/events').catch(() => [] as ApiEventSummary[]);
  const featuredRaw = events[0] ?? null;

  let detail: ApiEventDetail | null = null;
  if (featuredRaw) {
    detail = await backendFetch<ApiEventDetail>(`/events/${featuredRaw.id}`).catch(() => null);
  }

  const attendees: Attendee[] = (detail?.attendees.slice(0, 4) ?? []).map(a => ({
    id: a.id,
    name: a.name,
    nationality: a.nationality,
    bio: a.bio,
    profileImage: a.profile_image,
    socialLinks: a.social_links,
  }));

  const approvedCount = detail?.approved_count ?? 0;

  return (
    <div className="page-bg">
      <Nav user={session?.user} isAdmin={isAdminEmail(session?.user?.email)} />

      <Orb size={600} color="rgba(108,92,231,.3)" top={-100} left={-200} />
      <Orb size={400} color="rgba(232,67,147,.25)" top={200} right={-100} delay={2} />

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center',
        padding: '100px 20px 60px',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px', borderRadius: 999,
          background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)',
          fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.8)',
          marginBottom: 28, letterSpacing: 0.3,
        }}>
          cross-cultural network
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.75rem)',
          fontWeight: 900, letterSpacing: -2, lineHeight: 1.1,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #FF6B35, #E84393, #6C5CE7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Find your people in Korea
        </h1>

        <p style={{
          fontSize: 18, fontWeight: 600,
          color: 'rgba(255,255,255,.65)',
          maxWidth: 480, margin: '0 auto 40px',
          lineHeight: 1.6,
        }}>
          The person you&apos;re looking for is already here
        </p>

        <Link href="/meetups" style={{ textDecoration: 'none' }}>
          <Button variant="accent" style={{ fontSize: 16, padding: '16px 40px' }}>
            Browse Meetups →
          </Button>
        </Link>
      </section>

      {/* Featured event preview */}
      {featuredRaw && detail && (
        <section style={{
          position: 'relative', zIndex: 1,
          maxWidth: 700, margin: '0 auto',
          padding: '0 24px 80px',
        }}>
          <p style={{
            fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: 2, color: 'rgba(255,255,255,.35)',
            marginBottom: 16,
          }}>
            Upcoming
          </p>

          <Link href={`/meetups/${featuredRaw.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>{featuredRaw.title}</h3>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', display: 'flex', gap: 14 }}>
                    {featuredRaw.area && <span>📍 {featuredRaw.area}</span>}
                    <span>🕖 {featuredRaw.time}</span>
                    <span>👥 {approvedCount}/{featuredRaw.capacity}</span>
                  </div>
                </div>
                {featuredRaw.fee > 0 && (
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#FF6B35' }}>
                    ₩{featuredRaw.fee.toLocaleString()}
                  </span>
                )}
              </div>

              {attendees.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {"Who's going"}
                  </p>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {attendees.map(a => <AttendeeCard key={a.id} attendee={a} />)}
                  </div>
                  <Link href={`/meetups/${featuredRaw.id}`} style={{
                    display: 'block', textAlign: 'center', marginTop: 16,
                    fontSize: 14, fontWeight: 700,
                    color: '#FF6B35', textDecoration: 'none',
                  }}>
                    See full event →
                  </Link>
                </div>
              )}
            </Card>
          </Link>
        </section>
      )}
    </div>
  );
}
