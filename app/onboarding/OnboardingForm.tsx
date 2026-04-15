'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NATIONALITIES, PLATFORMS, USER_STATUSES } from '@/lib/constants';
import { Orb } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlatformIcon } from '@/components/ui/PlatformIcon';

type InitialData = {
  name: string;
  nationality: string;
  status: string;
  bio: string;
  profileImage: string;
  socialLinks: Record<string, string>;
};

export default function OnboardingForm({
  isReturning,
  initial,
  googleImage = '',
}: {
  isReturning: boolean;
  initial?: InitialData;
  googleImage?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(
    initial?.profileImage ?? googleImage ?? ''
  );
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    nationality: initial?.nationality ?? '',
    status: initial?.status ?? '',
    bio: initial?.bio ?? '',
    socialLinks: initial?.socialLinks ?? ({} as Record<string, string>),
  });
  const [statusOpen, setStatusOpen] = useState(false);

  const set = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));
  const setLink = (platform: string, url: string) =>
    setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, [platform]: url } }));

  const filledLinks = Object.values(form.socialLinks).filter(Boolean).length;
  const canSubmit = form.name.trim() && form.nationality && form.status && filledLinks >= 1 && !loading;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfileImage((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const links = Object.entries(form.socialLinks)
      .filter(([, url]) => url.trim())
      .map(([platform, url]) => ({ platform, url: url.trim() }));

    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        profileImage: profileImage || null,
        socialLinks: links,
      }),
    });

    if (res.ok) {
      router.push('/meetups');
    } else {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,.08)',
    border: '1.5px solid rgba(255,255,255,.12)',
    borderRadius: 12,
    color: '#ffffff',
    padding: '14px 18px',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,.5)',
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: 1,
  };

  return (
    <div className="page-bg" style={{ minHeight: '100vh', padding: '60px 0 80px' }}>
      <Orb size={400} color="rgba(108,92,231,.25)" top={-50} left={-100} />
      <Orb size={300} color="rgba(232,67,147,.2)" bottom={100} right={-80} delay={2} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>
            {isReturning ? 'Edit your profile' : 'Set up your profile'}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>
            Your profile is visible to other members before meetups — make it real.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Profile photo */}
          <div>
            <label style={labelStyle}>Profile photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar preview */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                  overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  border: '2px solid rgba(255,255,255,.15)',
                }}
              >
                {profileImage ? (
                  <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 900, color: '#fff',
                  }}>
                    {form.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity .15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '9px 18px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                    background: 'rgba(255,255,255,.08)',
                    border: '1.5px solid rgba(255,255,255,.15)',
                    color: 'rgba(255,255,255,.7)',
                    display: 'block', marginBottom: 6,
                  }}
                >
                  Upload photo
                </button>
                {profileImage && googleImage && profileImage !== googleImage && (
                  <button
                    type="button"
                    onClick={() => setProfileImage(googleImage)}
                    style={{
                      padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                      background: 'transparent', border: 'none',
                      color: 'rgba(255,255,255,.35)',
                    }}
                  >
                    Reset to Google photo
                  </button>
                )}
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>
                  JPG, PNG, WebP — shown to other members
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Display name *</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Nationality */}
          <div>
            <label style={labelStyle}>Nationality *</label>
            <select
              style={{ ...inputStyle, appearance: 'none' }}
              value={form.nationality}
              onChange={e => set('nationality', e.target.value)}
            >
              <option value="">Select nationality</option>
              {NATIONALITIES.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>I am a... *</label>
            <button
              type="button"
              onClick={() => setStatusOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                background: 'rgba(255,255,255,.08)',
                border: `1.5px solid ${form.status ? '#FF6B35' : 'rgba(255,255,255,.12)'}`,
                color: form.status ? '#fff' : 'rgba(255,255,255,.35)',
                fontSize: 15, textAlign: 'left',
              }}
            >
              <span>
                {form.status
                  ? USER_STATUSES.find(s => s.id === form.status)?.label
                  : 'Select your status'}
              </span>
              <span style={{
                fontSize: 12, color: 'rgba(255,255,255,.4)',
                transform: statusOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform .2s',
                display: 'inline-block',
              }}>▼</span>
            </button>

            {statusOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                background: '#2d1b4e', border: '1.5px solid rgba(255,255,255,.15)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,.4)',
              }}>
                {USER_STATUSES.map((s, i) => {
                  const selected = form.status === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { set('status', s.id); setStatusOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '13px 16px', cursor: 'pointer', fontFamily: 'inherit',
                        background: selected ? 'rgba(255,107,53,.12)' : 'transparent',
                        border: 'none',
                        borderTop: i > 0 ? '1px solid rgba(255,255,255,.07)' : 'none',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${selected ? '#FF6B35' : 'rgba(255,255,255,.25)'}`,
                        background: selected ? '#FF6B35' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#FF6B35' : '#fff' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>
                          {s.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label style={labelStyle}>
              One-liner bio{' '}
              <span style={{ color: 'rgba(255,255,255,.25)', fontWeight: 400 }}>
                ({form.bio.length}/100) optional
              </span>
            </label>
            <input
              style={inputStyle}
              value={form.bio}
              onChange={e => set('bio', e.target.value.slice(0, 100))}
              placeholder="ex.) French founder living in Seoul"
            />
          </div>

          {/* Social links */}
          <div>
            <label style={labelStyle}>
              Social media *{' '}
              <span style={{ color: 'rgba(255,255,255,.25)', fontWeight: 400 }}>at least 1</span>
            </label>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 20, lineHeight: 1.5 }}>
              Shown to other members so they know who's coming.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {PLATFORMS.map(p => (
                <div key={p.id}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                    {p.label}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none', zIndex: 1,
                    }}>
                      <PlatformIcon platform={p.id} size={26} />
                    </div>
                    <div style={{
                      position: 'absolute', left: 52, top: 8, bottom: 8,
                      width: 1, background: 'rgba(255,255,255,.12)', pointerEvents: 'none', zIndex: 1,
                    }} />
                    <input
                      style={{ ...inputStyle, paddingLeft: 62, paddingTop: 12, paddingBottom: 12 }}
                      value={form.socialLinks[p.id] || ''}
                      onChange={e => setLink(p.id, e.target.value)}
                      placeholder=""
                    />
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', marginTop: 6 }}>
                    {p.placeholder}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            variant="accent"
            full
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ marginTop: 8, fontSize: 16, padding: '16px 28px', opacity: canSubmit ? 1 : 0.4 }}
          >
            {loading ? 'Saving...' : isReturning ? 'Save changes →' : 'Finish setup →'}
          </Button>

          {isReturning && (
            <button
              type="button"
              onClick={() => router.push('/meetups')}
              style={{
                width: '100%', padding: '14px', borderRadius: 999,
                background: 'transparent', border: '1.5px solid rgba(255,255,255,.15)',
                color: 'rgba(255,255,255,.4)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Done
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
