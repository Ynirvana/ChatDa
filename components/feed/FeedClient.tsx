'use client';

import { useState } from 'react';
import { PostCard, type Post } from './PostCard';

export function FeedClient({
  initialPosts,
  currentUserId,
}: {
  initialPosts: Post[];
  currentUserId?: string;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const handlePost = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch('/api/feed/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const newPost = await res.json() as Post;
      setPosts(p => [newPost, ...p]);
      setContent('');
      setFocused(false);
    }
    setSubmitting(false);
  };

  const handleDelete = (id: string) => {
    setPosts(p => p.filter(post => post.id !== id));
  };

  const canPost = content.trim().length > 0 && !submitting;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Create post box */}
      {currentUserId && (
        <div style={{
          background: 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 16, padding: 16,
        }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 1000))}
            onFocus={() => setFocused(true)}
            placeholder="Share something with the community..."
            rows={focused ? 4 : 2}
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6,
              resize: 'none', transition: 'height .2s',
            }}
          />
          {(focused || content) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>
                {content.length}/1000
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setContent(''); setFocused(false); }}
                  style={{
                    padding: '7px 16px', borderRadius: 999, cursor: 'pointer',
                    background: 'transparent', border: '1px solid rgba(255,255,255,.15)',
                    color: 'rgba(255,255,255,.4)', fontSize: 13, fontFamily: 'inherit',
                  }}
                >Cancel</button>
                <button
                  onClick={handlePost}
                  disabled={!canPost}
                  style={{
                    padding: '7px 20px', borderRadius: 999, cursor: canPost ? 'pointer' : 'default',
                    background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                    fontFamily: 'inherit', opacity: canPost ? 1 : 0.4,
                  }}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,.25)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <p style={{ fontSize: 16, fontWeight: 700 }}>No posts yet — be the first!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
}
