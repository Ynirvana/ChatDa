import { proxyToBackend } from '@/lib/proxy';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const action = new URL(req.url).searchParams.get('action') ?? '';
  return proxyToBackend(req, `/connections/${id}?action=${action}`, 'PUT');
}
