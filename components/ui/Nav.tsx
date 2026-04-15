'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from './Button';

interface NavUser {
  name?: string | null;
  image?: string | null;
}

export function Nav({ user, isAdmin = false }: { user?: NavUser | null; isAdmin?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(26,16,51,.75)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,.1)',
      padding: '0 20px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: 22, fontWeight: 900, letterSpacing: -1,
          background: 'linear-gradient(135deg, #FF6B35, #E84393)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>ChatDa</span>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>

        {[
          { href: '/meetups', label: 'Meetups' },
          { href: '/feed', label: 'Feed' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <Button variant="ghost" style={{
              color: pathname?.startsWith(href) ? '#ffffff' : 'rgba(255,255,255,.5)',
              fontWeight: pathname?.startsWith(href) ? 700 : 500,
            }}>
              {label}
            </Button>
          </Link>
        ))}

        {/* Avatar / Join */}
        {user ? (
          <div ref={menuRef} style={{ position: 'relative', marginLeft: 8 }}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? ''}
                  style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, border: '2px solid rgba(255,255,255,.2)',
                }}>
                  {user.name?.[0] ?? '?'}
                </div>
              )}
            </button>

            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 160,
                  background: 'rgba(26,16,51,.95)', backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,.1)', borderRadius: 14,
                  padding: 6, boxShadow: '0 10px 30px rgba(0,0,0,.35)',
                  zIndex: 200,
                }}
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block', padding: '10px 14px', borderRadius: 10,
                    color: 'rgba(255,255,255,.85)', fontSize: 14, fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block', padding: '10px 14px', borderRadius: 10,
                      color: 'rgba(116,185,255,.95)', fontSize: 14, fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,107,53,.95)', fontSize: 14, fontWeight: 700,
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" style={{ marginLeft: 8, textDecoration: 'none' }}>
            <Button variant="primary" style={{ padding: '10px 22px', fontSize: 14 }}>
              Join
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
