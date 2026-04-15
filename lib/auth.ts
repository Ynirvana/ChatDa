import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email!))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values({
          id: nanoid(),
          name: user.name ?? 'Chatda User',
          email: user.email!,
          googleId: account.providerAccountId,
          profileImage: user.image ?? null,
        });
      }

      return true;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        // Always pull latest profile_image from DB so Nav reflects user changes
        const [dbUser] = await db
          .select({ profileImage: users.profileImage })
          .from(users)
          .where(eq(users.id, token.sub))
          .limit(1);
        if (dbUser?.profileImage) session.user.image = dbUser.profileImage;
      }
      return session;
    },

    async jwt({ token, user, account }) {
      if (user && account) {
        // First sign in — load our DB user id
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);
        if (dbUser) token.sub = dbUser.id;
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      // After sign in, check if onboarding is done
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
});
