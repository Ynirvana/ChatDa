import { proxyToBackend } from '@/lib/proxy';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(req, `/memories/${id}`, 'DELETE');
}
