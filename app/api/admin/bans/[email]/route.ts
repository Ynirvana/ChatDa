import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { proxyToBackend } from '@/lib/proxy';

export async function DELETE(req: Request, { params }: { params: Promise<{ email: string }> }) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { email } = await params;
  return proxyToBackend(req, `/admin/bans/${encodeURIComponent(email)}`, 'DELETE');
}
