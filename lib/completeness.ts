import type { ApiProfile } from './server-api';

/**
 * 프로필 완성도 계산. Step 1은 이미 필수라 onboarding_complete 시 100%의 50%가
 * 기본 보장됨. Step 2 각 항목이 채워질 때마다 남은 50%에 비례 증가.
 *
 * 항목 (Local이 아닐 때 6개, Local이면 5개):
 *   - bio
 *   - can_do 태그 ≥1
 *   - 체류 기간 (arrived or departed 중 하나 이상) — Local은 제외
 *   - 언어 ≥1
 *   - 관심사 ≥1
 *   - 소셜 링크 ≥1
 */
export function computeCompleteness(profile: ApiProfile): {
  percent: number;
  filled: number;
  total: number;
} {
  if (!profile.onboarding_complete) {
    return { percent: 0, filled: 0, total: 0 };
  }

  const isLocal = profile.status === 'local';
  const items: boolean[] = [
    !!profile.bio?.trim(),
    (profile.tags ?? []).some(t => t.category === 'can_do'),
    (profile.languages ?? []).length > 0,
    (profile.interests ?? []).length > 0,
    profile.social_links.length > 0,
  ];
  if (!isLocal) {
    items.push(!!profile.stay_arrived || !!profile.stay_departed);
  }

  const filled = items.filter(Boolean).length;
  const total = items.length;
  const step2Pct = Math.round((filled / total) * 50);
  const percent = Math.min(100, 50 + step2Pct);

  return { percent, filled, total };
}
