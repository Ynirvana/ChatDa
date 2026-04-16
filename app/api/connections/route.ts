import { proxyToBackend } from '@/lib/proxy';

export async function GET(req: Request) {
  return proxyToBackend(req, '/connections', 'GET');
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/connections', 'POST', body);
}
