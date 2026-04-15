import { SignJWT } from 'jose';
import { auth } from '@/lib/auth';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8001';

async function makeBackendJWT(userId: string, email: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secret);
}

export async function proxyToBackend(
  _req: Request,
  backendPath: string,
  method: string,
  bodyOverride?: unknown,
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await makeBackendJWT(session.user.id, session.user.email ?? '');

  const res = await fetch(`${BACKEND}${backendPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: bodyOverride !== undefined ? JSON.stringify(bodyOverride) : undefined,
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
