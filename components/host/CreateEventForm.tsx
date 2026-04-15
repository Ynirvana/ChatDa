'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const REQUIREMENTS = [
  { id: 'profile_photo', label: 'Profile photo', sub: 'Must have a profile photo set' },
  { id: 'instagram',     label: 'Instagram',     sub: 'Active Instagram account required' },
  { id: 'linkedin',      label: 'LinkedIn',       sub: 'Active LinkedIn account required' },
  { id: 'facebook',      label: 'Facebook',       sub: 'Active Facebook account required' },
  { id: 'x',             label: 'X (Twitter)',    sub: 'Active X account required' },
  { id: 'tiktok',        label: 'TikTok',         sub: 'Active TikTok account required' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,.08)',
  border: '1.5px solid rgba(255,255,255,.12)',
  borderRadius: 12,
  color: '#ffffff',
  padding: '12px 16px',
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700,
  color: 'rgba(255,255,255,.45)',
  marginBottom: 6, display: 'block',
  textTransform: 'uppercase', letterSpacing: 1,
};

export interface EventFormInitial {
  title: string;
  date: string;
  time: string;
  endTime?: string | null;
  location: string;
  area?: string | null;
  capacity: number;
  fee: number;
  description?: string | null;
  coverImage?: string | null;
  googleMapUrl?: string | null;
  naverMapUrl?: string | null;
  directions?: string | null;
  paymentMethod?: string | null;
  feeNote?: string | null;
  requirements?: string[];
}

// 24h "19:00" or "7:00 PM" -> "19:00" for <input type="time">
function to24h(t?: string | null): string {
  if (!t) return '';
  const ampm = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2];
    const suffix = ampm[3].toUpperCase();
    if (suffix === 'PM' && h !== 12) h += 12;
    if (suffix === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
  }
  return t;
}

