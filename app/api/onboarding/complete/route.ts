import { proxyToBackend } from '@/lib/proxy';

interface Body {
  name: string;
  nationality: string;
  location?: string;
  status?: string;
  lookingFor?: string[];
  bio?: string;
  profileImage?: string;
  socialLinks: { platform: string; url: string }[];
}

export async function POST(req: Request) {
  const body = await req.json() as Body;
  const { name, nationality, location, status, lookingFor, bio, profileImage, socialLinks } = body;

  if (!name?.trim() || !nationality || !location || !status) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!lookingFor || lookingFor.length === 0 || lookingFor.length > 3) {
    return Response.json({ error: 'Pick 1–3 things that bring you here' }, { status: 400 });
  }

  return proxyToBackend(req, '/users/onboarding', 'POST', {
    name,
    nationality,
    location,
    status,
    looking_for: lookingFor,
    bio: bio ?? null,
    profile_image: profileImage ?? null,
    social_links: socialLinks ?? [],
  });
}
