'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Overview {
  posts: { id: string; content: string; user_id: string; user_name: string; user_email: string; created_at: string | null }[];
  comments: { id: string; content: string; post_id: string; user_id: string; user_name: string; user_email: string; created_at: string | null }[];
  memories: { id: string; content: string; event_id: string; event_title: string; user_id: string; user_name: string; user_email: string; created_at: string | null }[];
  users: { id: string; name: string; email: string; nationality: string | null; onboarding_complete: boolean; created_at: string | null; is_admin: boolean }[];
  events: { id: string; title: string; date: string; area: string | null; host_id: string | null; capacity: number }[];
}

interface BanEntry {
  email: string;
  banned_at: string | null;
  banned_by: string | null;
  reason: string | null;
}

interface InviteEntry {
  id: string;
  token: string;
  created_at: string | null;
  expires_at: string | null;
  claimed_at: string | null;
  claimed_by: { id: string; name: string; email: string } | null;
  note: string | null;
  state: 'unused' | 'claimed' | 'expired';
}

interface PendingApproval {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
  nationality: string | null;
  location: string | null;
  locationDistrict: string | null;
  status: string | null;
  school: string | null;
  gender: string | null;
  age: number | null;
  bio: string | null;
  profileImage: string | null;
  profileImages: string[];
  lookingFor: string[];
  lookingForCustom: string | null;
  languages: { language: string; level: string }[];
  interests: string[];
  stayArrived: string | null;
  stayDeparted: string | null;
  previousRejections: { reason: string | null; rejectedAt: string }[];
}

type Tab = 'approvals' | 'invites' | 'posts' | 'comments' | 'memories' | 'users' | 'events' | 'banned';

