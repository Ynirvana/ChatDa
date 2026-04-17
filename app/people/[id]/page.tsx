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
  tourist: '#A29BFE', student: '#74B9FF', expat: '#FF6B35',
  local_korean: '#00B894', local_student: '#00B894', korean_worker: '#00B894',
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
  native: '#00B894',
  fluent: '#74B9FF',
  conversational: '#FFC107',
  learning: 'rgba(255,255,255,.4)',
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
  const statusColor = STATUS_COLORS[profile.status ?? ''] ?? 'rgba(255,255,255,.3)';
  const flag = FLAG_MAP[profile.nationality ?? ''] ?? '🌍';
  const canDo = profile.tags.filter(t => t.category === 'can_do');
  const lookingFor = profile.tags.filter(t => t.category === 'looking_for');
  const isConnected = profile.connection?.status === 'accepted';
  const stayLine = formatStay(profile.status, profile.stay_arrived, profile.stay_departed);

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="page-bg">
      <Nav user={session?.user} isAdmin={isAdminEmail(session?.user?.email)} />
      <Orb size={400} color="rgba(108,92,231,.25)" top={50} left={-150} />
      <Orb size={300} color="rgba(232,67,147,.2)" top={250} right={-80} delay={2} />

      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 600, margin: '0 auto',
        padding: '32px 20px 80px',
      }}>
        {/* Photo */}
        <div style={{
          width: '100%', maxWidth: 320, aspectRatio: '1',
          margin: '0 auto 24px', borderRadius: 24, overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255,107,53,.15), rgba(232,67,147,.15))',
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
              background: 'linear-gradient(135deg, #FF6B35, #E84393)',
              fontSize: 80, fontWeight: 900, color: 'rgba(255,255,255,.7)',
              filter: authed ? 'none' : 'blur(8px)',
            }}>
              {profile.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + nationality */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
            <span style={{ marginRight: 8 }}>{flag}</span>
            {profile.name}
          </h1>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {statusMeta && (
              <span style={{
                display: 'inline-block', padding: '5px 16px', borderRadius: 999,
                fontSize: 13, fontWeight: 700,
                background: `${statusColor}22`, color: statusColor,
              }}>
                {statusMeta.label}
              </span>
            )}
            {profile.location && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 14px', borderRadius: 999,
                fontSize: 13, fontWeight: 700,
                background: 'rgba(255,255,255,.06)',
                color: 'rgba(255,255,255,.7)',
                border: '1px solid rgba(255,255,255,.1)',
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
              <p style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,.75)' }}>{memberSince}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>member since</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {authed ? (
          profile.bio && (
            <Card style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>
                {profile.bio}
              </p>
            </Card>
          )
        ) : (
          <Card style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', fontStyle: 'italic' }}>
              Sign up to see bio
            </p>
          </Card>
        )}

        {/* Stay line — 짧게 한 줄 */}
        {authed && stayLine && (
          <p style={{
            textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.5)',
            marginBottom: 14, fontWeight: 600,
          }}>
            🗓️ {stayLine}
          </p>
        )}

        {/* Languages */}
        {authed && profile.languages && profile.languages.length > 0 && (
          <Card style={{ padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 10 }}>
              Languages
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.languages.map(l => {
                const color = LANG_LEVEL_COLOR[l.level] ?? 'rgba(255,255,255,.4)';
                return (
                  <div key={l.language} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 999,
                    background: 'rgba(255,255,255,.06)',
                    border: `1px solid ${color}44`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{l.language}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color,
                      padding: '2px 7px', borderRadius: 999,
                      background: `${color}22`,
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
          <Card style={{ padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 10 }}>
              Interests
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.interests.map(t => (
                <span key={t} style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  background: 'rgba(162,155,254,.15)', color: '#A29BFE',
                }}>{t}</span>
              ))}
            </div>
          </Card>
        )}

        {/* Tags */}
        {authed && (canDo.length > 0 || lookingFor.length > 0) && (
          <Card style={{ padding: 20, marginBottom: 16 }}>
            {canDo.length > 0 && (
              <div style={{ marginBottom: lookingFor.length > 0 ? 12 : 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#00B894', marginBottom: 8 }}>
                  Can help with
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {canDo.map(t => (
                    <span key={t.tag} style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      background: 'rgba(0,184,148,.15)', color: '#00B894',
                    }}>{t.tag}</span>
                  ))}
                </div>
              </div>
            )}
            {lookingFor.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#74B9FF', marginBottom: 8 }}>
                  Looking for
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lookingFor.map(t => (
                    <span key={t.tag} style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      background: 'rgba(116,185,255,.15)', color: '#74B9FF',
                    }}>{t.tag}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Social links — connected: full, not connected: icons only */}
        {authed && profile.social_platforms.length > 0 && (
          <Card style={{ padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', marginBottom: 10 }}>
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
                      background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                      fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.7)',
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
                    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                  }}>
                    <PlatformIcon platform={p} size={20} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>🔒</span>
                  </div>
                ))}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontStyle: 'italic' }}>
                  Connect to see links
                </span>
              </div>
            )}
          </Card>
        )}

        {/* Hosted events — MVP에서 숨김. Meetups 되살릴 때 복원. */}
        {false && profile.hosted_events.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,.5)', marginBottom: 10 }}>
              Hosted Meetups
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {profile.hosted_events.map(e => (
                <Link key={e.id} href={`/meetups/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Card style={{ padding: 14 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{e.title}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
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
              fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg, #FF6B35, #E84393)',
              color: '#fff',
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
      <p style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{value}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{label}</p>
    </div>
  );
}
