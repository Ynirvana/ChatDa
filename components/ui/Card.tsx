'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
  clickable?: boolean;
  className?: string;
  light?: boolean;
}

export function Card({ children, style = {}, onClick, hover = true, clickable = false, className, light = false }: CardProps) {
  const interactive = Boolean(onClick || clickable);

  // Theme-aware resting/hover colors
  const bgRest = light ? '#FFFFFF' : 'rgba(255,255,255,.08)';
  const borderRest = light ? 'rgba(45, 24, 16, .1)' : 'rgba(255,255,255,.12)';
  const bgHover = light ? '#FFFFFF' : 'rgba(255,255,255,.14)';
  const borderHover = light ? 'rgba(255, 107, 91, .35)' : 'rgba(255, 107, 53, 0.35)';
  const shadowHover = light
    ? '0 16px 38px rgba(45, 24, 16, .12), 0 2px 6px rgba(45, 24, 16, .06)'
    : '0 12px 32px rgba(255, 107, 53, 0.12)';
  const shadowRest = light ? '0 4px 18px rgba(45, 24, 16, .07), 0 1px 3px rgba(45, 24, 16, .04)' : 'none';

  const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover && interactive) {
      e.currentTarget.style.background = bgHover;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.borderColor = borderHover;
      e.currentTarget.style.boxShadow = shadowHover;
    }
  };
  const handleMouseOut = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover && interactive) {
      e.currentTarget.style.background = bgRest;
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.borderColor = borderRest;
      e.currentTarget.style.boxShadow = shadowRest;
    }
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: bgRest,
        border: `1px solid ${borderRest}`,
        borderRadius: 16,
        padding: 20,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'all .25s',
        backdropFilter: light ? 'none' : 'blur(10px)',
        boxShadow: shadowRest,
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
