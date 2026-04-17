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
  let initial: { name: string; nationality: string; location: string; status: string; lookingFor: string[]; bio: string; profileImage: string; socialLinks: Record<string, string> } | undefined;

  try {
    const profile = await backendFetch<ApiProfile>('/users/me');
    isReturning = profile.onboarding_complete;
    if (isReturning) {
      if (!isEditMode) redirect('/people');
      initial = {
        name: profile.name ?? '',
        nationality: profile.nationality ?? '',
        location: profile.location ?? '',
        status: profile.status ?? '',
        lookingFor: profile.looking_for ?? [],
        bio: profile.bio ?? '',
        profileImage: profile.profile_image ?? '',
        socialLinks: Object.fromEntries(profile.social_links.map(l => [l.platform, l.url])),
      };
    }
  } catch {
    // 신규 유저 (backend에 프로필 없음) — 빈 폼 노출
  }

  const googleImage = session.user.image ?? '';

  return <OnboardingForm isReturning={isReturning} initial={initial} googleImage={googleImage} />;
}
