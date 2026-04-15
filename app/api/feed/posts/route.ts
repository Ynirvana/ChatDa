import { proxyToBackend } from '@/lib/proxy';

export async function POST(req: Request) {
  const { content } = await req.json() as { content: string };
  if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 });
  return proxyToBackend(req, '/feed/posts', 'POST', { content });
}
