import { db } from '@/db';
import { inviteTokens, users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const INVITE_COOKIE_NAME = 'chatda_invite';
export const INVITE_COOKIE_MAX_AGE = 60 * 60 * 48;  // 48 hours — matches token TTL
export const INVITE_CAP = 100;  // Invalid panel footer ("First 100 members") 용. 초대장 본문 pill은 제거됨.

export type InviteState = 'valid' | 'expired' | 'claimed' | 'not_found';

export interface InviteLookup {
  state: InviteState;
  token?: string;
  expiresAt?: Date;
  expiresText?: string;  // "Expires in 47 hours" — Date.now()를 여기서 계산 (render 바깥)
  note?: string | null;
  inviteNumber?: number;
  invitedByName?: string | null;
}

function formatTimeLeft(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(ms / 3_600_000));
  if (hours <= 0) return 'Expires soon';
  if (hours === 1) return 'Expires in 1 hour';
  if (hours <= 72) return `Expires in ${hours} hours`;
  const days = Math.ceil(hours / 24);
  return `Expires in ${days} days`;
}

export async function lookupInvite(tokenValue: string): Promise<InviteLookup> {
  if (!tokenValue || tokenValue.length > 64) return { state: 'not_found' };
  const [row] = await db
    .select({
      token: inviteTokens.token,
      inviteNumber: inviteTokens.inviteNumber,
      expiresAt: inviteTokens.expiresAt,
      claimedAt: inviteTokens.claimedAt,
      note: inviteTokens.note,
      inviterName: users.name,
    })
    .from(inviteTokens)
    .leftJoin(users, eq(users.id, inviteTokens.createdByUserId))
    .where(eq(inviteTokens.token, tokenValue))
    .limit(1);
  if (!row) return { state: 'not_found' };
  const base = {
    token: row.token,
    expiresAt: row.expiresAt,
    expiresText: formatTimeLeft(row.expiresAt),
    note: row.note,
    inviteNumber: row.inviteNumber,
    invitedByName: row.inviterName,
  };
  if (row.claimedAt) return { state: 'claimed', ...base };
  if (row.expiresAt.getTime() < Date.now()) return { state: 'expired', ...base };
  return { state: 'valid', ...base };
}

// NextAuth signIn에서 호출 — 원자적으로 unused/unexpired 토큰을 claimed로 마킹.
// 반환 true = 성공적으로 claim, false = 이미 claimed 혹은 expired (signIn 거부해야 함).
export async function claimInvite(tokenValue: string, userId: string): Promise<boolean> {
  const now = new Date();
  const result = await db
    .update(inviteTokens)
    .set({ claimedByUserId: userId, claimedAt: now })
    .where(and(
      eq(inviteTokens.token, tokenValue),
      isNull(inviteTokens.claimedAt),
    ))
    .returning({ id: inviteTokens.id, expiresAt: inviteTokens.expiresAt });
  if (result.length === 0) return false;
  const row = result[0];
  if (row.expiresAt.getTime() < now.getTime()) {
    // Race: token just expired. Roll back the claim marking.
    await db
      .update(inviteTokens)
      .set({ claimedByUserId: null, claimedAt: null })
      .where(eq(inviteTokens.id, row.id));
    return false;
  }
  return true;
}
