import { proxyToBackend } from '@/lib/proxy';

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/users/tags', 'PUT', body);
}
