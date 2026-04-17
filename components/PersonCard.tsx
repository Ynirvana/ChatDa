'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { USER_STATUSES, LOOKING_FOR_OPTIONS } from '@/lib/constants';
import { track } from '@/lib/analytics';

// Status별 커버 배너 그라데이션 (카드 상단 80px)
const COVER_GRADIENT: Record<string, string> = {
  local:          'linear-gradient(135deg, #00B894 0%, #00CEC9 100%)',
  expat:          'linear-gradient(135deg, #FF6B35 0%, #E84393 100%)',
  visitor:        'linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%)',
  visiting_soon:  'linear-gradient(135deg, #E84393 0%, #FF6B35 100%)',
  visited_before: 'linear-gradient(135deg, #636E72 0%, #B2BEC3 100%)',
};

const STATUS_COLORS: Record<string, string> = {
  local: '#00B894',
  expat: '#FF6B35',
  visitor: '#A29BFE',
  visiting_soon: '#E84393',
  visited_before: '#636E72',
};

const FLAG_MAP: Record<string, string> = {
  Korean: '🇰🇷', American: '🇺🇸', British: '🇬🇧', French: '🇫🇷', German: '🇩🇪',
  Italian: '🇮🇹', Japanese: '🇯🇵', Chinese: '🇨🇳', Vietnamese: '🇻🇳', Thai: '🇹🇭',
  Australian: '🇦🇺', Canadian: '🇨🇦', Brazilian: '🇧🇷', Indian: '🇮🇳', Spanish: '🇪🇸',
  Dutch: '🇳🇱', Swedish: '🇸🇪', Uzbek: '🇺🇿', Filipino: '🇵🇭', Indonesian: '🇮🇩',
};

export interface PersonTag {
  tag: string;
  category: 'can_do' | 'looking_for';
}

