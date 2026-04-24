'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LOCATIONS } from '@/lib/constants';
import { CopyEventLink } from '@/components/CopyEventLink';
import type { ApiHostEvent } from '@/lib/server-api';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14,
  fontFamily: 'inherit', boxSizing: 'border-box',
  background: 'rgba(255, 244, 227, .55)', border: '1.5px solid rgba(45, 24, 16, .14)',
  color: '#3D2416', outline: 'none',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 800,
  color: 'rgba(45, 24, 16, .55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4,
};
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

interface EventForm {
  title: string;
  date: string;
  time: string;
  area: string;
  location: string;
  capacity: string;
  fee: string;
  description: string;
  naver_map_url: string;
  google_map_url: string;
  meeting_details: string;
  contact_link: string;
}

const EMPTY_FORM: EventForm = {
  title: '', date: '', time: '', area: '', location: '',
  capacity: '', fee: '0', description: '',
  naver_map_url: '', google_map_url: '', meeting_details: '',
  contact_link: '',
};

export function HostingSection({ initialEvents }: { initialEvents: ApiHostEvent[] }) {
  const router = useRouter();
  const [events, setEvents] = useState<ApiHostEvent[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof EventForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCoverImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!showForm) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (ev) => setCoverImage(ev.target?.result as string);
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showForm]);

  const canSubmit =
    form.title.trim() && form.date && form.time &&
    form.area && form.location.trim() && form.capacity;

  const handleCreate = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/host/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          date: form.date,
          time: form.time,
          area: form.area || null,
          location: form.location.trim(),
          capacity: parseInt(form.capacity, 10),
          fee: parseInt(form.fee || '0', 10),
          description: form.description.trim() || null,
          naver_map_url: form.naver_map_url.trim() || null,
          google_map_url: form.google_map_url.trim() || null,
          directions: form.meeting_details.trim() || null,
          cover_image: coverImage || null,
          contact_link: form.contact_link.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setForm(EMPTY_FORM);
      setCoverImage(null);
      setShowForm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleRsvp = useCallback(async (rsvpId: string, status: 'approved' | 'rejected' | 'cancelled') => {
    await fetch('/api/host/rsvp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvpId, status }),
    });
    router.refresh();
  }, [router]);

  return (
    <div>
      {/* Upcoming events */}
      {events.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {events.map(ev => (
            <HostEventCard key={ev.id} event={ev} onRsvp={handleRsvp} />
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm ? (
        <div style={{
          padding: 20, borderRadius: 16,
          background: 'rgba(255, 107, 91, .04)',
          border: '1.5px solid rgba(255, 107, 91, .2)',
        }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#2D1810', marginBottom: 16 }}>
            New Meetup
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input className="input-light" style={inputStyle} value={form.title}
                onChange={e => set('title', e.target.value)} placeholder="e.g. Saturday Hike in Bukhansan" />
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input style={{ ...inputStyle, colorScheme: 'light' }} type="date" value={form.date}
                  onChange={e => set('date', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Time *</label>
                <input style={{ ...inputStyle, colorScheme: 'light' }} type="time" value={form.time}
                  onChange={e => set('time', e.target.value)} />
              </div>
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Area *</label>
                <select className="input-light" style={inputStyle} value={form.area}
                  onChange={e => set('area', e.target.value)}>
                  <option value="">Select area</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Capacity *</label>
                <input className="input-light" style={inputStyle} type="number" min={1} max={500}
                  value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g. 10" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Venue / Address *</label>
              <input className="input-light" style={inputStyle} value={form.location}
                onChange={e => set('location', e.target.value)} placeholder="e.g. Starbucks Hongdae 2F" />
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Fee (KRW)</label>
                <input className="input-light" style={inputStyle} type="number" min={0}
                  value={form.fee} onChange={e => set('fee', e.target.value)} placeholder="0 = free" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <p style={{ fontSize: 11, color: 'rgba(45, 24, 16, .45)', paddingBottom: 8 }}>
                  0 = free
                </p>
              </div>
            </div>

            {/* Cover image */}
            <div>
              <label style={labelStyle}>Photo <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional · shows what the meetup is like · Ctrl+V to paste)</span></label>
              {coverImage ? (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 4 }}>
                  <img src={coverImage} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={() => setCoverImage(null)} style={{
                    position: 'absolute', top: 8, right: 8,
                    padding: '4px 10px', borderRadius: 999, border: 'none',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    background: 'rgba(0,0,0,.55)', color: '#fff',
                  }}>Remove</button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: 100, borderRadius: 10, cursor: 'pointer',
                  border: '1.5px dashed rgba(45,24,16,.2)', background: 'rgba(45,24,16,.02)',
                  fontSize: 13, fontWeight: 600, color: 'rgba(45,24,16,.4)',
                }}>
                  + Upload photo  or  Ctrl+V to paste
                  <input type="file" accept="image/*" onChange={handleCoverImage} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea className="input-light" style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="What's the vibe? Who should come?" />
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Naver Map link</label>
                <input className="input-light" style={inputStyle} value={form.naver_map_url}
                  onChange={e => set('naver_map_url', e.target.value)} placeholder="https://naver.me/..." />
              </div>
              <div>
                <label style={labelStyle}>Google Map link</label>
                <input className="input-light" style={inputStyle} value={form.google_map_url}
                  onChange={e => set('google_map_url', e.target.value)} placeholder="https://maps.app.goo.gl/..." />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Meeting details <span style={{ fontWeight: 400, textTransform: 'none' }}>(visible to approved attendees only)</span></label>
              <textarea className="input-light" style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                value={form.meeting_details} onChange={e => set('meeting_details', e.target.value)}
                placeholder="e.g. 2F window seats, I'll have a red hat on" />
            </div>

            <div>
              <label style={labelStyle}>Group chat link <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional · shown to approved attendees)</span></label>
              <input className="input-light" style={inputStyle} value={form.contact_link}
                onChange={e => set('contact_link', e.target.value)}
                placeholder="KakaoTalk open chat, WhatsApp group link, etc." />
            </div>

            {error && <p style={{ fontSize: 12, color: '#E84F3D', fontWeight: 700 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setCoverImage(null); setError(null); }}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 999, border: '1.5px solid rgba(45,24,16,.15)',
                  fontSize: 14, fontWeight: 700, background: '#fff', color: '#3D2416',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                Cancel
              </button>
              <button type="button" onClick={handleCreate} disabled={!canSubmit || saving}
                style={{
                  flex: 2, padding: '12px 0', borderRadius: 999, border: 'none',
                  fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                  background: (!canSubmit || saving) ? 'rgba(45,24,16,.08)' : 'linear-gradient(135deg, #FF6B5B, #E84393)',
                  color: (!canSubmit || saving) ? 'rgba(45,24,16,.35)' : '#fff',
                  cursor: (!canSubmit || saving) ? 'not-allowed' : 'pointer',
                  boxShadow: (!canSubmit || saving) ? 'none' : '0 4px 14px rgba(255,107,91,.28)',
                }}>
                {saving ? 'Creating...' : 'Create Meetup'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowForm(true)}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 999,
            border: '1.5px dashed rgba(255,107,91,.4)',
            fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            background: 'transparent', color: '#FF6B5B', cursor: 'pointer',
          }}>
          + Host a Meetup
        </button>
      )}
    </div>
  );
}

