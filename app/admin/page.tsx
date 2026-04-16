import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { backendFetch } from '@/lib/server-api';
import { Nav } from '@/components/ui/Nav';
import AdminClient from './AdminClient';

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
  users: {
    id: string;
    name: string;
    email: string;
    nationality: string | null;
    onboarding_complete: boolean;
    created_at: string | null;
  }[];
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

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!isAdminEmail(session.user.email)) redirect('/');

  let data: Overview;
  let bans: BansPayload['bans'] = [];
  try {
    data = await backendFetch<Overview>('/admin/overview');
    const bansRes = await backendFetch<BansPayload>('/admin/bans').catch(() => ({ bans: [] } as BansPayload));
    bans = bansRes.bans;
  } catch (e) {
    return (
      <div className="page-bg" style={{ minHeight: '100vh' }}>
        <Nav user={session.user} isAdmin={true} />
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

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Nav user={session.user} />
      <AdminClient data={data} bans={bans} />
    </div>
  );
}
