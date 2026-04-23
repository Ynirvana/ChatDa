'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const MAX_PHOTOS = 5;

export function PhotosEditor({ initial }: { initial: string[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>(() => initial.slice(0, MAX_PHOTOS));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = async (next: string[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImages: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? body.detail ?? 'Failed to save photos');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError('Network error — try again');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const data = (ev.target?.result as string) ?? '';
      if (!data) return;
      if (photos.length >= MAX_PHOTOS) return;
      const next = [...photos, data];
      setPhotos(next);
      const ok = await persist(next);
      if (!ok) setPhotos(photos);  // rollback on failure
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = async (idx: number) => {
    if (photos.length <= 1) {
      setError('Add another photo before removing — 1 required');
      return;
    }
    const next = photos.filter((_, i) => i !== idx);
    const prev = photos;
    setPhotos(next);
    const ok = await persist(next);
    if (!ok) setPhotos(prev);
  };

  const makePrimary = async (idx: number) => {
    if (idx === 0) return;
    const next = [...photos];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    const prev = photos;
    setPhotos(next);
    const ok = await persist(next);
    if (!ok) setPhotos(prev);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {photos.map((img, idx) => (
          <div
            key={`${idx}-${img.slice(0, 24)}`}
            onClick={() => makePrimary(idx)}
            style={{
              position: 'relative',
              width: 78, height: 78, borderRadius: 16,
              overflow: 'hidden', flexShrink: 0,
              border: idx === 0 ? '3px solid #FF6B5B' : '2px solid rgba(45, 24, 16, .12)',
              cursor: idx === 0 || saving ? 'default' : 'pointer',
              boxShadow: idx === 0 ? '0 4px 14px rgba(255, 107, 91, .25)' : '0 1px 4px rgba(45, 24, 16, .06)',
              opacity: saving ? 0.6 : 1,
              transition: 'opacity .15s',
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
              disabled={saving}
              aria-label="Remove photo"
              style={{
                position: 'absolute', top: 4, right: 4,
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(45, 24, 16, .78)',
                color: '#fff', border: 'none',
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, lineHeight: 1, padding: 0,
                fontFamily: 'inherit',
              }}
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            style={{
              width: 78, height: 78, borderRadius: 16, flexShrink: 0,
              background: 'rgba(255, 107, 91, .08)',
              border: '2px dashed rgba(255, 107, 91, .5)',
              color: '#E84F3D',
              fontSize: 28, fontWeight: 900, lineHeight: 1,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
              opacity: saving ? 0.6 : 1,
            }}
          >
            +
          </button>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'rgba(45, 24, 16, .5)', marginTop: 10, lineHeight: 1.45 }}>
        {photos.length === 1
          ? `Add more — up to ${MAX_PHOTOS - 1} additional photos.`
          : `Tap a photo to make it MAIN. ${photos.length}/${MAX_PHOTOS} photos.`}
      </p>
      {error && (
        <p style={{ fontSize: 12, color: '#E84F3D', marginTop: 6, fontWeight: 700 }}>
          {error}
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}
