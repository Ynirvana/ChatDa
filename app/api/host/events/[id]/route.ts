import { proxyToBackend } from '@/lib/proxy';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (!body.title || !body.date || !body.time || !body.location || !body.capacity) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  return proxyToBackend(req, `/host/events/${id}`, 'PATCH', body);
}
