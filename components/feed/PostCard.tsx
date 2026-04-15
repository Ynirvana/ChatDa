'use client';

import { useState } from 'react';
import { CommentsSection } from './CommentsSection';

export interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_image: string | null;
  author_nationality: string | null;
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
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

export function PostCard({
  post,
  currentUserId,
  onDelete,
}: {
  post: Post;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    if (!currentUserId) return;
    setLiked(p => !p);
    setLikeCount(p => liked ? p - 1 : p + 1);
    await fetch(`/api/feed/posts/${post.id}/like`, { method: 'POST' });
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    const res = await fetch(`/api/feed/posts/${post.id}`, { method: 'DELETE' });
    if (res.ok) onDelete(post.id);
    else setDeleting(false);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,.06)',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 16, padding: 20,
      opacity: deleting ? 0.5 : 1,
      transition: 'opacity .2s',
    }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {post.author_image ? (
          <img src={post.author_image} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #FF6B35, #E84393)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff',
          }}>
            {post.author_name[0]}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{post.author_name}</span>
            {post.author_nationality && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{post.author_nationality}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>
            {timeAgo(post.created_at)}
          </div>
        </div>

        {currentUserId === post.author_id && (
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
      <p style={{
        fontSize: 15, color: 'rgba(255,255,255,.85)', lineHeight: 1.65,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 14,
      }}>
        {post.content}
      </p>

      {/* Actions row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!currentUserId}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: currentUserId ? 'pointer' : 'default',
            padding: '4px 0',
          }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill={liked ? '#E84393' : 'none'}
            stroke={liked ? '#E84393' : 'rgba(255,255,255,.35)'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'fill .15s, stroke .15s' }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span style={{ fontSize: 13, color: liked ? '#E84393' : 'rgba(255,255,255,.35)', fontWeight: 600 }}>
            {likeCount > 0 ? likeCount : ''}
          </span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none"
            stroke={showComments ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'stroke .15s' }}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span style={{ fontSize: 13, color: showComments ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)', fontWeight: 600 }}>
            {commentCount > 0 ? commentCount : ''}
          </span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 14, paddingTop: 14 }}>
          <CommentsSection
            postId={post.id}
            currentUserId={currentUserId}
            onCountChange={setCommentCount}
          />
        </div>
      )}
    </div>
  );
}
