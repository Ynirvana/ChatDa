import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { backendFetch } from '@/lib/server-api';
import { Nav } from '@/components/ui/Nav';
import AdminClient from './AdminClient';
import { db } from '@/db';
import { users as usersTable, approvalHistory } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';

type BackendUser = {
  id: string;
  name: string;
  email: string;
  nationality: string | null;
  onboarding_complete: boolean;
  created_at: string | null;
};

export const dynamic = 'force-dynamic';

interface Overview {
  posts: {
    id: string;
    content: string;
    user_id: string;
    user_name: string;
    user_email: string;
    created_at: string | null;
  }[];
  comments: {
    id: string;
    content: string;
    post_id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    created_at: string | null;
  }[];
  memories: {
    id: string;
    content: string;
    event_id: string;
    event_title: string;
    user_id: string;
    user_name: string;
    user_email: string;
    created_at: string | null;
  }[];
  users: BackendUser[];
  events: {
    id: string;
    title: string;
    date: string;
    area: string | null;
    host_id: string | null;
    capacity: number;
  }[];
}

interface BansPayload {
  bans: {
    email: string;
    banned_at: string | null;
    banned_by: string | null;
    reason: string | null;
  }[];
}

interface InvitesPayload {
  invites: {
    id: string;
    token: string;
    created_at: string | null;
    expires_at: string | null;
    claimed_at: string | null;
    claimed_by: { id: string; name: string; email: string } | null;
    note: string | null;
    state: 'unused' | 'claimed' | 'expired';
  }[];
}

async function fetchPendingApprovals() {
  const pending = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.approvalStatus, 'pending'), eq(usersTable.onboardingComplete, true)))
    .orderBy(desc(usersTable.createdAt));

  const ids = pending.map(u => u.id);
  const prevRejections: Record<string, { reason: string | null; rejectedAt: Date }[]> = {};
  if (ids.length > 0) {
    const rejHistory = await db
      .select()
      .from(approvalHistory)
      .where(eq(approvalHistory.action, 'rejected'))
      .orderBy(desc(approvalHistory.createdAt));
    for (const h of rejHistory) {
      if (ids.includes(h.userId)) {
        (prevRejections[h.userId] ??= []).push({ reason: h.reason, rejectedAt: h.createdAt });
      }
    }
  }

  return pending.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt?.toISOString() ?? null,
    nationality: u.nationality,
    location: u.location,
    locationDistrict: u.locationDistrict,
    status: u.status,
    school: u.school,
    gender: u.gender,
    age: u.age,
    bio: u.bio,
    profileImage: u.profileImage,
    profileImages: u.profileImages,
    lookingFor: u.lookingFor,
    lookingForCustom: u.lookingForCustom,
    languages: u.languages,
    interests: u.interests,
    stayArrived: u.stayArrived,
    stayDeparted: u.stayDeparted,
    previousRejections: (prevRejections[u.id] ?? []).map(r => ({
      reason: r.reason,
      rejectedAt: r.rejectedAt.toISOString(),
    })),
  }));
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!isAdminEmail(session.user.email)) redirect('/');

  let data: Overview;
  let bans: BansPayload['bans'] = [];
  let invites: InvitesPayload['invites'] = [];
  let pendingApprovals: Awaited<ReturnType<typeof fetchPendingApprovals>> = [];
  try {
    data = await backendFetch<Overview>('/admin/overview');
    const bansRes = await backendFetch<BansPayload>('/admin/bans').catch(() => ({ bans: [] } as BansPayload));
    bans = bansRes.bans;
    const invRes = await backendFetch<InvitesPayload>('/admin/invites').catch(() => ({ invites: [] } as InvitesPayload));
    invites = invRes.invites;
    pendingApprovals = await fetchPendingApprovals();
  } catch (e) {
    return (
      <div className="page-bg" style={{ minHeight: '100vh' }}>
        <Nav user={session.user} isAdmin={true} light={false} />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>Admin</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', marginTop: 16 }}>
            백엔드에서 admin 데이터를 가져오지 못했습니다.
            <br />
            서버의 <code>ADMIN_EMAILS</code> 환경변수에 네 이메일이 포함되어 있는지 확인해줘.
          </p>
          <pre style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,.05)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
            {(e as Error).message}
          </pre>
        </div>
      </div>
    );
  }

  // 서버에서 each user에 is_admin 플래그 추가. ADMIN_EMAILS 전체 리스트는
  // 노출하지 않고, "이 유저가 admin인가" 단일 boolean만 내려줌.
  const usersWithAdminFlag = data.users.map(u => ({
    ...u,
    is_admin: isAdminEmail(u.email),
  }));
  const enrichedData = { ...data, users: usersWithAdminFlag };

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Nav user={session.user} light={false} />
      <AdminClient
        data={enrichedData}
        bans={bans}
        invites={invites}
        pendingApprovals={pendingApprovals}
        currentAdminEmail={session.user.email ?? ''}
      />
    </div>
  );
}
