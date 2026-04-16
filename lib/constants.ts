export const NATIONALITIES = [
  'Korean', 'American', 'British', 'French', 'German', 'Italian',
  'Japanese', 'Chinese', 'Vietnamese', 'Thai', 'Australian',
  'Canadian', 'Brazilian', 'Indian', 'Spanish', 'Dutch', 'Swedish',
  'Uzbek', 'Filipino', 'Indonesian', 'Other',
] as const;

export const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/your_facebook_name' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your_instagram_name or @your_instagram_name' },
  { id: 'x',        label: 'X',         placeholder: 'https://twitter.com/Your_Twitter_Name or @Your_Twitter_Name' },
  { id: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/yourlinkedinname' },
  { id: 'tiktok',   label: 'TikTok',    placeholder: 'https://tiktok.com/@yourname' },
] as const;

export const USER_STATUSES = [
  { id: 'tourist',       label: 'Traveler',             sub: 'Visiting Korea' },
  { id: 'student',       label: 'International Student', sub: 'Studying in Korea' },
  { id: 'expat',         label: 'Expat',                sub: 'Living & working in Korea' },
  { id: 'local_korean',  label: 'Local Korean',         sub: 'Korean national' },
  { id: 'local_student', label: 'Korean Student',       sub: 'Studying at a Korean uni' },
  { id: 'korean_worker', label: 'Korean Professional',  sub: 'Working in Korea' },
] as const;

export type PlatformId = typeof PLATFORMS[number]['id'];
export type UserStatusId = typeof USER_STATUSES[number]['id'];

export const TAGS = [
  'Photography', 'Modeling', 'Korean Tutoring', 'English Tutoring',
  'Translation', 'Content Creation', 'Video Editing', 'Graphic Design',
  'Language Exchange', 'Tour Guide', 'Cooking', 'Music', 'Dance',
  'Fitness', 'Hair & Makeup', 'Voice Acting', 'Visa Help',
  'Real Estate', 'Business', 'Travel Buddy',
] as const;

export type TagCategory = 'can_do' | 'looking_for';
