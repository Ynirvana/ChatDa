import { proxyToBackend } from '@/lib/proxy';

interface Body {
  bio?: string | null;
  stayArrived?: string | null;  // YYYY-MM-DD
  stayDeparted?: string | null;
  languages?: { language: string; level: string }[];
  interests?: string[];
}

export async function PATCH(req: Request) {
  const body = await req.json() as Body;

  // snake_case로 백엔드 전달 + undefined 필드는 제외 (partial update 의미 유지)
  const payload: Record<string, unknown> = {};
  if ('bio' in body) payload.bio = body.bio ?? null;
  if ('stayArrived' in body) payload.stay_arrived = body.stayArrived ?? null;
  if ('stayDeparted' in body) payload.stay_departed = body.stayDeparted ?? null;
  if ('languages' in body) payload.languages = body.languages ?? [];
  if ('interests' in body) payload.interests = body.interests ?? [];

  return proxyToBackend(req, '/users/me', 'PATCH', payload);
}