export default function AdminClient({
  data,
  bans,
  invites,
  pendingApprovals,
  currentAdminEmail,
}: {
  data: Overview;
  bans: BanEntry[];
  invites: InviteEntry[];
  pendingApprovals: PendingApproval[];
  currentAdminEmail: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(pendingApprovals.length > 0 ? 'approvals' : 'invites');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [newInvite, setNewInvite] = useState<{ token: string; url: string; note: string | null } | null>(null);
  const [inviteNote, setInviteNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const myEmail = currentAdminEmail.trim().toLowerCase();

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = (token: string) => `${appOrigin}/invite/${token}`;

  const generateInvite = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: inviteNote.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        alert(`Failed to generate: ${err.error ?? err.detail ?? res.status}`);
        return;
      }
      const { token, note } = await res.json() as { token: string; note: string | null };
      const url = inviteUrl(token);
      setNewInvite({ token, url, note });
      setInviteNote('');
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopiedId('__latest');
        setTimeout(() => setCopiedId(null), 2200);
      } catch { /* user can manual-copy */ }
      router.refresh();
    } finally {
      setGenerating(false);
    }
  };

  const copyInvite = async (id: string, token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('Clipboard copy failed — please copy manually');
    }
  };

  const revokeInvite = async (id: string) => {
    if (!confirm('Revoke this invite link? (Only unused invites can be revoked)')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/invites/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        alert(`Failed: ${err.error ?? err.detail ?? res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async (url: string, id: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setBusyId(id);
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        alert(`Failed: ${err.error ?? err.detail ?? res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const banUser = async (email: string, userId: string) => {
    const reason = prompt(`Ban ${email} — reason (optional, press Enter to skip):`);
    if (reason === null) return;  // cancel
    setBusyId(userId);
    try {
      const res = await fetch('/api/admin/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason: reason || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        alert(`Ban failed: ${err.error ?? err.detail ?? res.status}`);
        return;
      }
      alert(`${email} banned. Re-login attempts with this email will be blocked.`);
      router.refresh();
    } catch (e) {
      alert(`Ban failed: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const deleteAccount = async (userId: string, email: string) => {
    const alsoBan = confirm(
      `⚠️ Delete ${email}?\n` +
      `→ All their posts / comments / RSVPs / hosted events will be cascade-deleted.\n\n` +
      `[OK] Delete + ban email (recommended)\n` +
      `[Cancel] Abort\n\n` +
      `※ To delete WITHOUT banning, cancel and use the "Delete Only" button.`,
    );
    if (!alsoBan) return;
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}?also_ban=true`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        alert(`Failed: ${err.error ?? err.detail ?? res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const deleteAccountOnly = async (userId: string, email: string) => {
    if (!confirm(`Delete ${email} (no ban)?\n→ They can re-register with the same Google account as a fresh user.`)) return;
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}?also_ban=false`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        alert(`Failed: ${err.error ?? err.detail ?? res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const unban = async (email: string) => {
    if (!confirm(`Unban ${email}?`)) return;
    setBusyId(email);
    try {
      const res = await fetch(`/api/admin/bans/${encodeURIComponent(email)}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        alert(`Failed: ${err.error ?? err.detail ?? res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      alert(`Failed: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(`Failed: ${err.error ?? res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(`Failed: ${err.error ?? res.status}`);
        return;
      }
      setRejectingId(null);
      setRejectReason('');
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const unusedCount = invites.filter(i => i.state === 'unused').length;
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'approvals', label: 'Approvals', count: pendingApprovals.length },
    { key: 'invites', label: 'Invites', count: unusedCount },
    { key: 'posts', label: 'Posts', count: data.posts.length },
    { key: 'comments', label: 'Comments', count: data.comments.length },
    { key: 'memories', label: 'Memories', count: data.memories.length },
    { key: 'users', label: 'Users', count: data.users.length },
    { key: 'events', label: 'Events', count: data.events.length },
    { key: 'banned', label: 'Banned', count: bans.length },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>Admin</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', marginBottom: 24 }}>
        Showing 50 most recent per tab. All deletes are immediate and irreversible. Bans can be reversed from the Banned tab.
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

      {tab === 'approvals' && (
        <>
          {pendingApprovals.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,.5)', padding: 40, textAlign: 'center' }}>
              No pending applications.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pendingApprovals.map(a => {
              const primaryPhoto = a.profileImages?.[0] || a.profileImage || '';
              const motives = [
                ...(a.lookingFor ?? []),
                ...(a.lookingForCustom ? [a.lookingForCustom] : []),
              ];
              return (
                <div key={a.id} style={{
                  padding: 18, borderRadius: 14,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {primaryPhoto ? (
                      <img src={primaryPhoto} alt="" style={{
                        width: 88, height: 88, borderRadius: 14, objectFit: 'cover', flexShrink: 0,
                        border: '1px solid rgba(255,255,255,.1)',
                      }} />
                    ) : (
                      <div style={{
                        width: 88, height: 88, borderRadius: 14, flexShrink: 0,
                        background: 'rgba(255,255,255,.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, color: 'rgba(255,255,255,.3)',
                      }}>?</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
                            {a.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                            {a.email}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                          {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
                        {a.nationality && <span>🌏 {a.nationality}</span>}
                        {a.status && <span>· {a.status}</span>}
                        {a.gender && <span>· {a.gender}</span>}
                        {a.age && <span>· {a.age}y</span>}
                        {a.location && <span>· {a.location}{a.locationDistrict ? `/${a.locationDistrict}` : ''}</span>}
                        {a.school && <span>· 🎓 {a.school}</span>}
                      </div>
                      {a.bio && (
                        <p style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                          {a.bio}
                        </p>
                      )}
                      {motives.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                          <strong style={{ color: 'rgba(255,255,255,.8)' }}>Motives:</strong> {motives.join(', ')}
                        </div>
                      )}
                      {a.languages?.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                          <strong style={{ color: 'rgba(255,255,255,.8)' }}>Languages:</strong> {a.languages.map(l => `${l.language} (${l.level})`).join(', ')}
                        </div>
                      )}
                      {a.interests?.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>
                          <strong style={{ color: 'rgba(255,255,255,.8)' }}>Interests:</strong> {a.interests.join(', ')}
                        </div>
                      )}
                      {a.previousRejections?.length > 0 && (
                        <div style={{
                          marginTop: 10, padding: '8px 12px', borderRadius: 8,
                          background: 'rgba(232,67,147,.12)',
                          border: '1px solid rgba(232,67,147,.28)',
                          fontSize: 12, color: '#FFB4C8',
                        }}>
                          <strong>⚠ Previously rejected {a.previousRejections.length}×.</strong>
                          {a.previousRejections[0].reason && (
                            <div style={{ marginTop: 4, color: 'rgba(255,180,200,.85)' }}>
                              Last reason: {a.previousRejections[0].reason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {rejectingId === a.id ? (
                    <div style={{ marginTop: 14, padding: 12, background: 'rgba(232,67,147,.06)', borderRadius: 10, border: '1px solid rgba(232,67,147,.2)' }}>
                      <textarea
                        placeholder="Reason shown to applicant (required)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%', padding: 10, borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                          background: 'rgba(0,0,0,.25)', color: '#fff',
                          border: '1px solid rgba(255,255,255,.12)',
                          resize: 'vertical',
                        }}
                      />
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          disabled={busyId === a.id}
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          style={{
                            padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.7)',
                            border: '1px solid rgba(255,255,255,.12)',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          disabled={busyId === a.id || !rejectReason.trim()}
                          onClick={() => reject(a.id)}
                          style={{
                            padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            background: 'linear-gradient(135deg, #E84393, #C13660)',
                            color: '#fff', border: 'none', opacity: busyId === a.id || !rejectReason.trim() ? 0.5 : 1,
                          }}
                        >
                          Confirm reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        disabled={busyId === a.id}
                        onClick={() => setRejectingId(a.id)}
                        style={{
                          padding: '10px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.75)',
                          border: '1px solid rgba(255,255,255,.14)',
                        }}
                      >
                        Reject
                      </button>
                      <button
                        disabled={busyId === a.id}
                        onClick={() => approve(a.id)}
                        style={{
                          padding: '10px 22px', borderRadius: 999, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                          background: 'linear-gradient(135deg, #FF6B35, #E84393)',
                          color: '#fff', border: 'none',
                          opacity: busyId === a.id ? 0.5 : 1,
                        }}
                      >
                        {busyId === a.id ? '...' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'invites' && (
        <>
          {/* Generate panel — single-tap copy on mobile */}
          <div style={{
            padding: 20, marginBottom: 20, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(255,107,91,.14), rgba(232,67,147,.12))',
            border: '1px solid rgba(255,107,91,.25)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4, color: '#FFB4A6', textTransform: 'uppercase', marginBottom: 12 }}>
              Issue new invite
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={inviteNote}
                onChange={e => setInviteNote(e.target.value.slice(0, 120))}
                placeholder="Note (optional) — e.g. Sarah from Yonsei"
                style={{
                  flex: 1, minWidth: 220, padding: '12px 14px', borderRadius: 10,
                  fontSize: 14, fontFamily: 'inherit',
                  background: 'rgba(255,255,255,.06)', color: '#fff',
                  border: '1px solid rgba(255,255,255,.15)',
                }}
              />
              <button
                type="button"
                onClick={generateInvite}
                disabled={generating}
                style={{
                  padding: '12px 22px', borderRadius: 999, fontSize: 14, fontWeight: 800,
                  fontFamily: 'inherit', cursor: generating ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #FF6B5B, #E84393)',
                  color: '#fff', border: 'none',
                  boxShadow: '0 6px 18px rgba(255,107,91,.32), inset 0 1px 0 rgba(255,255,255,.22)',
                  minWidth: 180,
                }}
              >
                {generating ? '...' : '+ Generate Invite Link'}
              </button>
            </div>
            {newInvite && (
              <div style={{
                marginTop: 14, padding: 14, borderRadius: 10,
                background: 'rgba(0,184,148,.12)',
                border: '1px solid rgba(0,184,148,.35)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#00D68F', marginBottom: 6 }}>
                  {copiedId === '__latest' ? '✓ Copied! Paste in Threads DM' : 'Link ready — tap to copy'}
                </p>
                <button
                  type="button"
                  onClick={() => copyInvite('__latest', newInvite.token)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    fontSize: 13, fontFamily: 'monospace', textAlign: 'left',
                    background: 'rgba(0,0,0,.3)', color: '#fff',
                    border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {newInvite.url}
                </button>
                {newInvite.note && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>
                    Note: {newInvite.note}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recent invites list */}
          <Section>
            {invites.length === 0 && <EmptyRow text="No invites issued" />}
            {invites.map(inv => (
              <Row key={inv.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Meta>
                    {fmt(inv.created_at)}
                    {inv.note && <> · {inv.note}</>}
                    <span style={{
                      marginLeft: 8, padding: '2px 8px', borderRadius: 999,
                      fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
                      background: inv.state === 'unused' ? 'rgba(0,184,148,.2)'
                        : inv.state === 'claimed' ? 'rgba(108,92,231,.2)'
                        : 'rgba(255,255,255,.08)',
                      color: inv.state === 'unused' ? '#00D68F'
                        : inv.state === 'claimed' ? '#A29BFE'
                        : 'rgba(255,255,255,.4)',
                    }}>
                      {inv.state.toUpperCase()}
                    </span>
                  </Meta>
                  <Body>
                    {inv.state === 'claimed' && inv.claimed_by
                      ? `→ ${inv.claimed_by.name} <${inv.claimed_by.email}>`
                      : inv.state === 'expired' ? `Expired ${fmt(inv.expires_at)}`
                      : `Expires ${fmt(inv.expires_at)}`}
                  </Body>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {inv.state === 'unused' && (
                    <>
                      <ActionBtn
                        busy={false}
                        onClick={() => copyInvite(inv.id, inv.token)}
                        label={copiedId === inv.id ? '✓ Copied' : 'Copy URL'}
                        color={copiedId === inv.id ? 'rgba(0,184,148,.85)' : 'rgba(255,255,255,.15)'}
                      />
                      <ActionBtn
                        busy={busyId === inv.id}
                        onClick={() => revokeInvite(inv.id)}
                        label="Revoke"
                        color="rgba(255,107,53,.75)"
                      />
                    </>
                  )}
                </div>
              </Row>
            ))}
          </Section>
        </>
      )}

      {tab === 'posts' && (
        <Section>
          {data.posts.length === 0 && <EmptyRow text="No posts" />}
          {data.posts.map(p => (
            <Row key={p.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{p.user_name} · {p.user_email} · {fmt(p.created_at)}</Meta>
                <Body>{p.content}</Body>
              </div>
              <ActionBtn
                busy={busyId === p.id}
                onClick={() => doDelete(`/api/feed/posts/${p.id}`, p.id, `Delete post?\n"${p.content.slice(0, 60)}..."`)}
                label="Delete"
              />
            </Row>
          ))}
        </Section>
      )}

      {tab === 'comments' && (
        <Section>
          {data.comments.length === 0 && <EmptyRow text="No comments" />}
          {data.comments.map(c => (
            <Row key={c.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{c.user_name} · {c.user_email} · on post {c.post_id.slice(0, 8)} · {fmt(c.created_at)}</Meta>
                <Body>{c.content}</Body>
              </div>
              <ActionBtn
                busy={busyId === c.id}
                onClick={() => doDelete(`/api/feed/comments/${c.id}`, c.id, `Delete comment?`)}
                label="Delete"
              />
            </Row>
          ))}
        </Section>
      )}

      {tab === 'memories' && (
        <Section>
          {data.memories.length === 0 && <EmptyRow text="No memories" />}
          {data.memories.map(m => (
            <Row key={m.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{m.user_name} · {m.user_email} · in {m.event_title} · {fmt(m.created_at)}</Meta>
                <Body>{m.content || <span style={{ color: 'rgba(255,255,255,.3)' }}>(photo only)</span>}</Body>
              </div>
              <ActionBtn
                busy={busyId === m.id}
                onClick={() => doDelete(`/api/memories/${m.id}`, m.id, `Delete memory?`)}
                label="Delete"
              />
            </Row>
          ))}
        </Section>
      )}

      {tab === 'users' && (
        <Section>
          {data.users.length === 0 && <EmptyRow text="No users" />}
          {data.users.map(u => {
            const isSelf = u.email.trim().toLowerCase() === myEmail;
            const isProtected = isSelf || u.is_admin;
            const protectedLabel = isSelf
              ? '(you — can\'t self-moderate)'
              : '(admin — protected)';
            return (
              <Row key={u.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Meta>
                    {u.email} · {u.nationality ?? '(no nationality)'} · {u.onboarding_complete ? 'onboarded' : 'pending'} · {fmt(u.created_at)}
                    {u.is_admin && (
                      <span style={{
                        marginLeft: 8, padding: '2px 8px', borderRadius: 999,
                        background: 'rgba(108,92,231,.2)', color: '#A29BFE',
                        fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
                      }}>
                        ADMIN
                      </span>
                    )}
                  </Meta>
                  <Body>{u.name}</Body>
                </div>
                {isProtected ? (
                  <span style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 600,
                    color: 'rgba(255,255,255,.35)', fontStyle: 'italic',
                    padding: '6px 12px',
                  }}>
                    {protectedLabel}
                  </span>
                ) : (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <ActionBtn
                      busy={busyId === u.id}
                      onClick={() => banUser(u.email, u.id)}
                      label="Ban"
                      color="#FFC107"
                    />
                    <ActionBtn
                      busy={busyId === u.id}
                      onClick={() => deleteAccount(u.id, u.email)}
                      label="Delete + Ban"
                      color="rgba(255,107,53,.85)"
                    />
                    <ActionBtn
                      busy={busyId === u.id}
                      onClick={() => deleteAccountOnly(u.id, u.email)}
                      label="Delete Only"
                      color="rgba(255,255,255,.15)"
                    />
                  </div>
                )}
              </Row>
            );
          })}
        </Section>
      )}

      {tab === 'events' && (
        <Section>
          {data.events.length === 0 && <EmptyRow text="No events" />}
          {data.events.map(e => (
            <Row key={e.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>{e.date} · {e.area ?? 'no area'} · capacity {e.capacity} · host {e.host_id?.slice(0, 8) ?? 'none'}</Meta>
                <Body>{e.title}</Body>
              </div>
              <ActionBtn
                busy={busyId === e.id}
                onClick={() => doDelete(
                  `/api/admin/events/${e.id}`,
                  e.id,
                  `Delete event "${e.title}"?\nRSVPs/Memories will be cascade-deleted.`,
                )}
                label="Delete"
              />
            </Row>
          ))}
        </Section>
      )}

      {tab === 'banned' && (
        <Section>
          {bans.length === 0 && <EmptyRow text="No bans" />}
          {bans.map(b => (
            <Row key={b.email}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Meta>banned {fmt(b.banned_at)} {b.banned_by ? `· by ${b.banned_by}` : ''}</Meta>
                <Body>{b.email}{b.reason ? ` — ${b.reason}` : ''}</Body>
              </div>
              <ActionBtn
                busy={busyId === b.email}
                onClick={() => unban(b.email)}
                label="Unban"
                color="rgba(0,184,148,.85)"
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

function ActionBtn({
  onClick,
  busy,
  label,
  color = 'rgba(255,107,53,.8)',
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        flexShrink: 0, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
        background: busy ? 'rgba(255,255,255,.1)' : color,
        color: '#fff', border: 'none', cursor: busy ? 'wait' : 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {busy ? '...' : label}
    </button>
  );
}

function fmt(iso: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
