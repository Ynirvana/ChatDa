'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { USER_STATUSES, LOOKING_FOR_OPTIONS } from '@/lib/constants';
import { formatStay } from '@/lib/stay-duration';
import { track } from '@/lib/analytics';

// Status별 커버 배너 그라데이션 (카드 상단 80px) — 라이트 팔레트 맞춰 선셋 톤으로 조정
const COVER_GRADIENT: Record<string, string> = {
  local:            'linear-gradient(135deg, #00B894 0%, #00CEC9 100%)',
  expat:            'linear-gradient(135deg, #FF6B5B 0%, #E84393 100%)',
  visitor:          'linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%)',
  exchange_student: 'linear-gradient(135deg, #FDCB6E 0%, #FFA94D 100%)',
  worker:           'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
  // 레거시 — DB에 남아있을 수도 있어 fallback 렌더 유지
  visiting_soon:    'linear-gradient(135deg, #E84393 0%, #FF6B5B 100%)',
  visited_before:   'linear-gradient(135deg, #A28B78 0%, #D4C5B9 100%)',
};

const STATUS_COLORS: Record<string, string> = {
  local: '#00957A',
  expat: '#E84F3D',
  visitor: '#6C5CE7',
  exchange_student: '#D97706',
  worker: '#3B82F6',
  visiting_soon: '#E84393',
  visited_before: '#6B5A4D',
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
  location_district: string | null;
  status: string | null;
  school?: string | null;
  gender?: string | null;
  age?: number | null;
  looking_for?: string[];
  looking_for_custom?: string | null;
  stay_arrived?: string | null;
  stay_departed?: string | null;
  languages?: { language: string; level: string }[];
  interests?: string[];
  bio: string | null;
  profile_image: string | null;
  social_links: { platform: string; url: string }[];
  social_platforms?: string[];
  tags?: PersonTag[];
  connection?: PersonConnection | null;
  mutual_count?: number;
  created_at?: string | null;
  is_hosting?: boolean;
}

