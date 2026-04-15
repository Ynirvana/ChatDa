import { proxyToBackend } from '@/lib/proxy';

interface Body {
  name: string;
  nationality: string;
  status?: string;
  bio?: string;
  profileImage?: string;
  socialLinks: { platform: string; url: string }[];
}

export async function POST(req: Request) {
  const body = await req.json() as Body;
  const { name, nationality, status, bio, profileImage, socialLinks } = body;

  if (!name?.trim() || !nationality) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  return proxyToBackend(req, '/users/onboarding', 'POST', {
    name,
    nationality,
    status: status ?? null,
    bio: bio ?? null,
    profile_image: profileImage ?? null,
    social_links: socialLinks ?? [],
  });
}
