import { proxyToBackend } from '@/lib/proxy';

export async function POST(req: Request) {
  const body = await req.json() as {
    title: string;
    date: string;
    time: string;
    end_time?: string;
    location: string;
    area?: string;
    capacity: number;
    fee?: number;
    description?: string;
  };

  if (!body.title || !body.date || !body.time || !body.location || !body.capacity) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  return proxyToBackend(req, '/host/events', 'POST', body);
}
