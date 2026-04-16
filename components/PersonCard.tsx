'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { USER_STATUSES } from '@/lib/constants';

const STATUS_COLORS: Record<string, string> = {
  tourist: '#A29BFE',
  student: '#74B9FF',
  expat: '#FF6B35',
  local_korean: '#00B894',
  local_student: '#00B894',
  korean_worker: '#00B894',
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
  status: string | null;
  bio: string | null;
  profile_image: string | null;
  social_links: { platform: string; url: string }[];
  tags?: PersonTag[];
  connection?: PersonConnection | null;
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
  const flag = FLAG_MAP[person.nationality ?? ''] ?? '🌍';

  const canDo = person.tags?.filter(t => t.category === 'can_do') ?? [];
  const lookingFor = person.tags?.filter(t => t.category === 'looking_for') ?? [];
  const isConnected = connStatus === 'accepted';
  const showSocial = isConnected && person.social_links.length > 0;

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
    <div style={{
      background: 'rgba(255,255,255,.06)',
      border: '1px solid rgba(255,255,255,.1)',
      borderRadius: 18,
      overflow: 'hidden',
      transition: 'border-color .2s, transform .2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      {/* Photo — links to profile detail */}
      <Link href={`/people/${person.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        background: 'linear-gradient(135deg, rgba(255,107,53,.15), rgba(232,67,147,.15))',
        overflow: 'hidden',
      }}>
        {person.profile_image ? (
          <img
            src={person.profile_image}
            alt={person.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: authed ? 'none' : 'blur(16px)',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FF6B35, #E84393)',
            fontSize: 48,
            fontWeight: 900,
            color: 'rgba(255,255,255,.7)',
            filter: authed ? 'none' : 'blur(8px)',
          }}>
            {person.name[0]?.toUpperCase()}
          </div>
        )}

        {!authed && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(26,16,51,.3)',
          }}>
            <span style={{ fontSize: 28 }}>🔒</span>
          </div>
        )}
      </div>

      {/* Name + flag — part of link */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>{flag}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{person.name}</span>
        </div>
      </div>
      </Link>

      {/* Info — interactive zone (not inside Link) */}
      <div style={{ padding: '0 16px 16px' }}>
        {/* Status badge */}
        {statusMeta && (
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: `${statusColor}22`,
            color: statusColor,
            marginBottom: 8,
          }}>
            {statusMeta.label}
          </span>
        )}

        {/* Tags */}
        {(canDo.length > 0 || lookingFor.length > 0) && authed && (
          <div style={{ marginBottom: 8 }}>
            {canDo.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                {canDo.slice(0, 3).map(t => (
                  <span key={t.tag} style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                    background: 'rgba(0,184,148,.15)', color: '#00B894',
                  }}>
                    {t.tag}
                  </span>
                ))}
              </div>
            )}
            {lookingFor.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {lookingFor.slice(0, 3).map(t => (
                  <span key={t.tag} style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                    background: 'rgba(116,185,255,.15)', color: '#74B9FF',
                  }}>
                    {t.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {authed ? (
          person.bio && (
            <p style={{
              fontSize: 13,
              color: 'rgba(255,255,255,.6)',
              lineHeight: 1.4,
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
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', fontStyle: 'italic', marginBottom: 10 }}>
            Sign up to see bio
          </p>
        )}

        {/* Social links (connected only) or Connect button */}
        {authed ? (
          <>
            {showSocial && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {person.social_links.map(sl => (
                  <a
                    key={sl.platform}
                    href={sl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ opacity: 0.8, transition: 'opacity .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; }}
                  >
                    <PlatformIcon platform={sl.platform} size={24} />
                  </a>
                ))}
              </div>
            )}

            {/* Connect / status */}
            {connStatus === 'accepted' ? (
              <div style={{
                padding: '7px 0', textAlign: 'center', borderRadius: 999,
                fontSize: 12, fontWeight: 700, color: '#00B894',
                background: 'rgba(0,184,148,.1)',
                border: '1px solid rgba(0,184,148,.2)',
              }}>
                Connected
              </div>
            ) : connStatus === 'pending' ? (
              <div style={{
                padding: '7px 0', textAlign: 'center', borderRadius: 999,
                fontSize: 12, fontWeight: 700, color: '#FFC107',
                background: 'rgba(255,193,7,.1)',
                border: '1px solid rgba(255,193,7,.2)',
              }}>
                Pending
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={busy}
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 999, border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                  color: '#fff',
                }}
              >
                {busy ? '...' : 'Connect'}
              </button>
            )}
          </>
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
