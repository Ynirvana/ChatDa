import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { Nav } from '@/components/ui/Nav';
import { Card, Orb } from '@/components/ui/Card';
import { backendFetch, type ApiProfile } from '@/lib/server-api';
import { USER_STATUSES } from '@/lib/constants';
import { formatTime } from '@/lib/utils';
import { CopyEventLink } from '@/components/CopyEventLink';
import { TagEditor } from '@/components/TagEditor';
import { ConnectionRequests } from '@/components/ConnectionRequests';
import { ProfileCompleteness } from '@/components/ProfileCompleteness';
import { StayDatesEditor } from '@/components/StayDatesEditor';
import { LanguagesEditor } from '@/components/LanguagesEditor';
import { InterestsEditor } from '@/components/InterestsEditor';
import { PlatformIcon } from '@/components/ui/PlatformIcon';

const statusStyle: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'rgba(255,234,167,.9)', bg: 'rgba(255,255,255,.08)' },
  approved:  { label: 'Approved',  color: 'rgba(0,184,148,.9)',   bg: 'rgba(255,255,255,.08)' },
  rejected:  { label: 'Rejected',  color: 'rgba(255,255,255,.3)', bg: 'rgba(255,255,255,.08)' },
  cancelled: { label: 'Cancelled', color: 'rgba(255,255,255,.3)', bg: 'rgba(255,255,255,.08)' },
  hosting:   { label: 'Hosting',   color: '#FF6B35',               bg: 'rgba(255,107,53,.15)' },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  let profile: ApiProfile;
  try {
    profile = await backendFetch<ApiProfile>('/users/me');
  } catch {
    redirect('/onboarding');
  }

  if (!profile!.onboarding_complete) redirect('/onboarding');

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Nav user={session.user} isAdmin={isAdminEmail(session.user.email)} />
      <Orb size={400} color="rgba(108,92,231,.2)" top={-50} left={-100} />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Completeness bar */}
        <ProfileCompleteness profile={profile} />

        {/* Profile header */}
        <Card style={{ marginBottom: 24, padding: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
            {profile.profile_image ? (
              <img src={profile.profile_image} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 900, color: '#fff',
              }}>
                {profile.name[0]}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900 }}>{profile.name}</h1>
                <Link href="/onboarding?edit=1" style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
                  color: 'rgba(255,255,255,.5)', textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}>Edit</Link>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {profile.nationality && (
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{profile.nationality}</span>
                )}
                {profile.location && (
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
                    📍 {profile.location}
                  </span>
                )}
                {profile.status && (() => {
                  const s = USER_STATUSES.find(s => s.id === profile.status);
                  return s ? (
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(255,107,53,.15)', color: '#FF6B35',
                      border: '1px solid rgba(255,107,53,.3)',
                    }}>
                      {s.label}
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, marginBottom: 16 }}>
              {profile.bio}
            </p>
          )}

          {profile.social_links.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {profile.social_links.map(l => (
                <a key={l.platform} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 999,
                  background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                  fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.7)',
                  textDecoration: 'none',
                }}>
                  <PlatformIcon platform={l.platform} size={20} />
                  {l.platform}
                </a>
              ))}
            </div>
          )}
        </Card>

        {/* Connection Requests */}
        <ConnectionRequests />

        {/* Stay dates — Local은 컴포넌트 내부에서 null 반환 */}
        {profile.status !== 'local' && (
          <Card style={{ marginBottom: 24, padding: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>Stay in Korea</h2>
            <StayDatesEditor
              status={profile.status}
              initialArrived={profile.stay_arrived}
              initialDeparted={profile.stay_departed}
            />
          </Card>
        )}

        {/* Languages */}
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>Languages spoken</h2>
          <LanguagesEditor initial={profile.languages ?? []} />
        </Card>

        {/* Interests */}
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>Interests</h2>
          <InterestsEditor initial={profile.interests ?? []} />
        </Card>

        {/* Tags */}
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>My Tags</h2>
          <TagEditor initial={profile.tags ?? []} />
        </Card>

        {/* My Meetups — MVP에서 숨김. Meetups 되살릴 때 false → true 로 복원. */}
        {false && <>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>My Meetups</h2>

        {(() => {
          const items = [
            ...profile.hosted_events.map(h => ({
              key: `h-${h.event_id}`,
              event_id: h.event_id,
              title: h.title,
              date: h.date,
              time: h.time,
              area: h.area,
              statusKey: 'hosting',
            })),
            ...profile.rsvps.map(r => ({
              key: `r-${r.rsvp_id}`,
              event_id: r.event_id,
              title: r.title,
              date: r.date,
              time: r.time,
              area: r.area,
              statusKey: r.status,
            })),
          ].sort((a, b) => a.date.localeCompare(b.date));

          if (items.length === 0) {
            return (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'rgba(255,255,255,.3)', marginBottom: 16 }}>No meetups yet.</p>
                <Link href="/meetups" style={{
                  display: 'inline-block', padding: '10px 24px', borderRadius: 999,
                  background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                  color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}>
                  Browse Meetups →
                </Link>
              </Card>
            );
          }

          return (
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map(it => {
                const s = statusStyle[it.statusKey] ?? statusStyle.pending;
                const d = new Date(it.date + 'T00:00');
                return (
                  <Link key={it.key} href={`/meetups/${it.event_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{it.title}</h3>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)' }}>
                            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {formatTime(it.time)}
                            {it.area ? ` · ${it.area}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                          {it.statusKey === 'hosting' && (
                            <CopyEventLink eventId={it.event_id} title={it.title} />
                          )}
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '4px 10px',
                            borderRadius: 999, background: s.bg,
                            color: s.color, whiteSpace: 'nowrap',
                          }}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          );
        })()}
        </>}
      </div>
    </div>
  );
}
