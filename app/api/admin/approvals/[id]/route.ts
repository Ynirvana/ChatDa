import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { db } from '@/db';
import { users, approvalHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface Body {
  action: 'approve' | 'reject';
  reason?: string;   // reject일 때만 사용
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const adminEmail = session!.user!.email!;

  const { id } = await params;
  const body = (await req.json()) as Body;

  if (body.action !== 'approve' && body.action !== 'reject') {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }
  if (body.action === 'reject' && !body.reason?.trim()) {
    return Response.json({ error: 'Rejection reason required' }, { status: 400 });
  }

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return Response.json({ error: 'User not found' }, { status: 404 });
  if (target.approvalStatus !== 'pending') {
    return Response.json({ error: `User is ${target.approvalStatus}, not pending` }, { status: 409 });
  }

  const now = new Date();
  if (body.action === 'approve') {
    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({
          approvalStatus: 'approved',
          approvedAt: now,
          approvedBy: adminEmail,
          rejectionReason: null,
          rejectedAt: null,
        })
        .where(eq(users.id, id));
      await tx.insert(approvalHistory).values({
        userId: id,
        action: 'approved',
        actorEmail: adminEmail,
      });
    });
    // TODO Phase 2: sendApprovedEmail(target.email, target.name)
    return Response.json({ ok: true, status: 'approved' });
  }

  // reject
  const reason = body.reason!.trim();
  await db.transaction(async (tx) => {
    await tx.update(users)
      .set({
        approvalStatus: 'rejected',
        rejectedAt: now,
        rejectionReason: reason,
        approvedAt: null,
        approvedBy: null,
      })
      .where(eq(users.id, id));
    await tx.insert(approvalHistory).values({
      userId: id,
      action: 'rejected',
      reason,
      actorEmail: adminEmail,
    });
  });
  // TODO Phase 2: sendRejectedEmail(target.email, target.name, reason)
  return Response.json({ ok: true, status: 'rejected' });
}
