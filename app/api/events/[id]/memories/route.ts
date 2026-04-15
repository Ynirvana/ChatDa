import { proxyToBackend } from '@/lib/proxy';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8001';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/events/${id}/memories`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyToBackend(req, `/events/${id}/memories`, 'POST', body);
}
