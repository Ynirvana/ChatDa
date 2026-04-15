'use client';

import { useState, useEffect } from 'react';

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
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

function Avatar({ name, image, size = 28 }: { name: string; image: string | null; size?: number }) {
  return image ? (
    <img src={image} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #FF6B35, #E84393)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 900, color: '#fff',
    }}>
      {name[0]}
    </div>
  );
}

function CommentInput({
  placeholder,
  onSubmit,
  onCancel,
  autoFocus = false,
}: {
  placeholder: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(text.trim());
    setText('');
    setSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, 500))}
        placeholder={placeholder}
        rows={2}
        autoFocus={autoFocus}
        style={{
          width: '100%', background: 'rgba(255,255,255,.07)',
          border: '1px solid rgba(255,255,255,.12)', borderRadius: 10,
          outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit',
          lineHeight: 1.5, resize: 'none', padding: '8px 10px',
        }}
      />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,.15)',
              color: 'rgba(255,255,255,.4)', fontSize: 12, fontFamily: 'inherit',
            }}
          >Cancel</button>
        )}
        <button
          onClick={submit}
          disabled={!text.trim() || submitting}
          style={{
            padding: '5px 14px', borderRadius: 999, cursor: text.trim() ? 'pointer' : 'default',
            background: 'linear-gradient(135deg, #FF6B35, #E84393)',
            border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
            fontFamily: 'inherit', opacity: text.trim() ? 1 : 0.4,
          }}
        >
          {submitting ? '...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  currentUserId,
  onReply,
  onDelete,
  replyToId,  // top-level comment id to always reply to
}: {
  comment: Comment;
  replies: Comment[];
  currentUserId?: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (id: string) => void;
  replyToId?: string;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const targetId = replyToId ?? comment.id;

  const isReply = !!replyToId;

  return (
    <div>
      {/* Comment row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Avatar name={comment.author_name} image={comment.author_image} size={isReply ? 24 : 28} />
        <div style={{ flex: 1 }}>
          <div style={{
            background: 'rgba(255,255,255,.07)', borderRadius: 10,
            padding: '8px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{comment.author_name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>{timeAgo(comment.created_at)}</span>
              {currentUserId === comment.author_id && (
                <button
                  onClick={() => onDelete(comment.id)}
                  style={{
                    marginLeft: 'auto', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'rgba(255,255,255,.2)',
                    fontSize: 14, padding: '0 2px', lineHeight: 1,
                  }}
                  title="Delete"
                >×</button>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {comment.content}
            </p>
          </div>

          {/* Reply button */}
          {currentUserId && (
            <button
              onClick={() => setShowReplyInput(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,.35)', fontSize: 12, padding: '4px 2px',
                fontFamily: 'inherit',
              }}
            >Reply</button>
          )}

          {/* Reply input */}
          {showReplyInput && (
            <div style={{ marginTop: 6 }}>
              <CommentInput
                placeholder="Write a reply..."
                autoFocus
                onSubmit={async (content) => {
                  await onReply(targetId, content);
                  setShowReplyInput(false);
                }}
                onCancel={() => setShowReplyInput(false)}
              />
            </div>
          )}

          {/* Nested replies */}
          {replies.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                  replyToId={comment.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentsSection({
  postId,
  currentUserId,
  onCountChange,
}: {
  postId: string;
  currentUserId?: string;
  onCountChange?: (count: number) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/feed/posts/${postId}/comments`)
      .then(r => r.json())
      .then((data: Comment[]) => {
        setComments(data);
        onCountChange?.(data.length);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const addComment = async (content: string, parentId?: string) => {
    const res = await fetch(`/api/feed/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parent_id: parentId ?? null }),
    });
    if (res.ok) {
      const newComment = await res.json() as Comment;
      setComments(prev => {
        const updated = [...prev, newComment];
        onCountChange?.(updated.length);
        return updated;
      });
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch(`/api/feed/comments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setComments(prev => {
        const updated = prev.filter(c => c.id !== id && c.parent_id !== id);
        onCountChange?.(updated.length);
        return updated;
      });
    }
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => !!c.parent_id);

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {loading ? (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>Loading...</p>
      ) : (
        topLevel.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={replies.filter(r => r.parent_id === comment.id)}
            currentUserId={currentUserId}
            onReply={(parentId, content) => addComment(content, parentId)}
            onDelete={deleteComment}
          />
        ))
      )}

      {/* New top-level comment input */}
      {currentUserId && (
        <div style={{ marginTop: 4 }}>
          <CommentInput
            placeholder="Write a comment..."
            onSubmit={(content) => addComment(content)}
          />
        </div>
      )}
    </div>
  );
}
