import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { Nav } from '@/components/ui/Nav';
import { Orb } from '@/components/ui/Card';
import { AttendeeCard, type Attendee } from '@/components/AttendeeCard';
import { MeetupBottomBar } from './MeetupBottomBar';
import { AddToCalendarButton } from '@/components/AddToCalendarButton';
import { MemoriesSection } from '@/components/event/MemoriesSection';
import { backendFetch, type ApiEventDetail, type ApiPendingRsvp } from '@/lib/server-api';
import { RsvpActions } from '@/components/host/RsvpActions';
import { formatTime } from '@/lib/utils';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import type { Metadata } from 'next';

const BACKEND_PUBLIC = process.env.BACKEND_URL ?? 'http://localhost:8001';
const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://chatda.life';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND_PUBLIC}/events/${id}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Meetup · ChatDa' };
    const event = await res.json() as ApiEventDetail;

    const d = new Date(event.date + 'T00:00');
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeStr = event.time ? ` · ${event.time}${event.end_time ? `–${event.end_time}` : ''}` : '';
    const locStr = event.area ? ` · ${event.area}` : '';
    const spotsLeft = event.capacity - event.approved_count;
    const spotsStr = spotsLeft > 0 ? ` · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : ' · Full';

    const description = (event.description?.trim()?.slice(0, 140))
      || `${dateStr}${timeStr}${locStr}${spotsStr}`;

    const url = `${SITE_URL}/meetups/${id}`;
    const ogImage = `${SITE_URL}/meetups/${id}/opengraph-image`;

    const goingCount = event.approved_count;
    const ogTitle = goingCount > 0
      ? `${goingCount} ${goingCount === 1 ? 'person' : 'people'} joining · ${event.title}`
      : event.title;

    return {
      title: `${event.title} · ChatDa`,
      description,
      openGraph: {
        title: ogTitle,
        description,
        url,
        siteName: 'ChatDa',
        type: 'website',
        images: [{ url: ogImage, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description,
        images: [ogImage],
      },
      alternates: { canonical: url },
    };
  } catch {
    return { title: 'Meetup · ChatDa' };
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  let event: ApiEventDetail;
  try {
    event = await backendFetch<ApiEventDetail>(`/events/${id}`);
  } catch {
    notFound();
  }

  let myRsvpStatus: string | null = null;
  if (session?.user?.id) {
    try {
      const { status } = await backendFetch<{ status: string | null }>(`/rsvp/status?event_id=${id}`);
      myRsvpStatus = status;
    } catch {}
  }

  const hostAttendee: Attendee | null = event.host ? {
    id: event.host.id, rsvpId: '', name: event.host.name,
    nationality: event.host.nationality, bio: event.host.bio,
    profileImage: event.host.profile_image, socialLinks: event.host.social_links,
  } : null;

  const attendees: Attendee[] = [
    ...(hostAttendee ? [hostAttendee] : []),
    ...event.attendees.map(a => ({
      id: a.id, rsvpId: a.rsvp_id, name: a.name, nationality: a.nationality,
      bio: a.bio, profileImage: a.profile_image, socialLinks: a.social_links,
    })),
  ];

  const approvedCount = event.approved_count; // already includes host (backend adds +1)
  const spotsLeft = event.capacity - approvedCount;
  const d = new Date(event.date + 'T00:00');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(event.date + 'T00:00');
  const isPast = eventDay < today;

  const isHost = session?.user?.id && event.host && session.user.id === event.host.id;
  const canPostMemory = !!session?.user?.id && (isHost || myRsvpStatus === 'approved');

  let pendingRsvps: ApiPendingRsvp[] = [];
  if (isHost) {
    try {
      pendingRsvps = await backendFetch<ApiPendingRsvp[]>(`/host/pending?event_id=${id}`);
    } catch {}
  }

  const paymentLabels: Record<string, string> = {
    dutch: 'Dutch pay — each person pays for what they order',
    split: 'Split equally — total bill divided evenly at the end',
    cover: 'Cover charge — entry fee collected, pay separately for food & drinks',
    included: 'All included — food & drinks covered by the entry fee',
  };

  const reqLabels: Record<string, string> = {
    profile_photo: 'Profile photo', instagram: 'Instagram', linkedin: 'LinkedIn',
    facebook: 'Facebook', x: 'X (Twitter)', tiktok: 'TikTok',
  };

  return (
    <div className="page-bg-light" style={{ minHeight: '100vh' }}>
      <Nav user={session?.user} isAdmin={isAdminEmail(session?.user?.email)} light />
      <Orb size={400} color="rgba(255, 140, 120, .18)" top={-50} right={-100} />


      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 24px 80px', position: 'relative', zIndex: 1 }}>

        <Link href="/people" style={{ fontSize: 14, color: 'rgba(45,24,16,.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
          ← People
        </Link>

        {/* Title + host edit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.15, flex: 1, color: '#2D1810' }}>
            {event.title}
          </h1>
          {isHost && (
            <Link href={`/host/events/${id}/edit`} style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              background: 'rgba(45,24,16,.06)', border: '1px solid rgba(45,24,16,.15)',
              color: '#3D2416', textDecoration: 'none',
              flexShrink: 0, marginTop: 4,
            }}>Edit</Link>
          )}
        </div>

        {/* Info card */}
        <div style={{
          background: '#fff', border: '1px solid rgba(45,24,16,.1)',
          borderRadius: 16, padding: 20, display: 'grid', gap: 14, marginBottom: 12,
          boxShadow: '0 2px 8px rgba(45,24,16,.04)',
        }}>
          {/* Date/Time */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2D1810' }}>{d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
              <div style={{ fontSize: 13, color: 'rgba(45,24,16,.5)' }}>
                {formatTime(event.time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
              </div>
            </div>
            {!isPast && (
              <AddToCalendarButton
                eventId={event.id}
                title={event.title}
                date={event.date}
                time={event.time}
                endTime={event.end_time}
                location={event.location}
                description={event.description}
              />
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(45,24,16,.08)' }} />

          {/* Location */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2D1810' }}>{event.location}</div>
              {event.area && <div style={{ fontSize: 13, color: 'rgba(45,24,16,.5)' }}>{event.area}</div>}
              {(event.google_map_url || event.naver_map_url) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {event.google_map_url && (
                    <a href={event.google_map_url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                      background: 'rgba(66,133,244,.1)', border: '1px solid rgba(66,133,244,.3)',
                      color: '#4285F4', textDecoration: 'none',
                    }}>Google Maps →</a>
                  )}
                  {event.naver_map_url && (
                    <a href={event.naver_map_url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                      background: 'rgba(3,199,90,.08)', border: '1px solid rgba(3,199,90,.25)',
                      color: '#03C75A', textDecoration: 'none',
                    }}>Naver Maps →</a>
                  )}
                </div>
              )}
              {event.directions && (
                <div style={{
                  marginTop: 10, padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(0,184,148,.06)', border: '1px solid rgba(0,184,148,.2)',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#00957A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                      How to find us
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(45,24,16,.7)', lineHeight: 1.55, whiteSpace: 'pre-wrap', margin: 0 }}>
                      {event.directions}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(45,24,16,.08)' }} />

          {/* Capacity */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>👥</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2D1810' }}>{approvedCount}/{event.capacity} going</div>
              <div style={{ fontSize: 13, color: 'rgba(45,24,16,.5)' }}>
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
              </div>
            </div>
          </div>

          {(event.fee > 0 || event.payment_method) && (
            <>
              <div style={{ height: 1, background: 'rgba(45,24,16,.08)' }} />
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22 }}>💰</span>
                <div>
                  {event.fee > 0 && (
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: '#2D1810' }}>
                      ₩{event.fee.toLocaleString()} entry fee
                    </div>
                  )}
                  {event.payment_method && (
                    <div style={{ fontSize: 13, color: 'rgba(45,24,16,.55)' }}>
                      {paymentLabels[event.payment_method] ?? event.payment_method}
                    </div>
                  )}
                  {event.fee_note && (
                    <div style={{ fontSize: 13, color: '#FF6B5B', marginTop: 4, fontWeight: 600 }}>
                      {event.fee_note}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Requirements */}
        {event.requirements.length > 0 && (
          <div style={{
            background: 'rgba(255,107,91,.06)', border: '1px solid rgba(255,107,91,.2)',
            borderRadius: 16, padding: 16, marginBottom: 28,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FF6B5B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Requirements to join
            </div>
            <p style={{ fontSize: 12, color: 'rgba(45,24,16,.5)', marginBottom: 10, lineHeight: 1.5 }}>
              For safety and a wholesome meetup, attendees must have:
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {event.requirements.map(r => (
                <span key={r} style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(255,107,91,.1)', border: '1px solid rgba(255,107,91,.25)',
                  color: '#FF6B5B',
                }}>
                  {reqLabels[r] ?? r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {(event.description || event.cover_image) && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: '#2D1810' }}>About</h2>
            {event.description && (
              <p style={{ fontSize: 15, color: 'rgba(45,24,16,.7)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: event.cover_image ? 16 : 0 }}>
                {event.description}
              </p>
            )}
            {event.cover_image && (
              <img
                src={event.cover_image}
                alt=""
                style={{ width: '100%', borderRadius: 14, objectFit: 'cover', maxHeight: 400, display: 'block' }}
              />
            )}
          </div>
        )}

        {/* Group chat link — visible to approved attendees and host only */}
        {event.contact_link && (isHost || myRsvpStatus === 'approved') && (
          <div style={{
            background: 'rgba(255,107,91,.05)', border: '1px solid rgba(255,107,91,.18)',
            borderRadius: 16, padding: '16px 20px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#2D1810', marginBottom: 4 }}>Questions about this meetup?</div>
              <div style={{ fontSize: 13, color: 'rgba(45,24,16,.55)', lineHeight: 1.4 }}>Reach out to the host directly in the group chat.</div>
            </div>
            <a
              href={event.contact_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', padding: '9px 18px', borderRadius: 999,
                background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                textDecoration: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 3px 10px rgba(255,107,91,.25)',
              }}
            >
              DM →
            </a>
          </div>
        )}

        {/* Host card */}
        {event.host && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, color: '#2D1810' }}>Hosted by</h2>
            <div style={{
              background: '#fff', border: '1px solid rgba(45,24,16,.1)',
              borderRadius: 16, padding: 20,
              display: 'flex', gap: 16, alignItems: 'flex-start',
              boxShadow: '0 2px 8px rgba(45,24,16,.04)',
            }}>
              {/* Photo — blurred for guests */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {event.host.profile_image ? (
                  <img src={event.host.profile_image} alt="" style={{
                    width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
                    filter: session ? 'none' : 'blur(10px)',
                  }} />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900, color: '#fff',
                    filter: session ? 'none' : 'blur(6px)',
                  }}>
                    {event.host.name[0]}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#2D1810' }}>{event.host.name}</span>
                  {event.host.nationality && (
                    <span style={{ fontSize: 12, color: 'rgba(45,24,16,.45)' }}>{event.host.nationality}</span>
                  )}
                </div>
                {event.host.bio && (
                  <p style={{ fontSize: 13, color: 'rgba(45,24,16,.6)', lineHeight: 1.5, marginBottom: 10 }}>
                    {event.host.bio}
                  </p>
                )}
                {session ? (
                  event.host.social_links.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {event.host.social_links.map(l => (
                        <a key={l.platform} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(45,24,16,.06)', border: '1px solid rgba(45,24,16,.1)',
                          textDecoration: 'none',
                        }}>
                          <PlatformIcon platform={l.platform} size={16} />
                        </a>
                      ))}
                    </div>
                  )
                ) : (
                  <Link href={`/login?from=/meetups/${id}`} style={{
                    display: 'inline-block', fontSize: 12, fontWeight: 700,
                    padding: '6px 14px', borderRadius: 999, textDecoration: 'none',
                    background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                    color: '#fff',
                    boxShadow: '0 3px 10px rgba(255,107,91,.25)',
                  }}>
                    Sign in to see full profile →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests (host only, upcoming events) */}
        {isHost && !isPast && pendingRsvps.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#2D1810' }}>Pending Requests</h2>
              <span style={{
                padding: '2px 10px', borderRadius: 999,
                background: 'rgba(255,107,91,.12)', color: '#FF6B5B',
                fontSize: 12, fontWeight: 700,
              }}>
                {pendingRsvps.length}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(45,24,16,.45)', marginBottom: 14 }}>
              Review profiles before approving.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {pendingRsvps.map(r => (
                <div key={r.rsvp_id} style={{
                  background: '#fff', border: '1px solid rgba(45,24,16,.1)',
                  borderRadius: 16, padding: 20,
                  boxShadow: '0 1px 4px rgba(45,24,16,.04)',
                }}>
                  <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                    <Link href={`/people/${r.user_id}`} style={{ display: 'flex', gap: 14, flex: 1, textDecoration: 'none' }}>
                      {r.user_image ? (
                        <img src={r.user_image} alt="" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 900, color: '#fff',
                        }}>
                          {r.user_name[0]}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: '#2D1810' }}>{r.user_name}</span>
                          {r.user_nationality && (
                            <span style={{ fontSize: 12, color: 'rgba(45,24,16,.45)' }}>{r.user_nationality}</span>
                          )}
                        </div>
                        {r.user_bio && (
                          <p style={{ fontSize: 13, color: 'rgba(45,24,16,.6)', lineHeight: 1.5 }}>{r.user_bio}</p>
                        )}
                      </div>
                    </Link>
                  </div>
                  {r.message && (
                    <p style={{
                      fontSize: 13, color: 'rgba(45,24,16,.7)',
                      background: 'rgba(45,24,16,.04)', padding: '8px 10px',
                      borderRadius: 8, marginBottom: 14, lineHeight: 1.5,
                      borderLeft: '2px solid rgba(255,107,91,.4)',
                    }}>
                      &quot;{r.message}&quot;
                    </p>
                  )}
                  <RsvpActions rsvpId={r.rsvp_id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memories (shown after event ends) */}
        {isPast && (
          <MemoriesSection
            eventId={id}
            canPost={!!canPostMemory}
            currentUserId={session?.user?.id}
          />
        )}

        {/* Who's going */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, color: '#2D1810' }}>
            {"Who's going"} ({approvedCount})
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(45,24,16,.45)', marginBottom: 16 }}>
            {"See profiles before you apply — that's the ChatDa difference."}
          </p>

          {session ? (
            attendees.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(45,24,16,.3)', fontSize: 15 }}>
                Be the first to apply!
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {attendees.map(a => (
                  <AttendeeCard key={a.id} attendee={a} isHost={!!isHost} />
                ))}
              </div>
            )
          ) : (
            <div style={{
              background: '#fff', border: '1px solid rgba(45,24,16,.1)',
              borderRadius: 16, padding: 32, textAlign: 'center',
              boxShadow: '0 2px 8px rgba(45,24,16,.04)',
            }}>
              <p style={{ fontSize: 15, color: 'rgba(45,24,16,.55)', marginBottom: 16 }}>
                Sign in to see who&apos;s going
              </p>
              <Link href={`/login?from=/meetups/${id}`} style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 999,
                background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(255,107,91,.28)',
              }}>
                Sign in →
              </Link>
            </div>
          )}
        </div>
      </div>

      <MeetupBottomBar
        eventId={id}
        title={event.title}
        isLoggedIn={!!session}
        isFull={spotsLeft <= 0}
        isPast={isPast}
        existingStatus={myRsvpStatus}
        contactLink={event.contact_link}
      />
    </div>
  );
}
