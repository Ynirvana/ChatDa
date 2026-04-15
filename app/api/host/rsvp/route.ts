import { proxyToBackend } from '@/lib/proxy';

export async function PATCH(req: Request) {
  const { rsvpId, status } = await req.json() as {
    rsvpId: string;
    status: 'approved' | 'rejected';
  };

  if (!rsvpId || !['approved', 'rejected'].includes(status)) {
    return Response.json({ error: 'Invalid params' }, { status: 400 });
  }

  return proxyToBackend(req, '/host/rsvp', 'PATCH', { rsvp_id: rsvpId, status });
}
