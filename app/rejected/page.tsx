import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { db } from '@/db';
import { users, approvalHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function RejectedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [dbUser] = await db
    .select({
      approvalStatus: users.approvalStatus,
      rejectionReason: users.rejectionReason,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!dbUser) redirect('/login');
  if (dbUser.approvalStatus === 'approved') redirect('/people');
  if (dbUser.approvalStatus === 'pending') redirect('/pending-approval');

  async function doSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  async function doReapply() {
    'use server';
    const s = await auth();
    if (!s?.user?.id) redirect('/login');
    const userId = s.user.id;
    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ approvalStatus: 'pending', rejectionReason: null, rejectedAt: null })
        .where(eq(users.id, userId));
      await tx.insert(approvalHistory).values({
        userId,
        action: 'resubmitted',
        actorEmail: s.user.email ?? null,
      });
    });
    redirect('/pending-approval');
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
        background: 'radial-gradient(circle, rgba(255,107,91,.22) 0%, rgba(255,107,91,.08) 32%, rgba(255,107,91,0) 62%)',
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
          background: 'linear-gradient(135deg, rgba(45, 24, 16, .1), rgba(45, 24, 16, .04))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, margin: '0 auto 32px',
          border: '1px solid rgba(45, 24, 16, .1)',
        }}>
          🥀
        </div>

        <p style={{
          fontSize: 'clamp(1rem, 2.8vw, 1.375rem)',
          fontWeight: 500,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#5C3E36',
          marginBottom: 36,
          marginTop: 0,
          lineHeight: 1,
          paddingLeft: '0.25em',
        }}>
          Application update
        </p>

        <h1 style={{
          fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.08,
          marginBottom: 24,
          marginTop: 0,
          color: '#2D1810',
        }}>
          Not this time.
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.2vw, 1.125rem)',
          color: '#5C3E36',
          fontWeight: 500,
          lineHeight: 1.6,
          marginBottom: 32,
          marginTop: 0,
        }}>
          Your application wasn&apos;t approved this round.
        </p>

        {dbUser.rejectionReason && (
          <div style={{
            background: 'rgba(255, 255, 255, .6)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 32,
            border: '1px solid rgba(45, 24, 16, .08)',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(45, 24, 16, .55)',
              marginBottom: 10,
              marginTop: 0,
            }}>
              Reason from the team
            </p>
            <p style={{
              fontSize: 15,
              color: '#2D1810',
              lineHeight: 1.55,
              margin: 0,
              whiteSpace: 'pre-line',
            }}>
              {dbUser.rejectionReason}
            </p>
          </div>
        )}

        <p style={{
          fontSize: 14,
          color: 'rgba(45, 24, 16, .62)',
          lineHeight: 1.55,
          marginBottom: 28,
        }}>
          Update your profile (Step 1 or Step 2) before re-applying to improve your chances.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/onboarding?edit=1" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              padding: '16px 28px', borderRadius: 999,
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              background: 'rgba(255, 255, 255, .7)',
              color: '#2D1810',
              border: '1px solid rgba(45, 24, 16, .18)',
              cursor: 'pointer',
            }}>
              Edit my profile
            </button>
          </Link>

          <form action={doReapply}>
            <button type="submit" style={{
              width: '100%',
              padding: '18px 32px', borderRadius: 999,
              fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
              background: 'linear-gradient(135deg, #FF6B5B 0%, #E84393 100%)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: [
                '0 16px 40px rgba(255, 107, 91, .3)',
                '0 4px 12px rgba(232, 67, 147, .2)',
                'inset 0 1px 0 rgba(255, 255, 255, .28)',
              ].join(', '),
            }}>
              Re-apply →
            </button>
          </form>
        </div>

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
