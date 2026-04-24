import { proxyToBackend } from '@/lib/proxy';

export async function POST(req: Request) {
  const { eventId, message } = await req.json() as { eventId: string; message?: string };
  if (!eventId) return Response.json({ error: 'Missing eventId' }, { status: 400 });

  return proxyToBackend(req, '/rsvp', 'POST', { event_id: eventId, message: message || null });
}
