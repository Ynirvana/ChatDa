import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { Nav } from '@/components/ui/Nav';
import { Orb } from '@/components/ui/Card';
import { CreateEventForm } from '@/components/host/CreateEventForm';

export default async function HostPage() {
  const session = await auth();

  if (!session?.user?.id) redirect('/login');

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <Nav user={session.user} isAdmin={isAdminEmail(session.user.email)} light={false} />
      <Orb size={400} color="rgba(232,67,147,.2)" top={-50} right={-100} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
        <Link href="/meetups" style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
          ← Meetups
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, marginBottom: 4 }}>Host a Meetup</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', marginBottom: 28 }}>
          Create an event and start reviewing requests.
        </p>

        <CreateEventForm />
      </div>
    </div>
  );
}
