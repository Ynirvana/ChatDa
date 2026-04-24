'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';

export function ShareLinkCard({ userId, userName }: { userId: string; userName: string }) {
  const [copied, setCopied] = useState(false);
  const appUrl = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL)
    || 'https://chatda.life';
  const shareUrl = `${appUrl}/?ref=${encodeURIComponent(userId)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      track('share_link_copy', { ref_id: userId });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input
      const el = document.getElementById('share-link-input') as HTMLInputElement | null;
      el?.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaNative = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      copy();
      return;
    }
    try {
      await navigator.share({
        title: 'ChatDa — Korea\'s international community',
        text: `${userName} invited you to ChatDa — see who's here in Korea.`,
        url: shareUrl,
      });
      track('share_link_native', { ref_id: userId });
    } catch {
      // user cancelled — no-op
    }
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: 'rgba(45, 24, 16, .62)', lineHeight: 1.55, marginBottom: 12 }}>
        Know someone who&apos;d fit in here? Send them this link — they&apos;ll be able to request an invite.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <input
          id="share-link-input"
          type="text"
          value={shareUrl}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          style={{
            flex: '1 1 220px',
            minWidth: 220,
            padding: '12px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: 'ui-monospace, monospace',
            background: 'rgba(255, 244, 227, .6)',
            border: '1.5px solid rgba(45, 24, 16, .14)',
            color: '#3D2416',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        />
        <button
          type="button"
          onClick={copy}
          style={{
            padding: '12px 22px', borderRadius: 999,
            fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
            background: copied
              ? 'linear-gradient(135deg, #00B894, #00957A)'
              : 'linear-gradient(135deg, #FF6B5B, #E84393)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255, 107, 91, .28), inset 0 1px 0 rgba(255,255,255,.2)',
            whiteSpace: 'nowrap',
            transition: 'background .2s',
          }}
        >
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={shareViaNative}
          title="Share via system dialog"
          style={{
            padding: '12px 16px', borderRadius: 999,
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            background: '#FFFFFF',
            border: '1.5px solid rgba(45, 24, 16, .15)',
            color: '#3D2416',
            cursor: 'pointer',
          }}
        >
          ↗ Share
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(45, 24, 16, .45)', marginTop: 10 }}>
        We&apos;ll let you know how many people visited via your link.
      </p>
    </div>
  );
}
