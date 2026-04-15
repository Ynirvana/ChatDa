import { proxyToBackend } from '@/lib/proxy';

export async function DELETE(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  return proxyToBackend(req, `/feed/comments/${commentId}`, 'DELETE');
}
