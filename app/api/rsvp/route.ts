import { proxyToBackend } from '@/lib/proxy';

export async function POST(req: Request) {
  const { eventId } = await req.json() as { eventId: string };
  if (!eventId) return Response.json({ error: 'Missing eventId' }, { status: 400 });

  return proxyToBackend(req, '/rsvp', 'POST', { event_id: eventId });
}
