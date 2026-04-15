import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { proxyToBackend } from '@/lib/proxy';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  return proxyToBackend(req, `/admin/users/${id}`, 'DELETE');
}
