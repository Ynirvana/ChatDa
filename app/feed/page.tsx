import { auth } from '@/lib/auth';
import { Nav } from '@/components/ui/Nav';
import { Orb } from '@/components/ui/Card';
import { backendFetch } from '@/lib/server-api';
import { FeedClient } from '@/components/feed/FeedClient';
import type { Post } from '@/components/feed/PostCard';

export const revalidate = 0;

export default async function FeedPage() {
  const session = await auth();

  let posts: Post[] = [];
  try {
    posts = await backendFetch<Post[]>('/feed/posts');
  } catch {}

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Nav user={session?.user} />
      <Orb size={400} color="rgba(232,67,147,.2)" top={-50} right={-100} />
      <Orb size={300} color="rgba(108,92,231,.2)" bottom={200} left={-80} delay={2} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>Feed</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.5)', marginBottom: 28 }}>
          What's on your mind?
        </p>

        <FeedClient
          initialPosts={posts}
          currentUserId={session?.user?.id ?? undefined}
        />
      </div>
    </div>
  );
}
