import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { db } from '@/db';
import { users, approvalHistory } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Pending 유저 + 온보딩 완료한 유저만 — admin이 검토할 최소 정보가 있음
  const pending = await db
    .select()
    .from(users)
    .where(and(eq(users.approvalStatus, 'pending'), eq(users.onboardingComplete, true)))
    .orderBy(desc(users.createdAt));

  // 재신청자 여부 판단용 — 과거에 rejected 된 적 있는지 history 조회
  const userIds = pending.map(u => u.id);
  const prevDecisions: Record<string, { reason: string | null; rejectedAt: Date }[]> = {};
  if (userIds.length > 0) {
    const history = await db
      .select()
      .from(approvalHistory)
      .where(eq(approvalHistory.action, 'rejected'))
      .orderBy(desc(approvalHistory.createdAt));
    for (const h of history) {
      if (userIds.includes(h.userId)) {
        (prevDecisions[h.userId] ??= []).push({ reason: h.reason, rejectedAt: h.createdAt });
      }
    }
  }

  return Response.json({
    pending: pending.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      nationality: u.nationality,
      location: u.location,
      locationDistrict: u.locationDistrict,
      status: u.status,
      school: u.school,
      gender: u.gender,
      age: u.age,
      bio: u.bio,
      profileImage: u.profileImage,
      profileImages: u.profileImages,
      lookingFor: u.lookingFor,
      lookingForCustom: u.lookingForCustom,
      languages: u.languages,
      interests: u.interests,
      stayArrived: u.stayArrived,
      stayDeparted: u.stayDeparted,
      previousRejections: prevDecisions[u.id] ?? [],
    })),
  });
}
