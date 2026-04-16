import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  return proxyToBackend(req, '/admin/bans', 'GET');
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/admin/bans', 'POST', body);
}
