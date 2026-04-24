import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users, bannedEmails, approvalHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { isAdminEmail } from '@/lib/admin';
import { INVITE_COOKIE_NAME, claimInvite } from '@/lib/invites';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false;
      if (!user.email) return false;

      const email = user.email.toLowerCase();

      // Banned email? Block login before any DB write.
      const [banned] = await db
        .select({ email: bannedEmails.email })
        .from(bannedEmails)
        .where(eq(bannedEmails.email, email))
        .limit(1);
      if (banned) return false;

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email!))
        .limit(1);

      if (existing.length > 0) return true;  // 기존 유저 재로그인은 그대로 통과

      // 신규 유저 — 3갈래 분기
      const newUserId = nanoid();
      const cookieStore = await cookies();
      const tokenValue = cookieStore.get(INVITE_COOKIE_NAME)?.value;
      const isAdmin = isAdminEmail(email);

      // (1) Admin 화이트리스트 → 즉시 approved
      if (isAdmin) {
        await db.insert(users).values({
          id: newUserId,
          name: user.name ?? 'Chatda User',
          email: user.email!,
          googleId: account.providerAccountId,
          profileImage: null,
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedBy: 'system-admin',
        });
        await db.insert(approvalHistory).values({
          userId: newUserId,
          action: 'approved',
          actorEmail: 'system-admin',
        });
        return true;
      }

      // (2) Invite cookie 있음 → claim 성공 시 approved
      if (tokenValue) {
        await db.insert(users).values({
          id: newUserId,
          name: user.name ?? 'Chatda User',
          email: user.email!,
          googleId: account.providerAccountId,
          profileImage: null,
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedBy: 'system-invite',
        });
        const claimed = await claimInvite(tokenValue, newUserId);
        if (!claimed) {
          await db.delete(users).where(eq(users.id, newUserId));
          return false;
        }
        await db.insert(approvalHistory).values({
          userId: newUserId,
          action: 'approved',
          actorEmail: 'system-invite',
        });
        return true;
      }

      // (3) 초대/어드민 없음 → pending 상태로 가입 허용. 'submitted' history는 온보딩 완료 시점에 기록됨.
      await db.insert(users).values({
        id: newUserId,
        name: user.name ?? 'Chatda User',
        email: user.email!,
        googleId: account.providerAccountId,
        profileImage: null,
        // approvalStatus default = 'pending'
      });
      return true;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        // Pull latest from DB so승인 즉시 세션 반영 + Nav 아바타 최신화
        const [dbUser] = await db
          .select({
            profileImage: users.profileImage,
            approvalStatus: users.approvalStatus,
            onboardingComplete: users.onboardingComplete,
          })
          .from(users)
          .where(eq(users.id, token.sub))
          .limit(1);
        if (dbUser?.profileImage) session.user.image = dbUser.profileImage;
        if (dbUser) {
          session.user.approvalStatus = dbUser.approvalStatus as 'pending' | 'approved' | 'rejected';
          session.user.onboardingComplete = dbUser.onboardingComplete ?? false;
        }
      }
      return session;
    },

    async jwt({ token, user, account, trigger }) {
      if (user && account) {
        // First sign in — load our DB user id + approval status
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);
        if (dbUser) {
          token.sub = dbUser.id;
          token.approvalStatus = dbUser.approvalStatus as 'pending' | 'approved' | 'rejected';
          token.onboardingComplete = dbUser.onboardingComplete ?? false;
        }
      } else if (trigger === 'update' && token.sub) {
        // Client가 session.update() 호출 시 (온보딩 완료/승인 직후) DB 최신값으로 JWT refresh
        const [dbUser] = await db
          .select({
            approvalStatus: users.approvalStatus,
            onboardingComplete: users.onboardingComplete,
          })
          .from(users)
          .where(eq(users.id, token.sub))
          .limit(1);
        if (dbUser) {
          token.approvalStatus = dbUser.approvalStatus as 'pending' | 'approved' | 'rejected';
          token.onboardingComplete = dbUser.onboardingComplete ?? false;
        }
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      // Relative callback URL (e.g., "/onboarding" from signIn redirectTo) → absolute
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Absolute same-origin URL
      if (url.startsWith(baseUrl)) return url;
      // Everything else → home
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
    error: '/login',  // signIn=false(초대 없는 신규 가입 시도 등)면 /login?error=AccessDenied로 리다이렉트
  },
});
