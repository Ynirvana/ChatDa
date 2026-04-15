'use client';

import { useState } from 'react';

export function CopyEventLink({ eventId, title }: { eventId: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/meetups/${eventId}`;
    try {
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await navigator.share({ title: title ?? 'Meetup on ChatDa', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* user cancelled native share — ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Share event link"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 999, flexShrink: 0,
        background: copied ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.08)',
        border: `1px solid ${copied ? 'rgba(74,222,128,.5)' : 'rgba(255,255,255,.15)'}`,
        fontSize: 11, fontWeight: 700, cursor: 'pointer',
        color: copied ? '#4ade80' : 'rgba(255,255,255,.7)',
        fontFamily: 'inherit',
      }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
