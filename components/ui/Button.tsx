'use client';

import React from 'react';

type Variant = 'primary' | 'ghost' | 'outline' | 'glass' | 'accent';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: Variant;
  full?: boolean;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: '#ffffff',
    color: '#1a1033',
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 700,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'all .2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'inherit',
  },
  ghost: {
    background: 'transparent',
    color: 'rgba(255,255,255,.7)',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  outline: {
    background: 'transparent',
    color: '#ffffff',
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 700,
    border: '1.5px solid rgba(255,255,255,.2)',
    borderRadius: 999,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'inherit',
  },
  glass: {
    background: 'rgba(255,255,255,.08)',
    color: '#ffffff',
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 700,
    border: '1.5px solid rgba(255,255,255,.12)',
    borderRadius: 999,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'inherit',
    backdropFilter: 'blur(10px)',
  },
  accent: {
    background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
    color: '#ffffff',
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 800,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'inherit',
    boxShadow: '0 8px 24px rgba(255, 107, 91, .3), 0 2px 6px rgba(232, 67, 147, .18)',
  },
};

export function Button({
  children,
  variant = 'primary',
  full = false,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        ...styles[variant],
        ...(full ? { width: '100%' } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