export function PersonCard({
  person,
  authed,
  onConnect,
  needsOnboarding = false,
  lockedHref,
  unblurred = false,
}: {
  person: PersonData;
  authed: boolean;
  onConnect?: (recipientId: string) => Promise<void>;
  /** logged in but onboarding not complete — 미인증처럼 보이되 CTA는 /onboarding으로 */
  needsOnboarding?: boolean;
  /** set → all internal Links go here instead of /people/[id] (e.g. awaiting-approval teaser) */
  lockedHref?: string;
  /** 사진/이름 블러를 건너뛰고 authed인 것처럼 보이게 (awaiting-approval 첫 3장 teaser 용). 클릭은 여전히 lockedHref로 막힘. */
  unblurred?: boolean;
}) {
  // 시각적으로 authed 취급 (blur/overlay 무시). 클릭/연결 권한은 별도.
  const visuallyAuthed = authed || unblurred;
  const [busy, setBusy] = useState(false);
  const [connStatus, setConnStatus] = useState(person.connection?.status ?? null);

  const statusMeta = USER_STATUSES.find(s => s.id === person.status);
  const statusColor = STATUS_COLORS[person.status ?? ''] ?? '#6B5A4D';
  const coverGradient = COVER_GRADIENT[person.status ?? ''] ?? COVER_GRADIENT.expat;
  const flag = FLAG_MAP[person.nationality ?? ''] ?? '🌍';

  const isConnected = connStatus === 'accepted';
  const showSocial = isConnected && person.social_links.length > 0;
  const mutual = person.mutual_count ?? 0;
  const stay = formatStay(person.status, person.stay_arrived, person.stay_departed);
  const stayColor = stay?.emphasis === 'upcoming' ? '#E84F3D'
    : stay?.emphasis === 'past' ? 'rgba(45, 24, 16, .45)'
    : 'rgba(45, 24, 16, .72)';

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
        background: '#FFFFFF',
        border: '1px solid rgba(45, 24, 16, .1)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 4px 18px rgba(45, 24, 16, .08), 0 1px 3px rgba(45, 24, 16, .04)',
        transition: 'border-color .2s, transform .2s, box-shadow .2s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255, 107, 91, .35)';
        e.currentTarget.style.boxShadow = '0 16px 38px rgba(45, 24, 16, .12), 0 2px 6px rgba(45, 24, 16, .06)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(45, 24, 16, .1)';
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(45, 24, 16, .08), 0 1px 3px rgba(45, 24, 16, .04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Cover banner + round avatar (clickable → /people/[id]) */}
      <Link
        href={lockedHref ?? `/people/${person.id}`}
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
          {!visuallyAuthed && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255, 255, 255, .28)',
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
            border: '3px solid #FFFFFF',
            background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(45, 24, 16, .08)',
          }}>
            {person.profile_image ? (
              <img
                src={person.profile_image}
                alt={person.name}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: visuallyAuthed ? 'none' : 'blur(14px)',
                }}
              />
            ) : (
              <span style={{
                fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,.95)',
                filter: visuallyAuthed ? 'none' : 'blur(6px)',
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
          href={lockedHref ?? `/people/${person.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 16 }}>{flag}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#2D1810' }}>
              {person.name}
            </span>
          </div>
        </Link>

        {/* Status · Location · Stay 한 줄 통합 (flex wrap으로 좁은 카드에선 자연스럽게 내려감) */}
        {(statusMeta || person.location || (visuallyAuthed && stay)) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flexWrap: 'wrap', justifyContent: 'center',
            marginBottom: 10,
          }}>
            {statusMeta && (
              <span style={{
                padding: '3px 10px', borderRadius: 999,
                fontSize: 11, fontWeight: 700,
                background: `${statusColor}1A`, color: statusColor,
              }}>
                {statusMeta.label}
              </span>
            )}
            {person.location && (
              <span style={{
                fontSize: 11, color: 'rgba(45, 24, 16, .72)', fontWeight: 700,
              }}>
                📍 {person.location}{person.location_district ? ` · ${person.location_district}` : ''}
              </span>
            )}
            {visuallyAuthed && stay && (
              <span style={{
                fontSize: 11, fontWeight: stay.emphasis === 'upcoming' ? 800 : 700,
                color: stayColor,
              }}>
                🗓️ {stay.primary}
              </span>
            )}
          </div>
        )}

        {/* School badge — Student 네트워크 트리거 */}
        {visuallyAuthed && person.school && person.status === 'exchange_student' && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            color: '#D97706', marginBottom: 8,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            🎓 {person.school}
          </p>
        )}

        {/* Bio */}
        {visuallyAuthed ? (
          person.bio && (
            <p style={{
              fontSize: 13, color: 'rgba(45, 24, 16, .78)', lineHeight: 1.5,
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
            fontSize: 12, color: 'rgba(45, 24, 16, .62)',
            fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5,
          }}>
            Sign up to see bio
          </p>
        )}

        {/* 모티브 1개만 노출 — 우선순위: 첫 preset > custom. +N 없음. */}
        {visuallyAuthed && (() => {
          const firstPreset = (person.looking_for ?? [])
            .map(id => LOOKING_FOR_OPTIONS.find(o => o.id === id))
            .find((o): o is typeof LOOKING_FOR_OPTIONS[number] => !!o);
          const customText = person.looking_for_custom?.trim();
          const item = firstPreset
            ? { kind: 'preset' as const, emoji: firstPreset.emoji, label: firstPreset.label }
            : customText
              ? { kind: 'custom' as const, emoji: '✨', label: customText }
              : null;
          if (!item) return null;
          return (
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 10,
            }}>
              <span style={{
                padding: '3px 9px', borderRadius: 999,
                fontSize: 10, fontWeight: 700,
                background: 'rgba(255, 107, 91, .11)',
                border: item.kind === 'custom'
                  ? '1px dashed rgba(255, 107, 91, .45)'
                  : '1px solid rgba(255, 107, 91, .3)',
                color: '#3D2416',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: 11 }}>{item.emoji}</span>
                {item.label}
              </span>
            </div>
          );
        })()}

        {/* Mutual count */}
        {authed && mutual > 0 && (
          <p style={{
            fontSize: 11, fontWeight: 700,
            color: '#6C5CE7', marginBottom: 10,
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
              padding: '12px 0', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              color: '#00957A',
              background: 'rgba(0, 184, 148, .08)',
              border: '1px solid rgba(0, 184, 148, .32)',
            }}>
              ✓ Connected
            </div>
          ) : connStatus === 'pending' ? (
            <div style={{
              padding: '12px 0', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              color: '#C68600',
              background: 'rgba(255, 193, 7, .1)',
              border: '1px solid rgba(255, 193, 7, .4)',
            }}>
              Pending
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={busy}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 999,
                fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
                cursor: busy ? 'wait' : 'pointer',
                background: 'transparent',
                border: '1.5px solid rgba(255, 107, 91, .55)',
                color: '#FF6B5B',
                transition: 'all .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B5B, #E84393)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#FF6B5B';
                e.currentTarget.style.borderColor = 'rgba(255, 107, 91, .55)';
              }}
            >
              {busy ? '...' : '+ Connect'}
            </button>
          )
        ) : (
          <Link
            href={lockedHref ?? (needsOnboarding ? '/onboarding' : '/join')}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              padding: '12px 0', textAlign: 'center', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(255, 107, 91, .25)',
            }}>
              {lockedHref
                ? 'Connect after approval →'
                : needsOnboarding ? 'Complete profile →' : 'Sign up to connect →'}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