export function CreateEventForm({
  eventId,
  initial,
}: {
  eventId?: string;
  initial?: EventFormInitial;
} = {}) {
  const router = useRouter();
  const isEdit = !!eventId;
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverImage, setCoverImage] = useState<string>(initial?.coverImage ?? '');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    date: initial?.date ?? '',
    time: to24h(initial?.time),
    endTime: to24h(initial?.endTime),
    location: initial?.location ?? '',
    area: initial?.area ?? '',
    capacity: initial?.capacity ? String(initial.capacity) : '',
    fee: initial?.fee ? String(initial.fee) : '',
    description: initial?.description ?? '',
    googleMapUrl: initial?.googleMapUrl ?? '',
    naverMapUrl: initial?.naverMapUrl ?? '',
    directions: initial?.directions ?? '',
    paymentMethod: initial?.paymentMethod ?? '',
    feeNote: initial?.feeNote ?? '',
  });
  const [requirements, setRequirements] = useState<string[]>(initial?.requirements ?? []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCoverImage((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  };

  const toggleReq = (id: string) =>
    setRequirements(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );

  const canSubmit = form.title && form.date && form.time && form.location && form.capacity;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const url = isEdit ? `/api/host/events/${eventId}` : '/api/host/events';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        date: form.date,
        time: form.time,
        location: form.location,
        area: form.area || undefined,
        capacity: parseInt(form.capacity),
        fee: parseInt(form.fee || '0'),
        description: form.description || undefined,
        end_time: form.endTime || undefined,
        cover_image: coverImage || undefined,
        google_map_url: form.googleMapUrl || undefined,
        naver_map_url: form.naverMapUrl || undefined,
        directions: form.directions || undefined,
        requirements,
        payment_method: form.paymentMethod || undefined,
        fee_note: form.feeNote || undefined,
      }),
    });

    if (res.ok) {
      if (isEdit) {
        router.push(`/meetups/${eventId}`);
        router.refresh();
      } else {
        setForm({ title: '', date: '', time: '', endTime: '', location: '', area: '', capacity: '', fee: '', description: '', googleMapUrl: '', naverMapUrl: '', directions: '', paymentMethod: '', feeNote: '' });
        setCoverImage('');
        setRequirements([]);
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,.06)',
      border: '1px solid rgba(255,255,255,.1)',
      borderRadius: 16, padding: 24,
    }}>
      <div style={{ display: 'grid', gap: 16 }}>

        {/* Cover image */}
        <div>
          <label style={labelStyle}>Cover photo</label>
          <div
            onClick={() => coverInputRef.current?.click()}
            style={{
              width: '100%', height: 160, borderRadius: 12, cursor: 'pointer',
              border: '1.5px dashed rgba(255,255,255,.2)',
              background: coverImage ? 'transparent' : 'rgba(255,255,255,.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}
          >
            {coverImage ? (
              <>
                <img src={coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setCoverImage(''); }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: '50%',
                    width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: 13 }}>Click to upload cover photo</div>
              </div>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Samgyeopsal Night" />
        </div>

        {/* Date + Start/End Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Start time *</label>
            <input style={inputStyle} type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>End time <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,.25)' }}>(optional)</span></label>
            <input style={inputStyle} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </div>
        </div>

        {/* Venue name */}
        <div>
          <label style={labelStyle}>Venue name *</label>
          <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Kyochon Chicken Gangnam" />
        </div>

        {/* Map links */}
        <div>
          <label style={labelStyle}>Google Maps URL</label>
          <input style={inputStyle} value={form.googleMapUrl} onChange={e => set('googleMapUrl', e.target.value)} placeholder="https://maps.google.com/..." />
        </div>
        <div>
          <label style={labelStyle}>Naver Maps URL</label>
          <input style={inputStyle} value={form.naverMapUrl} onChange={e => set('naverMapUrl', e.target.value)} placeholder="https://naver.me/..." />
        </div>
        <div>
          <label style={labelStyle}>How to find us</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
            value={form.directions}
            onChange={e => set('directions', e.target.value)}
            placeholder="Take exit 3 at Hongik Univ station, walk 5 min — we're on the 2nd floor next to CU"
          />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 4, lineHeight: 1.4 }}>
            Subway exits, landmarks, or directions to help people (especially newcomers) find the spot
          </p>
        </div>

        {/* Area + Capacity + Fee */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Area</label>
            <input style={inputStyle} value={form.area} onChange={e => set('area', e.target.value)} placeholder="Gangnam" />
          </div>
          <div>
            <label style={labelStyle}>Capacity *</label>
            <input style={inputStyle} type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="12" />
          </div>
          <div>
            <label style={labelStyle}>Entry fee (₩)</label>
            <input style={inputStyle} type="number" value={form.fee} onChange={e => set('fee', e.target.value)} placeholder="0" />
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label style={labelStyle}>Payment method</label>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { id: 'dutch',    label: 'Dutch pay',       sub: 'Each person pays for what they order' },
              { id: 'split',    label: 'Split equally',   sub: 'Total bill divided evenly at the end' },
              { id: 'cover',    label: 'Cover charge',    sub: 'Entry fee collected, then pay separately for food & drinks' },
              { id: 'included', label: 'All included',    sub: 'Food & drinks covered by the entry fee' },
            ].map(opt => {
              const selected = form.paymentMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set('paymentMethod', selected ? '' : opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                    background: selected ? 'rgba(255,107,53,.1)' : 'rgba(255,255,255,.05)',
                    border: `1.5px solid ${selected ? 'rgba(255,107,53,.4)' : 'rgba(255,255,255,.1)'}`,
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
                    <div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#FF6B35' : '#fff' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>{opt.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fee note */}
        <div>
          <label style={labelStyle}>
            Fee details{' '}
            <span style={{ color: 'rgba(255,255,255,.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span>
          </label>
          <input
            style={inputStyle}
            value={form.feeNote}
            onChange={e => set('feeNote', e.target.value)}
            placeholder="e.g. Includes 2 shots per person + first beer"
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What's the vibe?"
          />
        </div>

        {/* Requirements */}
        <div>
          <label style={labelStyle}>Attendee Requirements</label>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 12, lineHeight: 1.5 }}>
            For safety and a fun, wholesome meetup — select what attendees must have.
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {REQUIREMENTS.map(req => {
              const checked = requirements.includes(req.id);
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => toggleReq(req.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                    background: checked ? 'rgba(255,107,53,.1)' : 'rgba(255,255,255,.05)',
                    border: `1.5px solid ${checked ? 'rgba(255,107,53,.4)' : 'rgba(255,255,255,.1)'}`,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${checked ? '#FF6B35' : 'rgba(255,255,255,.25)'}`,
                    background: checked ? '#FF6B35' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: checked ? '#FF6B35' : '#fff' }}>
                      {req.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>
                      {req.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="accent"
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          style={{ opacity: loading || !canSubmit ? 0.6 : 1 }}
        >
          {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save changes' : 'Create Meetup')}
        </Button>
      </div>
    </div>
  );
}