export interface PersonConnection {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PersonData {
  id: string;
  name: string;
  nationality: string | null;
  location: string | null;
  status: string | null;
  looking_for?: string[];
  languages?: { language: string; level: string }[];
  interests?: string[];
  bio: string | null;
  profile_image: string | null;
  social_links: { platform: string; url: string }[];
  social_platforms?: string[];
  tags?: PersonTag[];
  connection?: PersonConnection | null;
  mutual_count?: number;
}

export function PersonCard({
  person,
  authed,
  onConnect,
}: {
  person: PersonData;
  authed: boolean;
  onConnect?: (recipientId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [connStatus, setConnStatus] = useState(person.connection?.status ?? null);

  const statusMeta = USER_STATUSES.find(s => s.id === person.status);
  const statusColor = STATUS_COLORS[person.status ?? ''] ?? 'rgba(255,255,255,.3)';
  const coverGradient = COVER_GRADIENT[person.status ?? ''] ?? COVER_GRADIENT.expat;
  const flag = FLAG_MAP[person.nationality ?? ''] ?? '🌍';

  const isConnected = connStatus === 'accepted';
  const showSocial = isConnected && person.social_links.length > 0;
  const mutual = person.mutual_count ?? 0;

  const handleConnect = async () => {
    if (!onConnect || busy) return;
    setBusy(true);
    try {
      await onConnect(person.id);
      setConnStatus('pending');
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,.04)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 18,
        overflow: 'hidden',
        transition: 'border-color .2s, transform .2s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Cover banner + round avatar (clickable → /people/[id]) */}
      <Link
        href={`/people/${person.id}`}
        onClick={() => track('people_card_click', {
          target_id: person.id,
          target_status: person.status ?? 'unknown',
          connection_status: connStatus ?? 'none',
        })}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <div style={{
          position: 'relative',
          height: 80,
          background: coverGradient,
        }}>
          {!authed && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(26,16,51,.35)',
            }} />
          )}
          {/* Avatar — 커버 위에 반쯤 걸침 */}
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: -40,
            transform: 'translateX(-50%)',
            width: 80, height: 80, borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid rgba(26,16,51,1)',
            background: 'linear-gradient(135deg, #FF6B35, #E84393)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {person.profile_image ? (
              <img
                src={person.profile_image}
                alt={person.name}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: authed ? 'none' : 'blur(14px)',
                }}
              />
            ) : (
              <span style={{
                fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,.85)',
                filter: authed ? 'none' : 'blur(6px)',
              }}>
                {person.name[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div style={{
        padding: '52px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        textAlign: 'center',
      }}>
        {/* Name + flag */}
        <Link
          href={`/people/${person.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 16 }}>{flag}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
              {person.name}
            </span>
          </div>
        </Link>

        {/* Status + Location 한 줄 */}
        {(statusMeta || person.location) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flexWrap: 'wrap', justifyContent: 'center',
            marginBottom: 10,
          }}>
            {statusMeta && (
              <span style={{
                padding: '3px 10px', borderRadius: 999,
                fontSize: 11, fontWeight: 700,
                background: `${statusColor}22`, color: statusColor,
              }}>
                {statusMeta.label}
              </span>
            )}
            {person.location && (
              <span style={{
                fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600,
              }}>
                📍 {person.location}
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {authed ? (
          person.bio && (
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.4,
              marginBottom: 10,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {person.bio}
            </p>
          )
        ) : (
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,.3)',
            fontStyle: 'italic', marginBottom: 10,
          }}>
            Sign up to see bio
          </p>
        )}

        {/* looking_for motivation pills (최대 2개 + +N) */}
        {authed && (person.looking_for?.length ?? 0) > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 4,
            justifyContent: 'center', marginBottom: 10,
          }}>
            {person.looking_for!.slice(0, 2).map(id => {
              const opt = LOOKING_FOR_OPTIONS.find(o => o.id === id);
              if (!opt) return null;
              return (
                <span key={id} style={{
                  padding: '3px 9px', borderRadius: 999,
                  fontSize: 10, fontWeight: 700,
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.1)',
                  color: 'rgba(255,255,255,.55)',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 11 }}>{opt.emoji}</span>
                  {opt.label}
                </span>
              );
            })}
            {person.looking_for!.length > 2 && (
              <span style={{
                padding: '3px 8px', borderRadius: 999,
                fontSize: 10, fontWeight: 700,
                color: 'rgba(255,255,255,.35)',
              }}>
                +{person.looking_for!.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Mutual count */}
        {authed && mutual > 0 && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            color: '#A29BFE', marginBottom: 10,
          }}>
            👥 {mutual} mutual {mutual === 1 ? 'connection' : 'connections'}
          </p>
        )}

        {/* spacer — 하단 버튼을 바닥에 붙이기 */}
        <div style={{ flex: 1 }} />

        {/* Social (connected 시) */}
        {showSocial && (
          <div style={{
            display: 'flex', gap: 8, marginBottom: 10,
            justifyContent: 'center',
          }}>
            {person.social_links.map(sl => (
              <a
                key={sl.platform}
                href={sl.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ opacity: 0.75, transition: 'opacity .15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.75'; }}
              >
                <PlatformIcon platform={sl.platform} size={22} />
              </a>
            ))}
          </div>
        )}

        {/* CTA — outline 스타일 */}
        {authed ? (
          connStatus === 'accepted' ? (
            <div style={{
              padding: '8px 0', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              color: '#00B894',
              background: 'rgba(0,184,148,.1)',
              border: '1px solid rgba(0,184,148,.3)',
            }}>
              ✓ Connected
            </div>
          ) : connStatus === 'pending' ? (
            <div style={{
              padding: '8px 0', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              color: '#FFC107',
              background: 'rgba(255,193,7,.08)',
              border: '1px solid rgba(255,193,7,.3)',
            }}>
              Pending
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={busy}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 999,
                fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
                cursor: busy ? 'wait' : 'pointer',
                background: 'transparent',
                border: '1.5px solid rgba(255,107,53,.5)',
                color: '#FF6B35',
                transition: 'all .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B35, #E84393)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#FF6B35';
                e.currentTarget.style.borderColor = 'rgba(255,107,53,.5)';
              }}
            >
              {busy ? '...' : '+ Connect'}
            </button>
          )
        ) : (
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '8px 0', textAlign: 'center', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              background: 'linear-gradient(135deg, #FF6B35, #E84393)',
              color: '#fff',
            }}>
              Sign up to connect →
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
