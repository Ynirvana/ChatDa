import { proxyToBackend } from '@/lib/proxy';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface Body {
  bio?: string | null;
  stayArrived?: string | null;  // YYYY-MM-DD
  stayDeparted?: string | null;
  languages?: { language: string; level: string }[];
  interests?: string[];
  lookingFor?: string[];
  lookingForCustom?: string | null;
  school?: string | null;
  gender?: 'male' | 'female' | 'other';
  age?: number | null;
  showPersonalInfo?: boolean;
  profileImages?: string[];
}

export async function PATCH(req: Request) {
  // Pending 유저는 프로필 수정 차단 (결정 #6). Rejected는 재신청 전 수정 허용.
  const session = await auth();
  if (session?.user?.id) {
    const [u] = await db
      .select({ approvalStatus: users.approvalStatus })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (u?.approvalStatus === 'pending') {
      return Response.json({ error: 'Profile is locked while your application is under review' }, { status: 403 });
    }
  }

  const body = await req.json() as Body;

  // snake_case로 백엔드 전달 + undefined 필드는 제외 (partial update 의미 유지)
  const payload: Record<string, unknown> = {};
  if ('bio' in body) payload.bio = body.bio ?? null;
  if ('stayArrived' in body) payload.stay_arrived = body.stayArrived ?? null;
  if ('stayDeparted' in body) payload.stay_departed = body.stayDeparted ?? null;
  if ('languages' in body) payload.languages = body.languages ?? [];
  if ('interests' in body) payload.interests = body.interests ?? [];
  if ('lookingFor' in body) payload.looking_for = body.lookingFor ?? [];
  if ('lookingForCustom' in body) payload.looking_for_custom = body.lookingForCustom ?? null;
  if ('school' in body) payload.school = body.school ?? null;
  if ('gender' in body) payload.gender = body.gender;
  if ('age' in body) payload.age = body.age ?? null;
  if ('showPersonalInfo' in body) payload.show_personal_info = body.showPersonalInfo;
  if ('profileImages' in body) payload.profile_images = body.profileImages ?? [];

  return proxyToBackend(req, '/users/me', 'PATCH', payload);
}
