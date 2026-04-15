'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Overview {
  posts: { id: string; content: string; user_id: string; user_name: string; user_email: string; created_at: string | null }[];
  comments: { id: string; content: string; post_id: string; user_id: string; user_name: string; user_email: string; created_at: string | null }[];
  memories: { id: string; content: string; event_id: string; event_title: string; user_id: string; user_name: string; user_email: string; created_at: string | null }[];
  users: { id: string; name: string; email: string; nationality: string | null; onboarding_complete: boolean; created_at: string | null }[];
  events: { id: string; title: string; date: string; area: string | null; host_id: string | null; capacity: number }[];
}

type Tab = 'posts' | 'comments' | 'memories' | 'users' | 'events';

export default function AdminClient({ data }: { data: Overview }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('posts');
  const [busyId, setBusyId] = useState<string | null>(null);

  const doDelete = async (url: string, id: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setBusyId(id);
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(`삭제 실패: ${err.error ?? res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      alert(`삭제 실패: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'posts', label: 'Posts', count: data.posts.length },
    { key: 'comments', label: 'Comments', count: data.comments.length },
    { key: 'memories', label: 'Memories', count: data.memories.length },
    { key: 'users', label: 'Users', count: data.users.length },
    { key: 'events', label: 'Events', count: data.events.length },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>Admin</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', marginBottom: 24 }}>
        최근 50개씩 표시. 삭제는 즉시 반영되며 되돌릴 수 없음.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: tab === t.key ? 'linear-gradient(135deg, #FF6B35, #E84393)' : 'rgba(255,255,255,.06)',
              color: tab === t.key ? '#fff' : 'rgba(255,255,255,.55)',
              border: tab === t.key ? 'none' : '1px solid rgba(255,255,255,.08)',
            }}
          >
            {t.label} <span style={{ opacity: 0.7 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <Section>
          {data.posts.length === 0 && <EmptyRow text="게시글 없음" />}
          {data.posts.map(p => (
            <Row key={p.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{p.user_name} · {p.user_email} · {fmt(p.created_at)}</Meta>
                <Body>{p.content}</Body>
              </div>
              <DeleteBtn
                busy={busyId === p.id}
                onClick={() => doDelete(`/api/feed/posts/${p.id}`, p.id, `게시글 삭제?\n"${p.content.slice(0, 60)}..."`)}
              />
            </Row>
          ))}
        </Section>
      )}

      {tab === 'comments' && (
        <Section>
          {data.comments.length === 0 && <EmptyRow text="댓글 없음" />}
          {data.comments.map(c => (
            <Row key={c.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{c.user_name} · {c.user_email} · on post {c.post_id.slice(0, 8)} · {fmt(c.created_at)}</Meta>
                <Body>{c.content}</Body>
              </div>
              <DeleteBtn
                busy={busyId === c.id}
                onClick={() => doDelete(`/api/feed/comments/${c.id}`, c.id, `댓글 삭제?`)}
              />
            </Row>
          ))}
        </Section>
      )}

      {tab === 'memories' && (
        <Section>
          {data.memories.length === 0 && <EmptyRow text="메모리 없음" />}
          {data.memories.map(m => (
            <Row key={m.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{m.user_name} · {m.user_email} · in {m.event_title} · {fmt(m.created_at)}</Meta>
                <Body>{m.content || <span style={{ color: 'rgba(255,255,255,.3)' }}>(사진만)</span>}</Body>
              </div>
              <DeleteBtn
                busy={busyId === m.id}
                onClick={() => doDelete(`/api/memories/${m.id}`, m.id, `메모리 삭제?`)}
              />
            </Row>
          ))}
        </Section>
      )}

      {tab === 'users' && (
        <Section>
          {data.users.length === 0 && <EmptyRow text="유저 없음" />}
          {data.users.map(u => (
            <Row key={u.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{u.email} · {u.nationality ?? '(국적 없음)'} · {u.onboarding_complete ? 'onboarded' : 'pending'} · {fmt(u.created_at)}</Meta>
                <Body>{u.name}</Body>
              </div>
              <DeleteBtn
                busy={busyId === u.id}
                label="Ban"
                onClick={() => doDelete(
                  `/api/admin/users/${u.id}`,
                  u.id,
                  `⚠️ 유저 ${u.email} 밴?\n본인 게시글/댓글/RSVP/주최 이벤트 전부 cascade 삭제됨. 되돌릴 수 없음.`,
                )}
              />
            </Row>
          ))}
        </Section>
      )}

      {tab === 'events' && (
        <Section>
          {data.events.length === 0 && <EmptyRow text="이벤트 없음" />}
          {data.events.map(e => (
            <Row key={e.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{e.date} · {e.area ?? '지역 없음'} · capacity {e.capacity} · host {e.host_id?.slice(0, 8) ?? 'none'}</Meta>
                <Body>{e.title}</Body>
              </div>
              <DeleteBtn
                busy={busyId === e.id}
                onClick={() => doDelete(
                  `/api/admin/events/${e.id}`,
                  e.id,
                  `이벤트 "${e.title}" 삭제?\nRSVP/Memories cascade 삭제됨.`,
                )}
              />
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.04)',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px',
      borderBottom: '1px solid rgba(255,255,255,.06)',
    }}>
      {children}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div style={{ padding: '30px 16px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 14 }}>
      {text}
    </div>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {children}
    </p>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {children}
    </p>
  );
}

function DeleteBtn({ onClick, busy, label = 'Delete' }: { onClick: () => void; busy: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
        background: busy ? 'rgba(255,107,53,.2)' : 'rgba(255,107,53,.8)',
        color: '#fff', border: 'none', cursor: busy ? 'wait' : 'pointer',
      }}
    >
      {busy ? '...' : label}
    </button>
  );
}

function fmt(iso: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
