// NATIONALITIES는 195개국 ISO 3166 기반 목록으로 `lib/nationalities.ts`에 분리됨.
// 여기서 import하지 말고 해당 파일 사용.

// 한국 내 광역 단위 — 동네까지는 Step 2(프로필)에서 자유 입력 예정
export const LOCATIONS = [
  'Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Jeju',
  'Gyeonggi', 'Gangwon', 'Chungcheong', 'Jeolla', 'Gyeongsang', 'Other',
] as const;

export type Location = typeof LOCATIONS[number];

export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your_instagram_name or @your_instagram_name' },
  { id: 'threads',   label: 'Threads',   placeholder: 'https://threads.net/@yourname' },
  { id: 'x',         label: 'X',         placeholder: 'https://twitter.com/Your_Twitter_Name or @Your_Twitter_Name' },
  { id: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@yourname' },
  { id: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/yourlinkedinname' },
  { id: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/your_facebook_name' },
] as const;

// v4 기준 5개 status. 'I am a...' Step 1 필수.
// People 탭 필터 핵심 축이라 빈 값 허용 X.
export const USER_STATUSES = [
  { id: 'local',           label: 'Local',           sub: 'Korean' },
  { id: 'expat',           label: 'Living in Korea', sub: 'Expat / long-term resident' },
  { id: 'visitor',         label: 'Visiting Korea',  sub: 'Short-term visitor' },
  { id: 'visiting_soon',   label: 'Visiting soon',   sub: 'Not arrived yet' },
  { id: 'visited_before',  label: 'Visited before',  sub: 'Already left Korea' },
] as const;

// Step 1 "What brings you here?" — 1~3개 선택 필수.
// userTags.looking_for (Step 2의 구체적 스킬 태그)와 다른 개념 — 여기는 방문 목적/동기.
export const LOOKING_FOR_OPTIONS = [
  { id: 'language_exchange', emoji: '🗣️', label: 'Language exchange' },
  { id: 'local_friends',     emoji: '👋', label: 'Local friends' },
  { id: 'work_networking',   emoji: '💼', label: 'Work / networking' },
  { id: 'creative_collab',   emoji: '📸', label: 'Creative collab' },
  { id: 'study_tutoring',    emoji: '🎓', label: 'Study / tutoring' },
  { id: 'travel_buddy',      emoji: '✈️', label: 'Travel buddy' },
  { id: 'food_nightlife',    emoji: '🍜', label: 'Food / nightlife' },
  { id: 'kpop_fandom',       emoji: '🎵', label: 'K-pop / fandom' },
  { id: 'visa_life_help',    emoji: '📋', label: 'Visa / life help' },
  { id: 'just_exploring',    emoji: '💡', label: 'Just exploring' },
] as const;

export const LOOKING_FOR_MAX = 3;

// Step 2 — Languages 프리셋
export const SPOKEN_LANGUAGES = [
  'Korean', 'English', 'Japanese', 'Chinese', 'Spanish', 'French',
  'German', 'Vietnamese', 'Thai', 'Indonesian', 'Portuguese', 'Russian',
  'Arabic', 'Hindi', 'Italian', 'Dutch', 'Turkish', 'Other',
] as const;

export const LANGUAGE_LEVELS = [
  { id: 'native',         label: 'Native' },
  { id: 'fluent',         label: 'Fluent' },
  { id: 'conversational', label: 'Conversational' },
  { id: 'learning',       label: 'Learning' },
] as const;

// Step 2 — Interests 프리셋 (아이스브레이커용, 상한 10)
export const INTERESTS = [
  'K-pop', 'Hiking', 'Food', 'Art', 'Tech', 'Gaming', 'Fashion', 'Music',
  'Photography', 'Travel', 'Fitness', 'Movies', 'Reading', 'Cooking',
  'Dance', 'Coffee', 'Anime', 'Sports', 'Nature', 'Languages',
] as const;

export const INTERESTS_MAX = 10;

export type PlatformId = typeof PLATFORMS[number]['id'];
export type UserStatusId = typeof USER_STATUSES[number]['id'];
export type LookingForId = typeof LOOKING_FOR_OPTIONS[number]['id'];
export type LanguageLevelId = typeof LANGUAGE_LEVELS[number]['id'];

export const TAGS = [
  'Photography', 'Modeling', 'Korean Tutoring', 'English Tutoring',
  'Translation', 'Content Creation', 'Video Editing', 'Graphic Design',
  'Language Exchange', 'Tour Guide', 'Cooking', 'Music', 'Dance',
  'Fitness', 'Hair & Makeup', 'Voice Acting', 'Visa Help',
  'Real Estate', 'Business', 'Travel Buddy',
] as const;

export type TagCategory = 'can_do' | 'looking_for';
