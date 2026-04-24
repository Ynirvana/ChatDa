import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { backendFetch, type ApiProfile } from '@/lib/server-api';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { edit } = await searchParams;
  const isEditMode = edit === '1';

  let isReturning = false;
  let initial: { firstName: string; lastName: string; nationality: string; location: string; locationDistrict: string; status: string; school: string; gender: string; age: string; lookingFor: string[]; lookingForCustom: string; bio: string; profileImage: string; profileImages: string[]; socialLinks: Record<string, string> } | undefined;

  try {
    const profile = await backendFetch<ApiProfile>('/users/me');
    isReturning = profile.onboarding_complete;
    if (isReturning) {
      if (!isEditMode) redirect('/people');
      initial = {
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        nationality: profile.nationality ?? '',
        location: profile.location ?? '',
        locationDistrict: profile.location_district ?? '',
        status: profile.status ?? '',
        school: profile.school ?? '',
        gender: profile.gender ?? '',
        age: profile.age != null ? String(profile.age) : '',
        lookingFor: profile.looking_for ?? [],
        lookingForCustom: profile.looking_for_custom ?? '',
        bio: profile.bio ?? '',
        profileImage: profile.profile_image ?? '',
        profileImages: profile.profile_images ?? (profile.profile_image ? [profile.profile_image] : []),
        socialLinks: Object.fromEntries(profile.social_links.map(l => [l.platform, l.url])),
      };
    }
  } catch {
    // 신규 유저 (backend에 프로필 없음) — 빈 폼 노출
  }

  return <OnboardingForm isReturning={isReturning} initial={initial} />;
}
