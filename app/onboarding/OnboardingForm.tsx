'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LOCATIONS, PLATFORMS, SEOUL_DISTRICTS, USER_STATUSES, SELECTABLE_USER_STATUSES, GENDER_OPTIONS, AGE_MIN, AGE_MAX } from '@/lib/constants';
import { Orb } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { NationalityCombobox } from '@/components/NationalityCombobox';
import { SchoolCombobox } from '@/components/SchoolCombobox';
import { FilterSelect, type FilterOption } from '@/components/FilterSelect';
import { track } from '@/lib/analytics';

type InitialData = {
  name: string;
  nationality: string;
  location: string;
  locationDistrict: string;
  status: string;
  school: string;
  gender: string;       // '' | 'male' | 'female' | 'other'
  age: string;          // input에서 string 관리 후 제출 시 int로 변환
  lookingFor: string[];
  lookingForCustom: string;
  bio: string;
  profileImage: string;
  profileImages?: string[];
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
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const MAX_PHOTOS = 5;
  const [profileImages, setProfileImages] = useState<string[]>(() => {
    if (initial?.profileImages && initial.profileImages.length > 0) return initial.profileImages.slice(0, MAX_PHOTOS);
    if (initial?.profileImage) return [initial.profileImage];
    if (googleImage) return [googleImage];
    return [];
  });
  const primaryImage = profileImages[0] ?? '';
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    nationality: initial?.nationality ?? '',
    location: initial?.location ?? '',
    locationDistrict: initial?.locationDistrict ?? '',
    status: initial?.status ?? '',
    school: initial?.school ?? '',
    gender: initial?.gender ?? '',
    age: initial?.age ?? '',
    lookingFor: (initial?.lookingFor ?? []) as string[],
    lookingForCustom: initial?.lookingForCustom ?? '',
    bio: initial?.bio ?? '',
    socialLinks: initial?.socialLinks ?? ({} as Record<string, string>),
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(
    Object.values(initial?.socialLinks ?? {}).some(Boolean),
  );

  const set = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));
  // Korean이면 status='local' 자동 박기 + 다른 국적으로 바꾸면 status 리셋해서 다시 고르게.
  const setNationality = (v: string) => setForm(p => {
    if (v === 'Korean') return { ...p, nationality: v, status: 'local' };
    if (p.nationality === 'Korean' && v !== 'Korean') return { ...p, nationality: v, status: '' };
    return { ...p, nationality: v };
  });
  const setLink = (platform: string, url: string) =>
    setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, [platform]: url } }));

  // Bio + motives는 Step 2 (Profile 페이지)로 이동 — Step 1에서 필수 아님
  // Student 선택 시 school은 필수 (네트워크 효과 트리거)
  const schoolRequired = form.status === 'exchange_student';
  const schoolOk = !schoolRequired || form.school.trim().length > 0;
  // Age는 옵션이지만 입력했으면 범위 검증
  const ageNum = form.age ? parseInt(form.age, 10) : NaN;
  const ageOk = !form.age || (Number.isInteger(ageNum) && ageNum >= AGE_MIN && ageNum <= AGE_MAX);
  const canSubmit =
    profileImages.length >= 1 &&   // Photo 필수 — 1장 이상
    form.name.trim() &&
    form.nationality &&
    form.location &&
    form.status &&
    form.gender &&                  // required
    ageOk &&
    schoolOk &&
    !loading;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = (ev.target?.result as string) ?? '';
      if (!data) return;
      setProfileImages(prev => (prev.length >= MAX_PHOTOS ? prev : [...prev, data]));
    };
    reader.readAsDataURL(file);
    // 같은 파일 재선택 가능하게 input value clear
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setProfileImages(prev => prev.filter((_, i) => i !== idx));
  };

  const makePrimary = (idx: number) => {
    if (idx === 0) return;
    setProfileImages(prev => {
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      return [picked, ...next];
    });
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
        age: form.age ? parseInt(form.age, 10) : null,
        locationDistrict: form.location === 'Seoul' ? (form.locationDistrict || null) : null,
        // Student일 때만 school 저장, 그 외엔 null
        school: form.status === 'exchange_student' ? (form.school.trim() || null) : null,
        // Bio + motives는 Profile page에서 채움 — onboarding 시엔 기존 값 그대로 전송 (신규 유저는 빈 값)
        lookingForCustom: form.lookingForCustom.trim() || null,
        profileImage: primaryImage || null,
        profileImages,
        socialLinks: links,
      }),
    });

    if (res.ok) {
      track('onboarding_complete', {
        returning: isReturning,
        status: form.status,
        has_photo: profileImages.length > 0,
        photo_count: profileImages.length,
        has_school: !!form.school.trim(),
        social_count: links.length,
      });
      // JWT refresh — approval_status / onboarding_complete 가 middleware에 반영되도록
      await updateSession();
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

          {/* Profile photos — 최대 5장, 첫 장 = primary */}
          <div>
            <label style={labelStyle}>
              Profile photos <span style={{ color: '#E84F3D' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {profileImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => makePrimary(idx)}
                  style={{
                    position: 'relative',
                    width: 78, height: 78, borderRadius: 16,
                    overflow: 'hidden', flexShrink: 0,
                    border: idx === 0 ? '3px solid #FF6B5B' : '2px solid rgba(45, 24, 16, .12)',
                    cursor: idx === 0 ? 'default' : 'pointer',
                    boxShadow: idx === 0 ? '0 4px 14px rgba(255, 107, 91, .25)' : '0 1px 4px rgba(45, 24, 16, .06)',
                    transition: 'transform .12s ease',
                  }}
                  title={idx === 0 ? 'Main avatar (shown on cards)' : 'Tap to make main'}
                >
                  <img
                    src={img}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {idx === 0 && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(180deg, transparent, rgba(255, 107, 91, .92))',
                      padding: '10px 4px 3px',
                      color: '#fff',
                      fontSize: 9, fontWeight: 900, letterSpacing: '.14em',
                      textAlign: 'center',
                      pointerEvents: 'none',
                    }}>
                      MAIN
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                    aria-label="Remove photo"
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(45, 24, 16, .78)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, lineHeight: 1, padding: 0,
                      fontFamily: 'inherit',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {profileImages.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 78, height: 78, borderRadius: 16, flexShrink: 0,
                    background: 'rgba(255, 107, 91, .08)',
                    border: '2px dashed rgba(255, 107, 91, .5)',
                    color: '#E84F3D',
                    fontSize: 28, fontWeight: 900, lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'inherit',
                  }}
                >
                  +
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'rgba(45, 24, 16, .5)', marginTop: 10, lineHeight: 1.45 }}>
              {profileImages.length === 0
                ? '1 required. Up to 5 photos. First photo shows on your card.'
                : profileImages.length === 1
                  ? `Add more (up to ${MAX_PHOTOS - profileImages.length} more). Tap × to remove.`
                  : `Tap a photo to make it MAIN. ${profileImages.length}/${MAX_PHOTOS} photos.`}
            </p>
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

          {/* Gender + Age row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Gender *</label>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6,
              }}>
                {GENDER_OPTIONS.map(g => {
                  const active = form.gender === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => set('gender', g.id)}
                      style={{
                        padding: '12px 8px', borderRadius: 12,
                        fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                        cursor: 'pointer',
                        background: active
                          ? 'linear-gradient(135deg, rgba(255,107,91,.16), rgba(232,67,147,.12))'
                          : '#FFFFFF',
                        border: `1.5px solid ${active ? '#FF6B5B' : 'rgba(45, 24, 16, .15)'}`,
                        color: active ? '#2D1810' : '#3D2416',
                        boxShadow: active ? '0 2px 8px rgba(255, 107, 91, .18)' : '0 1px 3px rgba(45, 24, 16, .04)',
                        transition: 'all .15s',
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                Age{' '}
                <span style={{ color: 'rgba(45, 24, 16, .45)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                  optional
                </span>
              </label>
              <input
                className="input-light"
                type="number"
                min={AGE_MIN}
                max={AGE_MAX}
                inputMode="numeric"
                style={{ ...inputStyle, fontSize: 15 }}
                value={form.age}
                onChange={e => {
                  // 숫자 외 차단 + 범위 clamp는 submit 시 처리
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                  setForm(p => ({ ...p, age: v }));
                }}
                placeholder="24"
              />
            </div>
          </div>

          {/* Nationality */}
          <div>
            <label style={labelStyle}>Nationality *</label>
            <NationalityCombobox
              value={form.nationality}
              onChange={setNationality}
            />
            {form.nationality === 'Korean' && (
              <p style={{
                fontSize: 12, color: 'rgba(45, 24, 16, .6)',
                marginTop: 8, fontWeight: 600,
              }}>
                🇰🇷 You&apos;re set as <b>Local</b> automatically.
              </p>
            )}
          </div>

          {/* Status — Korean이면 자동 local 이라 숨김 (Nationality 바로 아래) */}
          {form.nationality !== 'Korean' && (
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
                {SELECTABLE_USER_STATUSES.map((s, i) => {
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
          )}

          {/* School — Student일 때만 필수 노출 */}
          {form.status === 'exchange_student' && (
            <div>
              <label style={labelStyle}>School / University *</label>
              <p style={{
                fontSize: 12, color: 'rgba(45, 24, 16, .55)',
                marginTop: -2, marginBottom: 8, lineHeight: 1.5,
              }}>
                🎓 Helps you connect with others at the same school.
              </p>
              <SchoolCombobox
                value={form.school}
                onChange={v => set('school', v)}
                placeholder="e.g. Yonsei University, SKKU, or type your own"
              />
            </div>
          )}

          {/* Location */}
          <div>
            <label style={labelStyle}>
              Location in Korea{' '}
              <span style={{ color: 'rgba(45, 24, 16, .45)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                (current or planned)
              </span>{' '}
              *
            </label>
            <FilterSelect
              value={form.location}
              onChange={v => {
                setForm(p => ({
                  ...p,
                  location: v,
                  // 광역 바뀌면 district 리셋 (Seoul이 아닌 곳 선택 시 district 의미 없음)
                  locationDistrict: v === 'Seoul' ? p.locationDistrict : '',
                }));
              }}
              options={[
                { value: '', label: 'Select location' },
                ...LOCATIONS.map(l => ({ value: l, label: l } satisfies FilterOption)),
              ]}
              placeholder="Select location"
            />
            {form.location === 'Seoul' && (
              <div style={{ marginTop: 10 }}>
                <p style={{
                  fontSize: 12, fontWeight: 700,
                  color: 'rgba(45, 24, 16, .55)',
                  marginBottom: 6,
                }}>
                  District <span style={{ fontWeight: 500, opacity: .7 }}>(optional)</span>
                </p>
                <FilterSelect
                  value={form.locationDistrict}
                  onChange={v => set('locationDistrict', v)}
                  options={[
                    { value: '', label: 'Any district in Seoul' },
                    ...SEOUL_DISTRICTS.map(d => ({ value: d, label: d } satisfies FilterOption)),
                  ]}
                  placeholder="Any district in Seoul"
                />
              </div>
            )}
          </div>

          {/* Bio + "What brings you here?" moved to Profile page (Step 2) */}

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

          {/* Quality / suspension notice — 신규 가입 때만 (기존 유저 편집은 skip) */}
          {!isReturning && (
            <div style={{
              marginTop: 8, marginBottom: 8,
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255, 196, 140, .15)',
              border: '1px solid rgba(255, 140, 120, .28)',
            }}>
              <p style={{
                fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
                color: '#D97706', textTransform: 'uppercase', marginBottom: 6,
              }}>
                Quick note
              </p>
              <p style={{
                fontSize: 13, lineHeight: 1.55,
                color: 'rgba(45, 24, 16, .75)',
              }}>
                We&apos;re keeping quality high while we&apos;re small. Profiles that look incomplete or spammy may be suspended — please take your profile seriously.
              </p>
            </div>
          )}

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
