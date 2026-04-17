import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { backendFetch } from '@/lib/server-api';
import { Nav } from '@/components/ui/Nav';
import { Card, Orb } from '@/components/ui/Card';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { USER_STATUSES } from '@/lib/constants';
import { notFound } from 'next/navigation';
import { ProfileConnectButton } from './ProfileConnectButton';

const STATUS_COLORS: Record<string, string> = {
  local: '#00957A',
  expat: '#E84F3D',
  visitor: '#6C5CE7',
  visiting_soon: '#E84393',
  visited_before: '#6B5A4D',
};

const FLAG_MAP: Record<string, string> = {
  Korean: '🇰🇷', American: '🇺🇸', British: '🇬🇧', French: '🇫🇷', German: '🇩🇪',
  Italian: '🇮🇹', Japanese: '🇯🇵', Chinese: '🇨🇳', Vietnamese: '🇻🇳', Thai: '🇹🇭',
  Australian: '🇦🇺', Canadian: '🇨🇦', Brazilian: '🇧🇷', Indian: '🇮🇳', Spanish: '🇪🇸',
  Dutch: '🇳🇱', Swedish: '🇸🇪', Uzbek: '🇺🇿', Filipino: '🇵🇭', Indonesian: '🇮🇩',
};

interface UserProfile {
  id: string;
  name: string;
  nationality: string | null;
  location: string | null;
  status: string | null;
  looking_for?: string[];
  stay_arrived: string | null;
  stay_departed: string | null;
  languages: { language: string; level: string }[];
  interests: string[];
  bio: string | null;
  profile_image: string | null;
  social_links: { platform: string; url: string }[];
  social_platforms: string[];
  tags: { tag: string; category: string }[];
  connection: { id: string; status: string } | null;
  hosted_events: { id: string; title: string; date: string; area: string | null }[];
  attended_count: number;
  mutual_count: number;
  created_at: string | null;
}

const LANG_LEVEL_COLOR: Record<string, string> = {
  native: '#00957A',
  fluent: '#3E82CB',
  conversational: '#C68600',
  learning: 'rgba(45, 24, 16, .5)',
};

const LANG_LEVEL_LABEL: Record<string, string> = {
  native: 'Native',
  fluent: 'Fluent',
  conversational: 'Conversational',
  learning: 'Learning',
};

