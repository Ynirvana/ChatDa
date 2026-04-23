// NATIONALITIES는 195개국 ISO 3166 기반 목록으로 `lib/nationalities.ts`에 분리됨.
// 여기서 import하지 말고 해당 파일 사용.

// 한국 내 광역 단위
export const LOCATIONS = [
  'Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Jeju',
  'Gyeonggi', 'Gangwon', 'Chungcheong', 'Jeolla', 'Gyeongsang', 'Other',
] as const;

export type Location = typeof LOCATIONS[number];

// Seoul 25개 구 (gu) — 서울 선택 시 sub-pick 으로 제공
// 외국인/거주자 기준 유명도 순 — 앞쪽이 first-recall 지역
export const SEOUL_DISTRICTS = [
  'Gangnam', 'Mapo', 'Yongsan', 'Jung', 'Seongdong',
  'Jongno', 'Seocho', 'Songpa', 'Gwangjin', 'Seodaemun',
  'Yeongdeungpo', 'Gangseo', 'Gangdong', 'Gwanak', 'Dongjak',
  'Seongbuk', 'Yangcheon', 'Eunpyeong', 'Nowon', 'Dongdaemun',
  'Jungnang', 'Gangbuk', 'Dobong', 'Guro', 'Geumcheon',
] as const;

export type SeoulDistrict = typeof SEOUL_DISTRICTS[number];

// Gender — 3-way segmented (Male / Female / Other). 필수 필드. 추가 옵션은 필요해지면 확장.
export const GENDER_OPTIONS = [
  { id: 'male',   label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other',  label: 'Other' },
] as const;

export type GenderId = typeof GENDER_OPTIONS[number]['id'];

// Age 입력 제약
export const AGE_MIN = 18;
export const AGE_MAX = 99;

// Student status일 때 학교 선택용 — 국제학생 비율 기준 주요 대학. free text도 허용 (combobox).
export const KOREAN_UNIVERSITIES = [
  'Seoul National University (SNU)',
  'Yonsei University',
  'Korea University',
  'KAIST',
  'POSTECH',
  'Hanyang University',
  'Sungkyunkwan University (SKKU)',
  'Ewha Womans University',
  'Sogang University',
  'Hankuk University of Foreign Studies (HUFS)',
  'Kyung Hee University',
  'Chung-Ang University (CAU)',
  'UNIST',
  'Hongik University',
  'Konkuk University',
  'Dongguk University',
  'Kookmin University',
  'Sejong University',
  'Inha University',
  'Sookmyung Women\'s University',
  'Yonsei (Songdo)',
  'Underwood International College',
] as const;

export const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/your_facebook_name' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your_instagram_name or @your_instagram_name' },
  { id: 'threads',   label: 'Threads',   placeholder: 'https://threads.net/@yourname' },
  { id: 'x',         label: 'X',         placeholder: 'https://twitter.com/Your_Twitter_Name or @Your_Twitter_Name' },
  { id: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/yourlinkedinname' },
  { id: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@yourname' },
] as const;

// v4.1 상태. 'I am a...' Step 1 필수 (단 Korean nationality면 자동으로 'local' 박힘 — 피커 숨김).
// People 탭 필터 핵심 축.
// ⚠️ id 'visitor'/'expat'/'exchange_student'는 레거시 호환 위해 유지.
//    라벨만 'Visitor'/'Resident'/'Student'로 표기. 'worker'/'visiting_soon'/'visited_before'
//    상태인 유저는 UI 피커에서 사라졌지만 DB 값은 남아있을 수 있음 (렌더 fallback 유지).
export const USER_STATUSES = [
  { id: 'local',            label: 'Local',    sub: 'Korean (auto)' },
  { id: 'exchange_student', label: 'Student',  sub: 'Studying in Korea' },
  { id: 'visitor',          label: 'Visitor',  sub: 'Short-term stay' },
  { id: 'expat',            label: 'Resident', sub: 'Living in Korea long-term' },
] as const;

// 온보딩 피커에서 선택 가능한 status (Local은 Korean nationality로 자동 박힘)
export const SELECTABLE_USER_STATUSES = USER_STATUSES.filter(s => s.id !== 'local');

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
