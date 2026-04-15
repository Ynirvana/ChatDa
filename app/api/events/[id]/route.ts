const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/events/${id}`, { cache: 'no-store' });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
