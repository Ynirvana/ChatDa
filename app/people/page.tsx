import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { backendFetch } from '@/lib/server-api';
import { Nav } from '@/components/ui/Nav';
import { Orb } from '@/components/ui/Card';
import type { PersonData } from '@/components/PersonCard';
import PeopleClient from './PeopleClient';

export const revalidate = 60;

interface DirectoryResponse {
  users: PersonData[];
}

export default async function PeoplePage() {
  const session = await auth();
  const authed = !!session?.user?.id;

  const data = await backendFetch<DirectoryResponse>('/users/directory').catch(
    () => ({ users: [] }) as DirectoryResponse,
  );

  return (
    <div className="page-bg-light">
      <Nav user={session?.user} isAdmin={isAdminEmail(session?.user?.email)} light />
      <Orb size={500} color="rgba(255, 140, 120, .18)" top={100} left={-200} />
      <Orb size={350} color="rgba(232, 67, 147, .12)" top={300} right={-100} delay={2} />

      <section style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 20px 80px',
      }}>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          fontWeight: 900,
          letterSpacing: -1,
          marginBottom: 6,
          background: 'linear-gradient(135deg, #FF6B5B, #E84393, #6C5CE7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          People
        </h1>
        <p style={{
          fontSize: 14,
          color: 'rgba(45, 24, 16, .55)',
          marginBottom: 28,
        }}>
          See who&apos;s here in Korea
        </p>

        <PeopleClient users={data.users} authed={authed} />
      </section>
    </div>
  );
}
