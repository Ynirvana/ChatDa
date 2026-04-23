import { SignJWT } from 'jose';
import { auth } from '@/lib/auth';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8001';

async function makeBackendJWT(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  return new SignJWT({ sub: session.user.id, email: session.user.email ?? '' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secret);
}

export async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await makeBackendJWT();
  const res = await fetch(`${BACKEND}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `Backend error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── FastAPI response types (snake_case) ──────────────────────────

export interface ApiAttendeePreview {
  id: string;
  name: string;
  profile_image: string | null;
}

export interface ApiEventSummary {
  id: string;
  title: string;
  date: string;
  time: string;
  end_time: string | null;
  cover_image: string | null;
  location: string;
  area: string | null;
  capacity: number;
  fee: number;
  approved_count: number;
  attendee_previews: ApiAttendeePreview[];
}

export interface ApiAttendee {
  id: string;
  name: string;
  nationality: string | null;
  bio: string | null;
  profile_image: string | null;
  social_links: { platform: string; url: string }[];
}

export interface ApiHost {
  id: string;
  name: string;
  bio: string | null;
  profile_image: string | null;
  nationality: string | null;
  social_links: { platform: string; url: string }[];
}

export interface ApiEventDetail extends ApiEventSummary {
  description: string | null;
  google_map_url: string | null;
  naver_map_url: string | null;
  directions: string | null;
  requirements: string[];
  payment_method: string | null;
  fee_note: string | null;
  host: ApiHost | null;
  attendees: ApiAttendee[];
}

export interface ApiLanguage {
  language: string;
  level: string;
}

export interface ApiProfile {
  id: string;
  name: string;
  nationality: string | null;
  location: string | null;
  location_district: string | null;
  status: string | null;
  school: string | null;
  gender: string | null;
  age: number | null;
  show_personal_info: boolean;
  looking_for: string[];
  looking_for_custom: string | null;
  stay_arrived: string | null;   // YYYY-MM-DD
  stay_departed: string | null;
  languages: ApiLanguage[];
  interests: string[];
  bio: string | null;
  profile_image: string | null;
  profile_images: string[];
  onboarding_complete: boolean;
  social_links: { platform: string; url: string }[];
  tags: { tag: string; category: 'can_do' | 'looking_for' }[];
  rsvps: {
    rsvp_id: string;
    status: string;
    event_id: string;
    title: string;
    date: string;
    time: string;
    area: string | null;
  }[];
  hosted_events: {
    event_id: string;
    title: string;
    date: string;
    time: string;
    area: string | null;
  }[];
}

export interface ApiPendingRsvp {
  rsvp_id: string;
  status: string;
  event_id: string;
  event_title: string;
  user_id: string;
  user_name: string;
  user_nationality: string | null;
  user_bio: string | null;
  user_image: string | null;
  message: string | null;
}

export interface ApiHostEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  area: string | null;
  capacity: number;
  fee: number;
}
