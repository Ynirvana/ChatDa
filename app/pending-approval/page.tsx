import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [dbUser] = await db
    .select({
      approvalStatus: users.approvalStatus,
      onboardingComplete: users.onboardingComplete,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!dbUser) redirect('/login');
  if (dbUser.approvalStatus === 'approved') redirect('/people');
  if (dbUser.approvalStatus === 'rejected') redirect('/rejected');
  if (!dbUser.onboardingComplete) redirect('/onboarding');

  async function doSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: 'linear-gradient(135deg, #FFF5E1 0%, #FFE4C2 45%, #FFD4B3 100%)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-25%', left: '-15%',
        width: 'min(80vw, 900px)', height: 'min(80vw, 900px)',
        background: 'radial-gradient(circle, rgba(255,107,91,.32) 0%, rgba(255,107,91,.12) 32%, rgba(255,107,91,0) 62%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%', right: '-18%',
        width: 'min(70vw, 720px)', height: 'min(70vw, 720px)',
        background: 'radial-gradient(circle, rgba(232,67,147,.14) 0%, rgba(232,67,147,.05) 40%, rgba(232,67,147,0) 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 640, margin: '0 auto',
        padding: '88px 24px 120px',
        textAlign: 'center',
        animation: 'fadeIn .6s ease-out',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(255,193,64,.22), rgba(255,138,92,.14))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, margin: '0 auto 32px',
          border: '1px solid rgba(255, 138, 92, .2)',
        }}>
          🧡
        </div>

        <p style={{
          fontSize: 'clamp(1rem, 2.8vw, 1.375rem)',
          fontWeight: 500,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#5C3E36',
          marginBottom: 32,
          marginTop: 0,
          lineHeight: 1,
          paddingLeft: '0.25em',
        }}>
          Welcome
        </p>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 7vw, 4rem)',
          fontWeight: 900,
          letterSpacing: '-0.045em',
          lineHeight: 1.05,
          marginBottom: 32,
          marginTop: 0,
        }}>
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, #FF6B5B 0%, #E84393 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 0 rgba(255,255,255,.5))',
          }}>
            Welcome to ChatDa.
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(1.0625rem, 2.4vw, 1.25rem)',
          color: '#5C3E36',
          fontWeight: 500,
          lineHeight: 1.65,
          marginBottom: 28,
          marginTop: 0,
        }}>
          Once you&apos;re approved, you&apos;ll connect with students, expats, creators,
          and locals — everyone sharing Korea right now.
        </p>

        <p style={{
          fontSize: 'clamp(1rem, 2.2vw, 1.125rem)',
          color: 'rgba(45, 24, 16, .72)',
          fontWeight: 500,
          lineHeight: 1.65,
          marginBottom: 40,
          marginTop: 0,
        }}>
          We review each profile personally and we&apos;ll get back to you as fast as we can.
          We&apos;ll email you at <strong>{dbUser.email}</strong> the moment you&apos;re in.
        </p>

        <p style={{
          fontSize: 'clamp(1rem, 2.2vw, 1.125rem)',
          color: '#2D1810',
          fontWeight: 700,
          marginBottom: 40,
          marginTop: 0,
        }}>
          Hang tight — thanks for joining us. 🙏
        </p>

        <Link
          href="/people"
          style={{ textDecoration: 'none', display: 'inline-block', width: '100%' }}
        >
          <button style={{
            width: '100%',
            padding: '18px 32px', borderRadius: 999,
            fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
            background: 'linear-gradient(135deg, #FF6B5B 0%, #E84393 100%)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: [
              '0 16px 40px rgba(255, 107, 91, .34)',
              '0 4px 12px rgba(232, 67, 147, .22)',
              'inset 0 1px 0 rgba(255, 255, 255, .3)',
            ].join(', '),
          }}>
            Peek at who&apos;s here →
          </button>
        </Link>

        <p style={{
          fontSize: 13,
          color: 'rgba(45, 24, 16, .5)',
          marginTop: 14,
          lineHeight: 1.5,
          margin: '14px 0 0',
        }}>
          Full access unlocks after approval.
        </p>

        <form action={doSignOut} style={{ marginTop: 44 }}>
          <button type="submit" style={{
            background: 'none', border: 'none', padding: 0,
            fontSize: 14,
            color: 'rgba(45, 24, 16, .5)',
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'inherit',
          }}>
            Log out
          </button>
        </form>
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
