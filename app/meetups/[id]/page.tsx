import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { Nav } from '@/components/ui/Nav';
import { Orb } from '@/components/ui/Card';
import { AttendeeCard, type Attendee } from '@/components/AttendeeCard';
import { RsvpButton } from '@/components/RsvpButton';
import { ShareButton } from '@/components/ShareButton';
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
    const ogImage = event.cover_image && /^https?:\/\//i.test(event.cover_image)
      ? event.cover_image
      : undefined;

    return {
      title: `${event.title} · ChatDa`,
      description,
      openGraph: {
        title: event.title,
        description,
        url,
        siteName: 'ChatDa',
        type: 'website',
        ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      },
      twitter: {
        card: ogImage ? 'summary_large_image' : 'summary',
        title: event.title,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
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

  const attendees: Attendee[] = event.attendees.map(a => ({
    id: a.id, name: a.name, nationality: a.nationality,
    bio: a.bio, profileImage: a.profile_image, socialLinks: a.social_links,
  }));

  const approvedCount = event.approved_count;
  const spotsLeft = event.capacity - approvedCount;
  const d = new Date(event.date + 'T00:00');

  // Event considered past at end-of-day of event.date
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
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Nav user={session?.user} isAdmin={isAdminEmail(session?.user?.email)} />
      <Orb size={400} color="rgba(108,92,231,.2)" top={-50} right={-100} />

      {/* Cover image — full width below nav */}
      {event.cover_image && (
        <div style={{ width: '100%', height: 280, overflow: 'hidden', position: 'relative' }}>
          <img src={event.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(16,8,36,.95) 100%)',
          }} />
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 24px 120px', position: 'relative', zIndex: 1 }}>

        <Link href="/meetups" style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
          ← Meetups
        </Link>

        {/* Title + host edit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, lineHeight: 1.15, flex: 1 }}>
            {event.title}
          </h1>
          {isHost && (
            <Link href={`/host/events/${id}/edit`} style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
              color: 'rgba(255,255,255,.85)', textDecoration: 'none',
              flexShrink: 0, marginTop: 4,
            }}>Edit</Link>
          )}
        </div>

        {/* Info card */}
        <div style={{
          background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 16, padding: 20, display: 'grid', gap: 14, marginBottom: 12,
        }}>
          {/* Date/Time */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
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

          <div style={{ height: 1, background: 'rgba(255,255,255,.08)' }} />

          {/* Location */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{event.location}</div>
              {event.area && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{event.area}</div>}
              {(event.google_map_url || event.naver_map_url) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {event.google_map_url && (
                    <a href={event.google_map_url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                      background: 'rgba(66,133,244,.15)', border: '1px solid rgba(66,133,244,.35)',
                      color: '#4285F4', textDecoration: 'none',
                    }}>Google Maps →</a>
                  )}
                  {event.naver_map_url && (
                    <a href={event.naver_map_url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                      background: 'rgba(3,199,90,.12)', border: '1px solid rgba(3,199,90,.3)',
                      color: '#03C75A', textDecoration: 'none',
                    }}>Naver Maps →</a>
                  )}
                </div>
              )}
              {event.directions && (
                <div style={{
                  marginTop: 10, padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                      How to find us
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.55, whiteSpace: 'pre-wrap', margin: 0 }}>
                      {event.directions}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,.08)' }} />

          {/* Capacity */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>👥</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{approvedCount}/{event.capacity} going</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
              </div>
            </div>
          </div>

          {(event.fee > 0 || event.payment_method) && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,.08)' }} />
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22 }}>💰</span>
                <div>
                  {event.fee > 0 && (
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                      ₩{event.fee.toLocaleString()} entry fee
                    </div>
                  )}
                  {event.payment_method && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>
                      {paymentLabels[event.payment_method] ?? event.payment_method}
                    </div>
                  )}
                  {event.fee_note && (
                    <div style={{ fontSize: 13, color: '#FF6B35', marginTop: 4, fontWeight: 600 }}>
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
            background: 'rgba(255,107,53,.06)', border: '1px solid rgba(255,107,53,.2)',
            borderRadius: 16, padding: 16, marginBottom: 28,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FF6B35', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Requirements to join
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 10, lineHeight: 1.5 }}>
              For safety and a wholesome meetup, attendees must have:
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {event.requirements.map(r => (
                <span key={r} style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(255,107,53,.12)', border: '1px solid rgba(255,107,53,.25)',
                  color: '#FF6B35',
                }}>
                  {reqLabels[r] ?? r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {event.description && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>About</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {event.description}
            </p>
          </div>
        )}

        {/* Host card */}
        {event.host && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Hosted by</h2>
            <div style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 16, padding: 20,
              display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
              {event.host.profile_image ? (
                <img src={event.host.profile_image} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 900, color: '#fff',
                }}>
                  {event.host.name[0]}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{event.host.name}</span>
                  {event.host.nationality && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{event.host.nationality}</span>
                  )}
                </div>
                {event.host.bio && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 10 }}>
                    {event.host.bio}
                  </p>
                )}
                {event.host.social_links.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {event.host.social_links.map(l => (
                      <a key={l.platform} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                        textDecoration: 'none',
                      }}>
                        <PlatformIcon platform={l.platform} size={16} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests (host only, upcoming events) */}
        {isHost && !isPast && pendingRsvps.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800 }}>Pending Requests</h2>
              <span style={{
                padding: '2px 10px', borderRadius: 999,
                background: 'rgba(255,107,53,.2)', color: '#FF6B35',
                fontSize: 12, fontWeight: 700,
              }}>
                {pendingRsvps.length}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 14 }}>
              Review profiles before approving.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {pendingRsvps.map(r => (
                <div key={r.rsvp_id} style={{
                  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 16, padding: 20,
                }}>
                  <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                    {r.user_image ? (
                      <img src={r.user_image} alt="" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 900, color: '#fff',
                      }}>
                        {r.user_name[0]}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 15 }}>{r.user_name}</span>
                        {r.user_nationality && (
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{r.user_nationality}</span>
                        )}
                      </div>
                      {r.user_bio && (
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>{r.user_bio}</p>
                      )}
                      {r.message && (
                        <p style={{
                          fontSize: 13, color: 'rgba(255,255,255,.7)',
                          background: 'rgba(255,255,255,.04)', padding: '8px 10px',
                          borderRadius: 8, marginTop: 8, lineHeight: 1.5,
                          borderLeft: '2px solid rgba(255,107,53,.5)',
                        }}>
                          "{r.message}"
                        </p>
                      )}
                    </div>
                  </div>
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
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>
            {"Who's going"} ({approvedCount})
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 16 }}>
            {"See profiles before you apply — that's the chatda difference."}
          </p>

          {session ? (
            attendees.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,.25)', fontSize: 15 }}>
                Be the first to apply!
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {attendees.map(a => <AttendeeCard key={a.id} attendee={a} />)}
              </div>
            )
          ) : (
            <div style={{
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 16, padding: 32, textAlign: 'center',
            }}>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', marginBottom: 16 }}>
                Sign in to see who's going
              </p>
              <Link href={`/login?from=/meetups/${id}`} style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 999,
                background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}>
                Sign in →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '14px 24px 24px',
        background: 'rgba(26,16,51,.92)', backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,.1)',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            {isPast ? (
              <div style={{
                padding: '14px 20px', borderRadius: 999, textAlign: 'center',
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                color: 'rgba(255,255,255,.5)', fontWeight: 700, fontSize: 14,
              }}>
                This meetup has ended
              </div>
            ) : (
              <RsvpButton
                eventId={id}
                isLoggedIn={!!session}
                isFull={spotsLeft <= 0}
                existingStatus={myRsvpStatus}
              />
            )}
          </div>
          <ShareButton title={event.title} />
        </div>
      </div>
    </div>
  );
}
