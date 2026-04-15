import { proxyToBackend } from '@/lib/proxy';
import { NextRequest } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8001';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/feed/posts/${id}/comments`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyToBackend(req, `/feed/posts/${id}/comments`, 'POST', body);
}
