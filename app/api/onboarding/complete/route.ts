import { proxyToBackend } from '@/lib/proxy';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, approvalHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface Body {
  firstName: string;
  lastName: string;
  nationality: string;
  location?: string;
  locationDistrict?: string | null;
  status?: string;
  school?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  age?: number | null;
  lookingFor?: string[];
  lookingForCustom?: string | null;
  bio?: string;
  profileImage?: string;
  profileImages?: string[];
  socialLinks: { platform: string; url: string }[];
}

const CUSTOM_MAX = 30;

export async function POST(req: Request) {
  const body = await req.json() as Body;
  const { firstName, lastName, nationality, location, locationDistrict, status, school, gender, age, lookingFor, lookingForCustom, bio, profileImage, profileImages, socialLinks } = body;

  if (!firstName?.trim() || !lastName?.trim() || !nationality || !location || !status) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!gender) {
    return Response.json({ error: 'Gender is required' }, { status: 400 });
  }
  // Photo 필수 — multi 배열 우선, 없으면 legacy single 사용
  const images = Array.isArray(profileImages) ? profileImages.filter(Boolean).slice(0, 5) : null;
  const hasAnyPhoto = (images && images.length > 0) || !!profileImage;
  if (!hasAnyPhoto) {
    return Response.json({ error: 'Profile photo is required' }, { status: 400 });
  }
  if (age != null && (!Number.isInteger(age) || age < 18 || age > 99)) {
    return Response.json({ error: 'Age must be 18–99' }, { status: 400 });
  }
  // Student 상태면 school 필수
  if (status === 'exchange_student' && !(school ?? '').trim()) {
    return Response.json({ error: 'School is required for students' }, { status: 400 });
  }
  const presetCount = lookingFor?.length ?? 0;
  const customTrimmed = (lookingForCustom ?? '').trim();
  if (customTrimmed.length > CUSTOM_MAX) {
    return Response.json({ error: `Custom motive must be ${CUSTOM_MAX} chars or fewer` }, { status: 400 });
  }
  // Motive는 Profile page(Step 2)에서 채움 — Step 1에선 최소 요구 제거. 상한만 유지.
  const motiveCount = presetCount + (customTrimmed ? 1 : 0);
  if (motiveCount > 3) {
    return Response.json({ error: 'Max 3 motives' }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  let wasPending = false;
  let currentOnboarded = false;
  if (userId) {
    const [u] = await db
      .select({
        approvalStatus: users.approvalStatus,
        onboardingComplete: users.onboardingComplete,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    wasPending = u?.approvalStatus === 'pending';
    currentOnboarded = !!u?.onboardingComplete;
    // Pending + 이미 온보딩 완료 유저는 재편집 차단 (결정 #6). 첫 제출은 허용.
    if (wasPending && currentOnboarded) {
      return Response.json(
        { error: 'Profile is locked while your application is under review' },
        { status: 403 },
      );
    }
  }

  const res = await proxyToBackend(req, '/users/onboarding', 'POST', {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    nationality,
    location,
    location_district: location === 'Seoul' ? (locationDistrict || null) : null,
    status,
    school: status === 'exchange_student' ? ((school ?? '').trim() || null) : null,
    gender,
    age: age ?? null,
    looking_for: lookingFor ?? [],
    looking_for_custom: customTrimmed || null,
    bio: bio ?? null,
    profile_image: profileImage ?? null,
    profile_images: images,  // null이면 백엔드가 legacy profile_image로 fallback
    social_links: socialLinks ?? [],
  });

  // 온보딩 제출 성공 + 유저가 pending → 승인 큐 진입 기록
  if (res.ok && wasPending && userId) {
    await db.insert(approvalHistory).values({
      userId,
      action: 'submitted',
      actorEmail: session?.user?.email ?? null,
    });
  }

  return res;
}
