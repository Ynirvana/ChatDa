'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LOCATIONS, PLATFORMS, USER_STATUSES } from '@/lib/constants';
import { Orb } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { NationalityCombobox } from '@/components/NationalityCombobox';
import { LookingForPicker } from '@/components/LookingForPicker';
import { track } from '@/lib/analytics';

type InitialData = {
  name: string;
  nationality: string;
  location: string;
  status: string;
  lookingFor: string[];
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
    location: initial?.location ?? '',
    status: initial?.status ?? '',
    lookingFor: (initial?.lookingFor ?? []) as string[],
    bio: initial?.bio ?? '',
    socialLinks: initial?.socialLinks ?? ({} as Record<string, string>),
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(
    Object.values(initial?.socialLinks ?? {}).some(Boolean),
  );

  const set = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));
  const setLookingFor = (next: string[]) => setForm(p => ({ ...p, lookingFor: next }));
  const setLink = (platform: string, url: string) =>
    setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, [platform]: url } }));

  const canSubmit =
    form.name.trim() &&
    form.nationality &&
    form.location &&
    form.status &&
    form.lookingFor.length >= 1 &&
    !loading;

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
      track('onboarding_complete', {
        returning: isReturning,
        status: form.status,
        looking_for_count: form.lookingFor.length,
        has_photo: !!profileImage,
        has_bio: !!form.bio.trim(),
        social_count: links.length,
      });
      router.push('/people');
    } else {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#FFFFFF',
    border: '1.5px solid rgba(45, 24, 16, .15)',
    borderRadius: 12,
    color: '#2D1810',
    padding: '14px 18px',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    boxShadow: '0 1px 4px rgba(45, 24, 16, .04)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: 'rgba(45, 24, 16, .6)',
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  };

  return (
    <div className="page-bg-light" style={{ minHeight: '100vh', padding: '60px 0 80px' }}>
      <Orb size={400} color="rgba(255, 140, 120, .18)" top={-50} left={-100} />
      <Orb size={300} color="rgba(232, 67, 147, .12)" bottom={100} right={-80} delay={2} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 8, color: '#2D1810' }}>
            {isReturning ? 'Edit your profile' : 'Set up your profile'}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(45, 24, 16, .6)', lineHeight: 1.5 }}>
            Your profile is how others find you in Korea. Make it real.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Profile photo */}
          <div>
            <label style={labelStyle}>Profile photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                  overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 4px 14px rgba(45, 24, 16, .1)',
                }}
              >
                {profileImage ? (
                  <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 900, color: '#fff',
                  }}>
                    {form.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(45, 24, 16, .4)',
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
                    padding: '10px 20px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(45, 24, 16, .15)',
                    color: '#3D2416',
                    display: 'block', marginBottom: 6,
                    boxShadow: '0 1px 3px rgba(45, 24, 16, .05)',
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
                      color: 'rgba(45, 24, 16, .5)',
                    }}
                  >
                    Reset to Google photo
                  </button>
                )}
                <p style={{ fontSize: 12, color: 'rgba(45, 24, 16, .45)', marginTop: 4 }}>
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
              className="input-light"
              style={inputStyle}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Nationality */}
          <div>
            <label style={labelStyle}>Nationality *</label>
            <NationalityCombobox
              value={form.nationality}
              onChange={v => set('nationality', v)}
            />
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Current location in Korea *</label>
            <select
              className="input-light"
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              value={form.location}
              onChange={e => set('location', e.target.value)}
            >
              <option value="">Select location</option>
              {LOCATIONS.map(l => (
                <option key={l} value={l}>{l}</option>
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
                background: '#FFFFFF',
                border: `1.5px solid ${form.status ? '#FF6B5B' : 'rgba(45, 24, 16, .15)'}`,
                color: form.status ? '#2D1810' : 'rgba(45, 24, 16, .45)',
                fontSize: 15, textAlign: 'left',
                boxShadow: '0 1px 4px rgba(45, 24, 16, .04)',
              }}
            >
              <span>
                {form.status
                  ? USER_STATUSES.find(s => s.id === form.status)?.label
                  : 'Select your status'}
              </span>
              <span style={{
                fontSize: 12, color: 'rgba(45, 24, 16, .5)',
                transform: statusOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform .2s',
                display: 'inline-block',
              }}>▼</span>
            </button>

            {statusOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                background: '#FFFFFF', border: '1.5px solid rgba(45, 24, 16, .12)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 12px 36px rgba(45, 24, 16, .14)',
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
                        background: selected ? 'rgba(255, 107, 91, .1)' : '#FFFFFF',
                        border: 'none',
                        borderTop: i > 0 ? '1px solid rgba(45, 24, 16, .06)' : 'none',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${selected ? '#FF6B5B' : 'rgba(45, 24, 16, .25)'}`,
                        background: selected ? '#FF6B5B' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: selected ? '#FF6B5B' : '#2D1810' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(45, 24, 16, .5)', marginTop: 1 }}>
                          {s.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* What brings you here? */}
          <div>
            <label style={labelStyle}>What brings you here? *</label>
            <p style={{
              fontSize: 13, color: 'rgba(45, 24, 16, .55)',
              marginBottom: 12, lineHeight: 1.5,
            }}>
              Pick up to 3. Helps others find you on the People tab.
            </p>
            <LookingForPicker
              value={form.lookingFor}
              onChange={setLookingFor}
            />
          </div>

          {/* Bio */}
          <div>
            <label style={labelStyle}>
              One-liner bio{' '}
              <span style={{ color: 'rgba(45, 24, 16, .35)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                ({form.bio.length}/100) optional
              </span>
            </label>
            <input
              className="input-light"
              style={inputStyle}
              value={form.bio}
              onChange={e => set('bio', e.target.value.slice(0, 100))}
              placeholder="ex.) French founder living in Seoul"
            />
          </div>

          {/* Social links — optional accordion */}
          <div>
            <button
              type="button"
              onClick={() => setSocialOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                background: 'rgba(255, 255, 255, .5)',
                border: '1.5px dashed rgba(45, 24, 16, .18)',
                color: '#3D2416', fontSize: 14, fontWeight: 700,
                textAlign: 'left',
              }}
            >
              <span>
                Add social links{' '}
                <span style={{ color: 'rgba(45, 24, 16, .45)', fontWeight: 500 }}>(optional)</span>
              </span>
              <span style={{
                fontSize: 12, color: 'rgba(45, 24, 16, .5)',
                transform: socialOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform .2s', display: 'inline-block',
              }}>▼</span>
            </button>

            {socialOpen && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 12, color: 'rgba(45, 24, 16, .55)', marginBottom: 16, lineHeight: 1.5 }}>
                  🔒 Only visible to members you accept as connections. Adding links helps others decide to connect with you.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {PLATFORMS.map(p => (
                    <div key={p.id}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#2D1810', marginBottom: 6 }}>
                        {p.label}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          pointerEvents: 'none', zIndex: 1,
                        }}>
                          <PlatformIcon platform={p.id} size={22} />
                        </div>
                        <div style={{
                          position: 'absolute', left: 48, top: 8, bottom: 8,
                          width: 1, background: 'rgba(45, 24, 16, .12)', pointerEvents: 'none', zIndex: 1,
                        }} />
                        <input
                          className="input-light"
                          style={{ ...inputStyle, paddingLeft: 58, paddingTop: 11, paddingBottom: 11, fontSize: 14 }}
                          value={form.socialLinks[p.id] || ''}
                          onChange={e => setLink(p.id, e.target.value)}
                          placeholder={p.placeholder}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            variant="accent"
            full
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              marginTop: 8, fontSize: 16, padding: '17px 28px',
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Saving...' : isReturning ? 'Save changes →' : 'Finish setup →'}
          </Button>

          {isReturning && (
            <button
              type="button"
              onClick={() => router.push('/people')}
              style={{
                width: '100%', padding: '14px', borderRadius: 999,
                background: 'transparent', border: '1.5px solid rgba(45, 24, 16, .18)',
                color: 'rgba(45, 24, 16, .55)', fontSize: 15, fontWeight: 700,
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