function formatStay(
  status: string | null,
  arrived: string | null,
  departed: string | null,
): string | null {
  if (!arrived && !departed) return null;
  const fmt = (s: string | null) =>
    s ? new Date(s + 'T00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
  if (status === 'expat') return arrived ? `In Korea since ${fmt(arrived)}` : null;
  if (status === 'visiting_soon') return arrived ? `Arriving ${fmt(arrived)}` : null;
  if (status === 'visitor')
    return [arrived && `Arrived ${fmt(arrived)}`, departed && `leaving ${fmt(departed)}`]
      .filter(Boolean).join(' · ') || null;
  if (status === 'visited_before')
    return [arrived && fmt(arrived), departed && fmt(departed)].filter(Boolean).join(' – ') || null;
  return null;
}

export default async function PersonProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const authed = !!session?.user?.id;

  let profile: UserProfile;
  try {
    profile = await backendFetch<UserProfile>(`/users/${id}/profile`);
  } catch {
    notFound();
  }

  const statusMeta = USER_STATUSES.find(s => s.id === profile.status);
  const statusColor = STATUS_COLORS[profile.status ?? ''] ?? '#6B5A4D';
  const flag = FLAG_MAP[profile.nationality ?? ''] ?? '🌍';
  const canDo = profile.tags.filter(t => t.category === 'can_do');
  const lookingFor = profile.tags.filter(t => t.category === 'looking_for');
  const isConnected = profile.connection?.status === 'accepted';
  const stayLine = formatStay(profile.status, profile.stay_arrived, profile.stay_departed);

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="page-bg-light">
      <Nav user={session?.user} isAdmin={isAdminEmail(session?.user?.email)} light />
      <Orb size={400} color="rgba(255, 140, 120, .16)" top={50} left={-150} />
      <Orb size={300} color="rgba(232, 67, 147, .12)" top={250} right={-80} delay={2} />

      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 600, margin: '0 auto',
        padding: '32px 20px 80px',
      }}>
        {/* Photo */}
        <div style={{
          width: '100%', maxWidth: 320, aspectRatio: '1',
          margin: '0 auto 24px', borderRadius: 24, overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255,107,91,.15), rgba(232,67,147,.15))',
          boxShadow: '0 12px 34px rgba(45, 24, 16, .12)',
        }}>
          {profile.profile_image ? (
            <img
              src={profile.profile_image}
              alt={profile.name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: authed ? 'none' : 'blur(16px)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
              fontSize: 80, fontWeight: 900, color: 'rgba(255,255,255,.95)',
              filter: authed ? 'none' : 'blur(8px)',
            }}>
              {profile.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + nationality */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#2D1810' }}>
            <span style={{ marginRight: 8 }}>{flag}</span>
            {profile.name}
          </h1>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {statusMeta && (
              <span style={{
                display: 'inline-block', padding: '5px 16px', borderRadius: 999,
                fontSize: 13, fontWeight: 700,
                background: `${statusColor}1A`, color: statusColor,
                border: `1px solid ${statusColor}33`,
              }}>
                {statusMeta.label}
              </span>
            )}
            {profile.location && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 14px', borderRadius: 999,
                fontSize: 13, fontWeight: 700,
                background: '#FFFFFF',
                color: '#3D2416',
                border: '1px solid rgba(45, 24, 16, .12)',
              }}>
                📍 {profile.location}
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginBottom: 20, flexWrap: 'wrap',
        }}>
          {authed && profile.mutual_count > 0 && (
            <StatBadge value={profile.mutual_count} label="mutual" />
          )}
          {memberSince && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#3D2416' }}>{memberSince}</p>
              <p style={{ fontSize: 11, color: 'rgba(45, 24, 16, .5)' }}>member since</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {authed ? (
          profile.bio && (
            <Card light style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 16, color: 'rgba(45, 24, 16, .8)', lineHeight: 1.6 }}>
                {profile.bio}
              </p>
            </Card>
          )
        ) : (
          <Card light style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'rgba(45, 24, 16, .45)', fontStyle: 'italic' }}>
              Sign up to see bio
            </p>
          </Card>
        )}

        {/* Stay line — 짧게 한 줄 */}
        {authed && stayLine && (
          <p style={{
            textAlign: 'center', fontSize: 13, color: 'rgba(45, 24, 16, .65)',
            marginBottom: 14, fontWeight: 700,
          }}>
            🗓️ {stayLine}
          </p>
        )}

        {/* Languages */}
        {authed && profile.languages && profile.languages.length > 0 && (
          <Card light style={{ padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(45, 24, 16, .5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Languages
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.languages.map(l => {
                const color = LANG_LEVEL_COLOR[l.level] ?? 'rgba(45, 24, 16, .5)';
                return (
                  <div key={l.language} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 999,
                    background: 'rgba(45, 24, 16, .03)',
                    border: `1px solid ${color}33`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2D1810' }}>{l.language}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color,
                      padding: '2px 7px', borderRadius: 999,
                      background: `${color}1A`,
                    }}>
                      {LANG_LEVEL_LABEL[l.level] ?? l.level}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Interests */}
        {authed && profile.interests && profile.interests.length > 0 && (
          <Card light style={{ padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(45, 24, 16, .5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Interests
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.interests.map(t => (
                <span key={t} style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  background: 'rgba(108, 92, 231, .1)', color: '#6C5CE7',
                  border: '1px solid rgba(108, 92, 231, .22)',
                }}>{t}</span>
              ))}
            </div>
          </Card>
        )}

        {/* Tags */}
        {authed && (canDo.length > 0 || lookingFor.length > 0) && (
          <Card light style={{ padding: 20, marginBottom: 16 }}>
            {canDo.length > 0 && (
              <div style={{ marginBottom: lookingFor.length > 0 ? 12 : 0 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#00957A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Can help with
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {canDo.map(t => (
                    <span key={t.tag} style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      background: 'rgba(0, 149, 122, .1)', color: '#00957A',
                      border: '1px solid rgba(0, 149, 122, .24)',
                    }}>{t.tag}</span>
                  ))}
                </div>
              </div>
            )}
            {lookingFor.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#3E82CB', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Looking for
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lookingFor.map(t => (
                    <span key={t.tag} style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      background: 'rgba(62, 130, 203, .1)', color: '#3E82CB',
                      border: '1px solid rgba(62, 130, 203, .24)',
                    }}>{t.tag}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Social links — connected: full, not connected: icons only */}
        {authed && profile.social_platforms.length > 0 && (
          <Card light style={{ padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(45, 24, 16, .5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Social
            </p>
            {isConnected ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {profile.social_links.map(sl => (
                  <a
                    key={sl.platform}
                    href={sl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 16px', borderRadius: 999,
                      background: 'rgba(45, 24, 16, .04)',
                      border: '1px solid rgba(45, 24, 16, .12)',
                      fontSize: 13, fontWeight: 700, color: '#3D2416',
                      textDecoration: 'none',
                    }}
                  >
                    <PlatformIcon platform={sl.platform} size={20} />
                    {sl.platform}
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {profile.social_platforms.map(p => (
                  <div key={p} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 999,
                    background: 'rgba(45, 24, 16, .03)',
                    border: '1px solid rgba(45, 24, 16, .1)',
                  }}>
                    <PlatformIcon platform={p} size={20} />
                    <span style={{ fontSize: 12, color: 'rgba(45, 24, 16, .4)' }}>🔒</span>
                  </div>
                ))}
                <span style={{ fontSize: 11, color: 'rgba(45, 24, 16, .5)', fontStyle: 'italic', fontWeight: 600 }}>
                  Connect to see links
                </span>
              </div>
            )}
          </Card>
        )}

        {/* Hosted events — MVP에서 숨김. Meetups 되살릴 때 복원. */}
        {false && profile.hosted_events.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'rgba(45, 24, 16, .55)', marginBottom: 10 }}>
              Hosted Meetups
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {profile.hosted_events.map(e => (
                <Link key={e.id} href={`/meetups/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Card light style={{ padding: 14 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{e.title}</p>
                    <p style={{ fontSize: 12, color: 'rgba(45, 24, 16, .5)' }}>
                      {new Date(e.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {e.area ? ` · ${e.area}` : ''}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Connect action */}
        {authed ? (
          <ProfileConnectButton
            personId={profile.id}
            initialStatus={profile.connection?.status ?? null}
          />
        ) : (
          <a href="/login" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '14px 0', textAlign: 'center', borderRadius: 999,
              fontSize: 15, fontWeight: 800,
              background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
              color: '#fff',
              boxShadow: '0 10px 26px rgba(255, 107, 91, .3), inset 0 1px 0 rgba(255,255,255,.25)',
            }}>
              Sign up to connect →
            </div>
          </a>
        )}
      </section>
    </div>
  );
}

function StatBadge({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 900, color: '#2D1810' }}>{value}</p>
      <p style={{ fontSize: 11, color: 'rgba(45, 24, 16, .5)' }}>{label}</p>
    </div>
  );
}
