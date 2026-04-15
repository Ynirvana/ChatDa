'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
  clickable?: boolean;
  className?: string;
}

export function Card({ children, style = {}, onClick, hover = true, clickable = false, className }: CardProps) {
  const interactive = Boolean(onClick || clickable);

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover && interactive) {
      e.currentTarget.style.background = 'rgba(255,255,255,.14)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.35)';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 107, 53, 0.12)';
    }
  };
  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover && interactive) {
      e.currentTarget.style.background = 'rgba(255,255,255,.08)';
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
      e.currentTarget.style.boxShadow = '';
    }
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'rgba(255,255,255,.08)',
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 16,
        padding: 20,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'all .25s',
        backdropFilter: 'blur(10px)',
        ...style,
      }}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {children}
    </div>
  );
}

/* Ambient glow orb — decorative background element */
interface OrbProps {
  size: number;
  color: string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  delay?: number;
}

export function Orb({ size, color, top, left, right, bottom, delay = 0 }: OrbProps) {
  return (
    <div
      className="animate-glow"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        top,
        left,
        right,
        bottom,
        animationDelay: `${delay}s`,
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }}
    />
  );
}
