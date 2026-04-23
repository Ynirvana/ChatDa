import { backendFetch } from '@/lib/server-api';
import type { PersonData } from '@/components/PersonCard';

const MIN_FEATURED = 4;
const MAX_FEATURED = 4;

interface DirectoryResponse {
  users: PersonData[];
}

// 완성도 점수 — bio, looking_for, tags, languages, interests 있으면 카드가 풍부해 보임.
function completenessScore(p: PersonData): number {
  let s = 0;
  if (p.bio && p.bio.trim().length > 0) s += 3;
  if (p.looking_for && p.looking_for.length > 0) s += 2;
  if (p.tags && p.tags.length > 0) s += 2;
  if (p.languages && p.languages.length > 0) s += 1;
  if (p.interests && p.interests.length > 0) s += 1;
  if (p.school) s += 1;           // Student 네트워크 트리거 보너스
  if (p.profile_image) s += 1;
  return s;
}

// 다양성 규칙: 이미 뽑힌 status + nationality는 다음 pick에서 감점.
// → 첫 4명이 서로 다른 status / 서로 다른 nationality가 되도록 greedy 선택.
function pickDiverse(pool: PersonData[], count: number): PersonData[] {
  const picked: PersonData[] = [];
  const seenStatus = new Set<string>();
  const seenNationality = new Set<string>();
  const remaining = [...pool];

  while (picked.length < count && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      let score = completenessScore(p);
      if (p.status && seenStatus.has(p.status)) score -= 10;
      if (p.nationality && seenNationality.has(p.nationality)) score -= 5;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    const [chosen] = remaining.splice(bestIdx, 1);
    picked.push(chosen);
    if (chosen.status) seenStatus.add(chosen.status);
    if (chosen.nationality) seenNationality.add(chosen.nationality);
  }

  return picked;
}

export async function getFeaturedProfiles(): Promise<PersonData[] | null> {
  let data: DirectoryResponse;
  try {
    data = await backendFetch<DirectoryResponse>('/users/directory');
  } catch {
    return null;
  }

  // 최소 요건: bio 혹은 tags/looking_for 중 하나라도 있어야 랜딩 노출
  const eligible = data.users.filter(
    u => (u.bio && u.bio.trim()) || (u.tags && u.tags.length > 0) || (u.looking_for && u.looking_for.length > 0),
  );

  if (eligible.length < MIN_FEATURED) return null;

  return pickDiverse(eligible, MAX_FEATURED);
}
