'use client';

import { useState, useEffect, useRef } from 'react';

export interface Memory {
  id: string;
  event_id: string;
  content: string;
  photos: string[];
  created_at: string;
  author_id: string;
  author_name: string;
  author_image: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PhotoGrid({ photos, onClick }: { photos: string[]; onClick?: (idx: number) => void }) {
  if (photos.length === 0) return null;

  const cols = photos.length === 1 ? 1 : photos.length === 2 ? 2 : 3;
  return (
    <div style={{
      display: 'grid', gap: 4,
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      marginTop: 12, borderRadius: 12, overflow: 'hidden',
    }}>
      {photos.map((p, i) => (
        <img
          key={i}
          src={p}
          alt=""
          onClick={() => onClick?.(i)}
          style={{
            width: '100%',
            aspectRatio: photos.length === 1 ? '16/10' : '1',
            objectFit: 'cover',
            cursor: onClick ? 'pointer' : 'default',
            background: 'rgba(255,255,255,.05)',
          }}
        />
      ))}
    </div>
  );
}

function Lightbox({ photos, startIdx, onClose }: { photos: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % photos.length);
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [photos.length, onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <img src={photos[idx]} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.1)',
          border: 'none', color: '#fff', fontSize: 24, width: 40, height: 40,
          borderRadius: '50%', cursor: 'pointer',
        }}
      >×</button>
      {photos.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,.6)', fontSize: 13,
        }}>
          {idx + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}

function MemoryCard({
  memory,
  currentUserId,
  onDelete,
}: {
  memory: Memory;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this memory?')) return;
    setDeleting(true);
    const res = await fetch(`/api/memories/${memory.id}`, { method: 'DELETE' });
    if (res.ok) onDelete(memory.id);
    else setDeleting(false);
  };

  return (
    <>
      <div style={{
        background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 16, padding: 18, opacity: deleting ? 0.5 : 1,
      }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {memory.author_image ? (
            <img src={memory.author_image} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B35, #E84393)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 900, color: '#fff',
            }}>
              {memory.author_name[0]}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{memory.author_name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>{timeAgo(memory.created_at)}</div>
          </div>
          {currentUserId === memory.author_id && (
            <button
              onClick={handleDelete}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,.2)', fontSize: 18, padding: 4, lineHeight: 1,
              }}
              title="Delete"
            >×</button>
          )}
        </div>

        {/* Content */}
        {memory.content && (
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '12px 0 0',
          }}>
            {memory.content}
          </p>
        )}

        {/* Photos */}
        <PhotoGrid photos={memory.photos} onClick={(i) => setLightboxIdx(i)} />
      </div>

      {lightboxIdx !== null && (
        <Lightbox photos={memory.photos} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  );
}

export function MemoriesSection({
  eventId,
  canPost,
  currentUserId,
}: {
  eventId: string;
  canPost: boolean;
  currentUserId?: string;
}) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/events/${eventId}/memories`)
      .then(r => r.json())
      .then((data: Memory[]) => setMemories(data))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    const newPhotos = await Promise.all(toProcess.map(fileToBase64));
    setPhotos(p => [...p, ...newPhotos]);
  };

  const handlePost = async () => {
    if ((!content.trim() && photos.length === 0) || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/events/${eventId}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim(), photos }),
    });
    if (res.ok) {
      const newMemory = await res.json() as Memory;
      setMemories(m => [newMemory, ...m]);
      setContent('');
      setPhotos([]);
      setFocused(false);
    } else {
      const err = await res.json().catch(() => ({ detail: 'Failed to post' }));
      alert(err.detail ?? 'Failed to post');
    }
    setSubmitting(false);
  };

  const handleDelete = (id: string) => {
    setMemories(m => m.filter(x => x.id !== id));
  };

  const canSubmit = (content.trim().length > 0 || photos.length > 0) && !submitting;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>Memories</h2>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.35)' }}>
          {memories.length > 0 ? `${memories.length} shared` : 'after the meetup'}
        </span>
      </div>

      {/* Create memory box */}
      {canPost && (
        <div style={{
          background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 16, padding: 16, marginBottom: 16,
        }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 1000))}
            onFocus={() => setFocused(true)}
            placeholder="Share how it went — photos welcome ✨"
            rows={focused || content ? 3 : 2}
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.6,
              resize: 'none',
            }}
          />

          {/* Photo previews */}
          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6, marginTop: 10 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    style={{
                      position: 'absolute', top: 2, right: 2, width: 20, height: 20,
                      background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff',
                      borderRadius: '50%', cursor: 'pointer', fontSize: 12, lineHeight: 1,
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {(focused || content || photos.length > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => handleFiles(e.target.files)}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={photos.length >= 10}
                  style={{
                    background: 'none', border: 'none', cursor: photos.length >= 10 ? 'default' : 'pointer',
                    color: 'rgba(255,255,255,.5)', fontSize: 13, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 4, padding: 4,
                    opacity: photos.length >= 10 ? 0.3 : 1,
                  }}
                >
                  📷 <span>{photos.length > 0 ? `${photos.length}/10` : 'Add photos'}</span>
                </button>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>{content.length}/1000</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setContent(''); setPhotos([]); setFocused(false); }}
                  style={{
                    padding: '7px 16px', borderRadius: 999, cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(255,255,255,.15)',
                    color: 'rgba(255,255,255,.4)', fontSize: 13, fontFamily: 'inherit',
                  }}
                >Cancel</button>
                <button
                  onClick={handlePost}
                  disabled={!canSubmit}
                  style={{
                    padding: '7px 20px', borderRadius: 999, cursor: canSubmit ? 'pointer' : 'default',
                    background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                    fontFamily: 'inherit', opacity: canSubmit ? 1 : 0.4,
                  }}
                >
                  {submitting ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Memories list */}
      {loading ? (
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', textAlign: 'center', padding: 20 }}>
          Loading memories...
        </p>
      ) : memories.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: 'rgba(255,255,255,.03)', borderRadius: 16,
          border: '1px dashed rgba(255,255,255,.08)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📸</div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>
            {canPost ? 'Be the first to share a memory from this meetup' : 'No memories shared yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {memories.map(m => (
            <MemoryCard
              key={m.id}
              memory={m}
              currentUserId={currentUserId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
