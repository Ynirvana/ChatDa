'use client';

import Link from 'next/link';
import { useState } from 'react';

export function HostFab() {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href="/host" style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed', bottom: 32, right: 32,
          display: 'flex', alignItems: 'center',
          borderRadius: 999,
          background: 'linear-gradient(135deg, #FF6B35, #E84393)',
          boxShadow: '0 4px 24px rgba(232,67,147,.4)',
          cursor: 'pointer',
          zIndex: 200,
          overflow: 'hidden',
          height: 56,
          transition: 'width .2s ease, box-shadow .2s ease',
          width: hovered ? 172 : 56,
        }}
      >
        {/* Label */}
        <span style={{
          color: '#fff', fontWeight: 700, fontSize: 14,
          whiteSpace: 'nowrap',
          paddingLeft: 20,
          opacity: hovered ? 1 : 0,
          transition: 'opacity .15s ease',
          pointerEvents: 'none',
        }}>
          Host a Meetup
        </span>

        {/* + icon — always visible, anchored right */}
        <span style={{
          position: 'absolute', right: 0,
          width: 56, height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: '#fff', fontWeight: 300,
          flexShrink: 0,
        }}>
          +
        </span>
      </div>
    </Link>
  );
}