function HostEventCard({
  event, onRsvp,
}: {
  event: ApiHostEvent;
  onRsvp: (rsvpId: string, status: 'approved' | 'rejected' | 'cancelled') => void;
}) {
  const d = new Date(event.date + 'T00:00');
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  // Host counts as +1 in "going"
  const going = event.approved_count + 1;
  const spots = event.capacity - going;

  return (
    <div style={{
      padding: 16, borderRadius: 14,
      background: 'rgba(255, 107, 91, .04)',
      border: '1px solid rgba(255, 107, 91, .18)',
    }}>
      {/* Clickable header */}
      <Link href={`/meetups/${event.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#2D1810' }}>{event.title}</p>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(45,24,16,.55)', marginBottom: 2 }}>
          {dateStr} · {event.time}{event.area ? ` · ${event.area}` : ''}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(45,24,16,.45)' }}>
          {going}/{event.capacity} going · {spots > 0 ? `${spots} spot${spots > 1 ? 's' : ''} left` : 'Full'}
        </p>
      </Link>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end', marginBottom: event.pending_rsvps.length > 0 ? 12 : 0 }}>
        <CopyEventLink eventId={event.id} title={event.title} light />
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
          background: 'rgba(255, 107, 91, .1)', color: '#FF6B5B',
          border: '1px solid rgba(255, 107, 91, .25)',
        }}>Hosting</span>
      </div>

      {event.pending_rsvps.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(45,24,16,.5)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Requests ({event.pending_rsvps.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {event.pending_rsvps.map(r => (
              <div key={r.rsvp_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: '#fff', border: '1px solid rgba(45,24,16,.08)',
              }}>
                {r.user_image ? (
                  <img src={r.user_image} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 900, color: '#fff',
                  }}>{r.user_name[0]}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2D1810' }}>{r.user_name}</p>
                  {r.message && <p style={{ fontSize: 12, color: 'rgba(45,24,16,.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" onClick={() => onRsvp(r.rsvp_id, 'approved')}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: 'none',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      background: 'linear-gradient(135deg, #00B894, #00957A)', color: '#fff',
                    }}>✓</button>
                  <button type="button" onClick={() => onRsvp(r.rsvp_id, 'rejected')}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(45,24,16,.15)',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      background: '#fff', color: 'rgba(45,24,16,.5)',
                    }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved attendees */}
      {event.approved_rsvps.length > 0 && (
        <div style={{ marginTop: event.pending_rsvps.length > 0 ? 12 : 0 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(45,24,16,.5)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Going ({event.approved_rsvps.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {event.approved_rsvps.map(r => (
              <div key={r.rsvp_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 10,
                background: 'rgba(0,184,148,.05)', border: '1px solid rgba(0,184,148,.15)',
              }}>
                {r.user_image ? (
                  <img src={r.user_image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900, color: '#fff',
                  }}>{r.user_name[0]}</div>
                )}
                <p style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#2D1810' }}>{r.user_name}</p>
                <button type="button" onClick={() => onRsvp(r.rsvp_id, 'cancelled')}
                  style={{
                    padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(45,24,16,.15)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    background: '#fff', color: 'rgba(45,24,16,.45)', flexShrink: 0,
                  }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
