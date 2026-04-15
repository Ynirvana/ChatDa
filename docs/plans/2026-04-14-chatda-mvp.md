# ChatDa MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build chatda.life MVP — social platform for foreigners in Korea with Google OAuth, profile + social media links, and host-approval RSVP.

**Architecture:** Next.js App Router (Node.js runtime) + PostgreSQL, Docker Compose로 묶어서 배포. Cloudflare는 앞단 DNS + HTTPS 프록시만. No OTP verification — track is self-reported. RSVP is a host-approval flow, not payment-gated.

**Tech Stack:** Next.js 14+ (App Router), Tailwind CSS, TypeScript, PostgreSQL, Drizzle ORM (`drizzle-orm/postgres-js`), NextAuth.js v5, Docker Compose, nanoid

**⚠️ `export const runtime = 'edge'` 절대 쓰지 마 — Node.js 런타임.**

> **⚠️ DESIGN RULE — READ BEFORE WRITING ANY UI CODE:**
> 디자인은 `docs/ChatDa_MVP.jsx` 파일의 스타일을 따라가. 다크 테마 + 그라디언트 히어로 + 글래스모피즘 카드 + Plus Jakarta Sans 폰트. 구현 플랜의 Tailwind 클래스는 로직 참고용이고, 비주얼은 JSX 목업이 기준.
>
> Concretely:
> - **Background:** `bg-black` + subtle gradient orbs (CSS radial-gradient, not solid black)
> - **Cards:** `backdrop-blur-md bg-white/5 border border-white/10` glass effect, not opaque
> - **Hero:** large gradient text or gradient background section
> - **Buttons:** gradient fills (`from-orange-500 to-pink-500`) or glass variants — not flat solid colors
> - **Font:** Plus Jakarta Sans (already in layout.tsx) — weights 400–900, tight tracking on headings
> - **Color tokens:** use the CSS variables pattern from the JSX (`--clr-orange`, `--clr-pink`, `--clr-purple`, `--clr-blue`) or equivalent Tailwind gradient classes
> - When in doubt, open `docs/ChatDa_MVP.jsx` and match the component visually.

---

## MVP Scope

**Included:**
- Landing page
- Google OAuth + email magic link fallback
- Onboarding: track self-report (Student/Local/Traveler) + social media links + profile info
- Events list
- Event detail with attendee profiles (chatda's core differentiator)
- RSVP = "Request to join" → host sees applicant's full profile + social links → approve / reject
- My profile page
- Host panel — create events, approve/reject RSVP requests

**Explicitly excluded (Phase 2+):**
- OTP email/SMS verification
- Integrated payment
- Chat / DM
- Community Q&A
- Social media OAuth (URL input only)
- Job postings, business pages, push notifications

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- Create: `docker-compose.yml`, `Dockerfile`
- Create: `.env.local`, `.env.example`

**Step 1: Initialize Next.js**
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Step 2: Install deps**
```bash
npm install next-auth@beta @auth/core
npm install drizzle-orm drizzle-kit postgres
npm install nanoid
npm install -D @types/pg
```

**Step 3: docker-compose.yml**
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: chatda
      POSTGRES_PASSWORD: chatda
      POSTGRES_DB: chatda
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://chatda:chatda@db:5432/chatda
    depends_on:
      - db
    env_file:
      - .env.local

volumes:
  postgres_data:
```

**Step 4: Dockerfile**
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Step 5: next.config.ts**
```ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',  // Docker 빌드용
};
export default nextConfig;
```

**Step 6: Create .env.example**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
HOST_EMAIL=
DATABASE_URL=postgresql://chatda:chatda@localhost:5432/chatda
```

**Step 7: Add font to app/layout.tsx**
```tsx
import { Plus_Jakarta_Sans } from 'next/font/google';
const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] });
```

**Step 8: Commit**
```bash
git add .
git commit -m "feat: initialize Next.js + PostgreSQL + Docker Compose"
```

---

## Task 2: Database Schema

**Files:**
- Create: `db/schema.ts`
- Create: `db/index.ts`
- Create: `drizzle.config.ts`

**Step 1: Write schema**
```ts
// db/schema.ts
import { pgTable, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// MVP 단순화: track(Student/Local/Traveler) 제거, format(eats/nights) 제거
export const platformEnum = pgEnum('platform', ['linkedin', 'instagram', 'x', 'tiktok']);
export const rsvpStatusEnum = pgEnum('rsvp_status', ['pending', 'approved', 'rejected', 'cancelled']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),                          // nanoid
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  googleId: text('google_id').unique(),
  nationality: text('nationality'),
  bio: text('bio'),
  profileImage: text('profile_image'),                   // Google photo URL (MVP)
  onboardingComplete: boolean('onboarding_complete').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const socialLinks = pgTable('social_links', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDeleteAction: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  url: text('url').notNull(),
});

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  // format(eats/nights) 제거 — 모임 성격은 제목에서 드러남
  date: text('date').notNull(),                          // YYYY-MM-DD
  time: text('time').notNull(),                          // HH:MM
  location: text('location').notNull(),
  locationMapUrl: text('location_map_url'),
  capacity: integer('capacity').notNull(),
  fee: integer('fee').notNull(),                         // KRW, display only
  description: text('description'),
  hostId: text('host_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// RSVP = request to join. Host approves/rejects.
export const rsvps = sqliteTable('rsvps', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'cancelled'] }).notNull().default('pending'),
  message: text('message'),                              // optional note from applicant
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**Step 2: DB client**
```ts
// db/index.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

```ts
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Step 3: PostgreSQL 실행 + 마이그레이션**
```bash
docker compose up -d db          # PostgreSQL만 먼저 실행
npx drizzle-kit generate         # 마이그레이션 파일 생성
npx drizzle-kit migrate          # DB에 적용
```

**Step 4: Commit**
```bash
git add db/ drizzle/ drizzle.config.ts
git commit -m "feat: PostgreSQL schema — Users, SocialLinks, Events, RSVPs"
```

---

## Task 3: Design System Components

**Files:**
- Modify: `tailwind.config.ts`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Nav.tsx`

**Step 1: Tailwind design tokens**
```ts
// tailwind.config.ts — theme.extend
colors: {
  'track-student': '#3B82F6',
  'track-local': '#22C55E',
  'track-traveler': '#A855F7',
  'format-eats': '#F97316',
  'format-nights': '#3B82F6',
},
fontFamily: {
  sans: ['Plus Jakarta Sans', 'sans-serif'],
},
```

**Step 2: Button**
```tsx
// components/ui/Button.tsx
type Variant = 'primary' | 'ghost' | 'outline';

export function Button({
  children, variant = 'primary', className = '', ...props
}: { children: React.ReactNode; variant?: Variant; className?: string }
  & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-30';
  const styles: Record<Variant, string> = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600',
    ghost:   'bg-transparent text-white hover:bg-white/10',
    outline: 'border border-white/20 text-white hover:bg-white/10',
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props}>{children}</button>;
}
```

**Step 3: Badges**
```tsx
// components/ui/Badge.tsx
export type Track = 'student' | 'local' | 'traveler';
export type Format = 'eats' | 'nights';

const trackConfig: Record<Track, { label: string; color: string }> = {
  student:  { label: 'Student',  color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  local:    { label: 'Local',    color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  traveler: { label: 'Traveler', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
};

const formatConfig: Record<Format, { label: string; color: string }> = {
  eats:   { label: 'chatda eats',   color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  nights: { label: 'chatda nights', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
};

export function TrackBadge({ track }: { track: Track }) {
  const { label, color } = trackConfig[track];
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>{label}</span>;
}

export function FormatBadge({ format }: { format: Format }) {
  const { label, color } = formatConfig[format];
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>{label}</span>;
}
```

**Step 4: Card**
```tsx
// components/ui/Card.tsx
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}
```

**Step 5: Nav**
```tsx
// components/ui/Nav.tsx
import Link from 'next/link';

export function Nav({ user }: { user?: { name?: string | null; image?: string | null } | null }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur-md border-b border-white/10">
      <Link href="/" className="font-black text-xl text-white tracking-tight">chatda</Link>
      <div className="flex items-center gap-3">
        {user ? (
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80">
            {user.image && <img src={user.image} alt="" className="w-8 h-8 rounded-full" />}
            <span className="text-sm text-white/70 hidden sm:block">{user.name}</span>
          </Link>
        ) : (
          <Link href="/login" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600">
            Join chatda
          </Link>
        )}
      </div>
    </nav>
  );
}
```

**Step 6: Commit**
```bash
git add components/ tailwind.config.ts
git commit -m "feat: design system — Button, Badge, Card, Nav"
```

---

## Task 4: Google OAuth + Email Fallback Auth

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/(auth)/login/page.tsx`

**Step 1: NextAuth config**
```ts
// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
});
```

**Step 2: Route handler**
```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

**Step 3: Login page**
```tsx
// app/(auth)/login/page.tsx
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-black text-white mb-2 text-center">Join chatda</h1>
        <p className="text-white/40 text-sm mb-10 text-center">Find your people in Korea</p>

        <form action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/onboarding' });
        }}>
          <button type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-semibold mb-4 hover:bg-white/90">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-white/20 text-xs text-center mt-8">
          By continuing, you agree to our Terms & Community Guidelines
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Manual test**
```
npx wrangler pages dev --local
Visit http://localhost:3000/login → Google OAuth → /onboarding
```

**Step 5: Commit**
```bash
git add lib/auth.ts app/api/auth/ app/(auth)/
git commit -m "feat: Google OAuth + email magic link auth"
```

---

## Task 5: Onboarding — Profile + Social Links

One combined page. No track selection — just name, nationality, bio, social links.

**Files:**
- Create: `app/(onboarding)/onboarding/page.tsx`
- Create: `app/api/onboarding/complete/route.ts`
- Create: `lib/constants.ts`

**Step 1: Constants**
```ts
// lib/constants.ts
export const INTERESTS = [
  'Startup', 'Tech', 'Design', 'Food', 'Travel',
  'Language', 'Culture', 'Sports', 'Art', 'Music', 'Finance',
] as const;

export const NATIONALITIES = [
  'Korean', 'American', 'British', 'French', 'German', 'Italian',
  'Japanese', 'Chinese', 'Vietnamese', 'Thai', 'Australian',
  'Canadian', 'Brazilian', 'Indian', 'Spanish', 'Dutch', 'Swedish',
  'Uzbek', 'Filipino', 'Indonesian', 'Other',
] as const;

export const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',    placeholder: 'linkedin.com/in/yourname' },
  { id: 'instagram', label: 'Instagram',   placeholder: 'instagram.com/yourname' },
  { id: 'x',         label: 'X (Twitter)', placeholder: 'x.com/yourname' },
  { id: 'tiktok',    label: 'TikTok',      placeholder: 'tiktok.com/@yourname' },
] as const;
```

**Step 2: Onboarding page (single page, multi-section)**
```tsx
// app/(onboarding)/onboarding/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { INTERESTS, NATIONALITIES, PLATFORMS } from '@/lib/constants';

const tracks = [
  { id: 'student',  label: 'Student',  desc: 'Studying at a Korean university', icon: '🎓' },
  { id: 'local',    label: 'Local',    desc: 'Korean resident', icon: '🏠' },
  { id: 'traveler', label: 'Traveler', desc: 'Visiting or staying in Korea', icon: '✈️' },
] as const;

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: session?.user?.name || '',
    nationality: '',
    bio: '',
    socialLinks: {} as Record<string, string>,
  });

  const setField = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  const filledLinks = Object.values(form.socialLinks).filter(Boolean).length;

  // track 제거 — 국적 + 소셜링크로 충분
  const canSubmit = form.name && form.nationality && filledLinks >= 1;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const links = Object.entries(form.socialLinks)
      .filter(([, url]) => url)
      .map(([platform, url]) => ({ platform, url }));

    await fetch('/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ ...form, socialLinks: links }),
      headers: { 'Content-Type': 'application/json' },
    });

    router.push('/events');
  };

  return (
    <div className="min-h-screen bg-black pt-20 px-6 pb-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-black text-white mb-1">Set up your profile</h1>
        <p className="text-white/40 text-sm mb-10">
          Your profile is visible to other members before meetups.
        </p>

        {/* Profile photo */}
        {session?.user?.image && (
          <div className="flex justify-center mb-8">
            <img src={session.user.image} alt="" className="w-20 h-20 rounded-full ring-2 ring-orange-500/40" />
          </div>
        )}

        <div className="flex flex-col gap-6">

          {/* Basic info */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Display name *</label>
            <input value={form.name} onChange={e => setField('name', e.target.value)}
              placeholder="Your name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30" />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Nationality *</label>
            <select value={form.nationality} onChange={e => setField('nationality', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white">
              <option value="">Select nationality</option>
              {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">One-liner bio <span className="text-white/20">({form.bio.length}/100)</span></label>
            <input value={form.bio} onChange={e => setField('bio', e.target.value.slice(0, 100))}
              placeholder="French startup founder in Seoul"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30" />
          </div>

          {/* Social media links — 1+ required */}
          <div>
            <label className="text-xs text-white/50 mb-1 block">
              Social media links * <span className="text-white/30">(at least 1)</span>
            </label>
            <p className="text-xs text-white/30 mb-3">
              Shown to other members so they know who's coming.
            </p>
            <div className="flex flex-col gap-3">
              {PLATFORMS.map(p => (
                <div key={p.id}>
                  <label className="text-xs text-white/40 mb-1 block">{p.label}</label>
                  <input
                    value={form.socialLinks[p.id] || ''}
                    onChange={e => setField('socialLinks', { ...form.socialLinks, [p.id]: e.target.value })}
                    placeholder={p.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:border-orange-500/50 outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Interests — optional */}
          <div>
            <label className="text-xs text-white/50 mb-2 block">Interests <span className="text-white/30">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button key={i} type="button" onClick={() => toggleInterest(i)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.interests.includes(i)
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-white/20 text-white/50 hover:border-white/40'
                  }`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={!canSubmit || loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-30 hover:bg-orange-600 mt-2">
            {loading ? 'Setting up...' : 'Join chatda →'}
          </button>

          {!canSubmit && (
            <p className="text-white/30 text-xs text-center -mt-2">
              Fill in name, nationality, track, and at least 1 social link
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Onboarding complete API**
```ts
// app/api/onboarding/complete/route.ts
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { users, socialLinks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, nationality, track, bio, interests, socialLinks: links } =
    await req.json() as {
      name: string;
      nationality: string;
      track: 'student' | 'traveler' | 'local';
      bio: string;
      interests: string[];
      socialLinks: { platform: string; url: string }[];
    };

  const { db } = await import('@/db');

  await db.update(users).set({
    name,
    nationality,
    track,
    bio,
    interests: JSON.stringify(interests),
    profileImage: session.user.image ?? null,
    onboardingComplete: true,
  }).where(eq(users.id, session.user.id));

  for (const { platform, url } of links) {
    await db.insert(socialLinks).values({
      id: nanoid(),
      userId: session.user.id,
      platform: platform as any,
      url,
    }).onConflictDoNothing();
  }

  return Response.json({ ok: true });
}
```

**Step 4: Commit**
```bash
git add app/(onboarding)/ app/api/onboarding/ lib/constants.ts
git commit -m "feat: onboarding — profile, track (self-reported), social links"
```

---

## Task 6: Events List

**Files:**
- Create: `app/(main)/events/page.tsx`
- Create: `app/api/events/route.ts`
- Create: `components/EventCard.tsx`

**Step 1: EventCard**
```tsx
// components/EventCard.tsx
import Link from 'next/link';
import { FormatBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export interface EventSummary {
  id: string;
  title: string;
  format: 'eats' | 'nights';
  date: string;
  time: string;
  location: string;
  capacity: number;
  fee: number;
  approvedCount: number;
}

export function EventCard({ event }: { event: EventSummary }) {
  const spotsLeft = event.capacity - event.approvedCount;
  const dateObj = new Date(`${event.date}T${event.time}`);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="hover:border-white/20 transition-colors cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <FormatBadge format={event.format} />
          <span className={`text-xs ${spotsLeft <= 3 ? 'text-orange-400' : 'text-white/30'}`}>
            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
          </span>
        </div>
        <h3 className="font-bold text-white text-lg mb-2 group-hover:text-orange-400 transition-colors">
          {event.title}
        </h3>
        <div className="text-white/50 text-sm space-y-1">
          <p>{dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.time}</p>
          <p>{event.location}</p>
          <p className="text-orange-400 font-semibold mt-1">₩{event.fee.toLocaleString()}</p>
        </div>
      </Card>
    </Link>
  );
}
```

**Step 2: Events API**
```ts
// app/api/events/route.ts
import { getDb } from '@/db';
import { events, rsvps } from '@/db/schema';
import { gte, eq, and, sql } from 'drizzle-orm';

export async function GET() {
  const { db } = await import('@/db');
  const today = new Date().toISOString().split('T')[0];

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      format: events.format,
      date: events.date,
      time: events.time,
      location: events.location,
      capacity: events.capacity,
      fee: events.fee,
      approvedCount: sql<number>`count(${rsvps.id})`.as('approved_count'),
    })
    .from(events)
    .leftJoin(rsvps, and(eq(events.id, rsvps.eventId), eq(rsvps.status, 'approved')))
    .where(gte(events.date, today))
    .groupBy(events.id)
    .orderBy(events.date, events.time);

  return Response.json(rows);
}
```

**Step 3: Events page**
```tsx
// app/(main)/events/page.tsx
import { Nav } from '@/components/ui/Nav';
import { EventCard, type EventSummary } from '@/components/EventCard';
import { auth } from '@/lib/auth';

export const revalidate = 60;

export default async function EventsPage() {
  const session = await auth();
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/events`, { next: { revalidate: 60 } });
  const events: EventSummary[] = await res.json();

  return (
    <div className="min-h-screen bg-black">
      <Nav user={session?.user} />
      <div className="max-w-2xl mx-auto pt-24 px-6 pb-12">
        <h1 className="text-3xl font-black text-white mb-2">Upcoming meetups</h1>
        <p className="text-white/40 text-sm mb-8">Safe. Verified. Delicious.</p>

        {events.length === 0 ? (
          <p className="text-white/30 text-center py-16">First event dropping soon!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Commit**
```bash
git add app/(main)/events/ app/api/events/ components/EventCard.tsx
git commit -m "feat: events list"
```

---

## Task 7: Event Detail + Attendee Profiles

**Files:**
- Create: `app/(main)/events/[id]/page.tsx`
- Create: `app/api/events/[id]/route.ts`
- Create: `components/AttendeeCard.tsx`

**Step 1: AttendeeCard — core chatda differentiator**
```tsx
// components/AttendeeCard.tsx
import { TrackBadge, type Track } from '@/components/ui/Badge';

export interface Attendee {
  id: string;
  name: string;
  nationality: string;
  track: Track;
  bio: string | null;
  profileImage: string | null;
  socialLinks: { platform: string; url: string }[];
}

export function AttendeeCard({ attendee }: { attendee: Attendee }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
      {attendee.profileImage ? (
        <img src={attendee.profileImage} alt="" className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-white text-sm">{attendee.name}</span>
          <TrackBadge track={attendee.track} />
        </div>
        <p className="text-xs text-white/40">{attendee.nationality}</p>
        {attendee.bio && <p className="text-xs text-white/60 mt-1 line-clamp-1">{attendee.bio}</p>}
        {attendee.socialLinks.length > 0 && (
          <div className="flex gap-3 mt-2">
            {attendee.socialLinks.map(link => (
              <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-white/30 hover:text-orange-400 transition-colors capitalize">
                {link.platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Event detail API**
```ts
// app/api/events/[id]/route.ts
import { getDb } from '@/db';
import { events, rsvps, users, socialLinks } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { db } = await import('@/db');

  const [event] = await db.select().from(events).where(eq(events.id, params.id));
  if (!event) return Response.json({ error: 'Not found' }, { status: 404 });

  // Approved attendees with profiles
  const attendees = await db
    .select({
      id: users.id,
      name: users.name,
      nationality: users.nationality,
      track: users.track,
      bio: users.bio,
      profileImage: users.profileImage,
    })
    .from(rsvps)
    .innerJoin(users, eq(rsvps.userId, users.id))
    .where(and(eq(rsvps.eventId, params.id), eq(rsvps.status, 'approved')));

  const attendeeIds = attendees.map(a => a.id);
  const links = attendeeIds.length > 0
    ? await db.select().from(socialLinks).where(inArray(socialLinks.userId, attendeeIds))
    : [];

  const attendeesWithLinks = attendees.map(a => ({
    ...a,
    socialLinks: links.filter(l => l.userId === a.id).map(l => ({ platform: l.platform, url: l.url })),
  }));

  const [{ approvedCount }] = await db
    .select({ approvedCount: sql<number>`count(*)` })
    .from(rsvps)
    .where(and(eq(rsvps.eventId, params.id), eq(rsvps.status, 'approved')));

  return Response.json({ event: { ...event, approvedCount }, attendees: attendeesWithLinks });
}
```

**Step 3: Event detail page**
```tsx
// app/(main)/events/[id]/page.tsx
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Nav } from '@/components/ui/Nav';
import { FormatBadge } from '@/components/ui/Badge';
import { AttendeeCard, type Attendee } from '@/components/AttendeeCard';
import { RsvpButton } from '@/components/RsvpButton';

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/events/${params.id}`);
  if (!res.ok) notFound();

  const { event, attendees } = await res.json() as { event: any; attendees: Attendee[] };
  const spotsLeft = event.capacity - event.approvedCount;
  const dateObj = new Date(`${event.date}T${event.time}`);

  return (
    <div className="min-h-screen bg-black">
      <Nav user={session?.user} />
      <div className="max-w-2xl mx-auto pt-24 px-6 pb-32">

        <div className="mb-8">
          <FormatBadge format={event.format} />
          <h1 className="text-3xl font-black text-white mt-3 mb-3">{event.title}</h1>
          <div className="space-y-1 text-white/50 text-sm">
            <p>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {event.time}</p>
            <p>{event.location}</p>
            {event.locationMapUrl && (
              <a href={event.locationMapUrl} target="_blank" rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 text-xs inline-block">
                View on map →
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-2xl font-black text-orange-400">₩{event.fee.toLocaleString()}</span>
            <span className="text-white/30 text-sm">{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</span>
          </div>
        </div>

        {event.description && (
          <p className="text-white/60 text-sm mb-8 leading-relaxed">{event.description}</p>
        )}

        {/* Attendee profiles — chatda's key differentiator vs open chat rooms */}
        <div className="mb-8">
          <h2 className="font-bold text-white mb-1">Who's going</h2>
          <p className="text-xs text-white/30 mb-4">
            {event.approvedCount}/{event.capacity} approved · see profiles before you apply
          </p>

          {session ? (
            attendees.length === 0
              ? <p className="text-white/30 text-sm py-6 text-center">Be the first to apply!</p>
              : <div className="flex flex-col gap-3">
                  {attendees.map(a => <AttendeeCard key={a.id} attendee={a} />)}
                </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-white/60 text-sm mb-4">Sign in to see who's going</p>
              <a href="/login" className="inline-block bg-orange-500 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-orange-600">
                Join chatda
              </a>
            </div>
          )}
        </div>
      </div>

      {session && spotsLeft > 0 && (
        <RsvpButton eventId={event.id} fee={event.fee} />
      )}
      {spotsLeft === 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/90 border-t border-white/10 text-center">
          <p className="text-white/40 font-semibold">This event is full</p>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Commit**
```bash
git add app/(main)/events/[id]/ app/api/events/[id]/ components/AttendeeCard.tsx
git commit -m "feat: event detail with attendee profiles"
```

---

## Task 8: RSVP — Host Approval Flow

**Files:**
- Create: `components/RsvpButton.tsx`
- Create: `app/api/rsvp/route.ts`

**Step 1: RsvpButton**

User clicks → writes optional message → submitted as "pending" → host reviews and approves.

```tsx
// components/RsvpButton.tsx
'use client';
import { useState } from 'react';

type State = 'idle' | 'form' | 'loading' | 'done' | 'error' | 'already';

export function RsvpButton({ eventId, fee }: { eventId: string; fee: number }) {
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setState('loading');
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      body: JSON.stringify({ eventId, message }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (res.ok) {
      setState('done');
    } else if (res.status === 409) {
      setState('already');
    } else {
      setError(data.error || 'Something went wrong');
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/90 border-t border-white/10 text-center">
        <p className="text-green-400 font-semibold">Request sent!</p>
        <p className="text-white/40 text-xs mt-1">The host will review your profile and let you know.</p>
      </div>
    );
  }

  if (state === 'already') {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/90 border-t border-white/10 text-center">
        <p className="text-white/50 font-semibold">Already applied</p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          {state === 'error' && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
          <button onClick={() => setState('form')}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600">
            Request to join — ₩{fee.toLocaleString()}
          </button>
        </div>
      </div>

      {/* Application modal */}
      {state === 'form' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-black text-white text-xl mb-2">Request to join</h3>
            <p className="text-white/40 text-sm mb-5">
              The host will review your profile and social links before approving.
            </p>
            <label className="text-xs text-white/50 mb-1 block">
              Message to host <span className="text-white/30">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Hey! I'm Sarah from Italy, been in Seoul for 3 months..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm resize-none mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setState('idle')}
                className="flex-1 border border-white/20 text-white py-3 rounded-xl font-semibold hover:bg-white/10">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={state === 'loading' as any}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50">
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**Step 2: RSVP API**
```ts
// app/api/rsvp/route.ts
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { rsvps, events } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Sign in first' }, { status: 401 });

  const { eventId, message } = await req.json() as { eventId: string; message?: string };
  const { db } = await import('@/db');

  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

  // Check capacity (approved only)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rsvps)
    .where(and(eq(rsvps.eventId, eventId), eq(rsvps.status, 'approved')));
  if (count >= event.capacity) return Response.json({ error: 'Event is full' }, { status: 409 });

  // Prevent duplicate
  const [existing] = await db.select().from(rsvps).where(
    and(eq(rsvps.eventId, eventId), eq(rsvps.userId, session.user.id))
  ).limit(1);
  if (existing) return Response.json({ error: 'Already applied' }, { status: 409 });

  await db.insert(rsvps).values({
    id: nanoid(),
    eventId,
    userId: session.user.id,
    status: 'pending',
    message: message || null,
    createdAt: new Date(),
  });

  return Response.json({ ok: true });
}
```

**Step 3: Commit**
```bash
git add components/RsvpButton.tsx app/api/rsvp/
git commit -m "feat: RSVP request flow — pending, host approval"
```

---

## Task 9: My Profile Page

**Files:**
- Create: `app/(main)/profile/page.tsx`
- Create: `app/api/profile/route.ts`

**Step 1: Profile API**
```ts
// app/api/profile/route.ts
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { users, events, rsvps, socialLinks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { db } = await import('@/db');
  const userId = session.user.id;
  const today = new Date().toISOString().split('T')[0];

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const links = await db.select().from(socialLinks).where(eq(socialLinks.userId, userId));

  const userRsvps = await db
    .select({ event: events, status: rsvps.status })
    .from(rsvps)
    .innerJoin(events, eq(rsvps.eventId, events.id))
    .where(eq(rsvps.userId, userId))
    .orderBy(events.date);

  return Response.json({
    user: { ...user, socialLinks: links },
    upcomingEvents: userRsvps.filter(r => r.event.date >= today).map(r => ({ ...r.event, status: r.status })),
    pastEvents:     userRsvps.filter(r => r.event.date < today).map(r => ({ ...r.event, status: r.status })),
  });
}
```

**Step 2: Profile page**
```tsx
// app/(main)/profile/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Nav } from '@/components/ui/Nav';
import { TrackBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FormatBadge } from '@/components/ui/Badge';

const statusLabel: Record<string, { text: string; color: string }> = {
  pending:  { text: 'Pending review', color: 'text-yellow-400' },
  approved: { text: 'Approved',       color: 'text-green-400'  },
  rejected: { text: 'Not approved',   color: 'text-red-400'    },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/profile`);
  const { user, upcomingEvents, pastEvents } = await res.json();

  return (
    <div className="min-h-screen bg-black">
      <Nav user={session.user} />
      <div className="max-w-2xl mx-auto pt-24 px-6 pb-12">

        <div className="flex items-start gap-4 mb-8">
          {user.profileImage
            ? <img src={user.profileImage} alt="" className="w-16 h-16 rounded-full flex-shrink-0" />
            : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex-shrink-0" />
          }
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-black text-white">{user.name}</h1>
              {user.track && <TrackBadge track={user.track} />}
            </div>
            <p className="text-white/40 text-sm">{user.nationality}</p>
            {user.bio && <p className="text-white/60 text-sm mt-1">{user.bio}</p>}
            {user.socialLinks?.length > 0 && (
              <div className="flex gap-3 mt-2">
                {user.socialLinks.map((l: any) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-orange-400 hover:text-orange-300 capitalize">
                    {l.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="font-bold text-white mb-3">Upcoming events</h2>
        {upcomingEvents.length === 0
          ? <p className="text-white/30 text-sm mb-8">None yet. <Link href="/events" className="text-orange-400">Browse events →</Link></p>
          : (
            <div className="flex flex-col gap-3 mb-8">
              {upcomingEvents.map((e: any) => {
                const s = statusLabel[e.status] ?? statusLabel.pending;
                return (
                  <Link key={e.id} href={`/events/${e.id}`}>
                    <Card className="hover:border-white/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <FormatBadge format={e.format} />
                          <p className="text-white font-semibold mt-2 text-sm">{e.title}</p>
                          <p className="text-white/40 text-xs">{e.date} · {e.location}</p>
                        </div>
                        <span className={`text-xs font-semibold ${s.color}`}>{s.text}</span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )
        }

        {pastEvents.length > 0 && (
          <>
            <h2 className="font-bold text-white/40 mb-3">Past events</h2>
            <div className="flex flex-col gap-3">
              {pastEvents.map((e: any) => (
                <Card key={e.id} className="opacity-50">
                  <p className="text-white font-semibold text-sm">{e.title}</p>
                  <p className="text-white/40 text-xs">{e.date}</p>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Commit**
```bash
git add app/(main)/profile/ app/api/profile/
git commit -m "feat: my profile with event history and RSVP status"
```

---

## Task 10: Landing Page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Landing page**
```tsx
// app/page.tsx
import Link from 'next/link';
import { Nav } from '@/components/ui/Nav';
import { EventCard, type EventSummary } from '@/components/EventCard';
import { auth } from '@/lib/auth';

export const revalidate = 300;

export default async function LandingPage() {
  const session = await auth();
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/events`, { next: { revalidate: 300 } });
  const events: EventSummary[] = await res.json();
  const preview = events.slice(0, 2);

  return (
    <div className="min-h-screen bg-black">
      <Nav user={session?.user} />

      <div className="max-w-2xl mx-auto pt-32 px-6 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-black text-white mb-5 leading-tight tracking-tight">
          Find your people<br />in Korea
        </h1>
        <p className="text-white/50 text-lg mb-10 max-w-md mx-auto">
          Verified meetups where you can see who's coming before you apply. Real Korean food, real connections.
        </p>
        <Link href={session ? '/events' : '/login'}
          className="inline-block bg-orange-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors">
          {session ? 'Browse events' : 'Join chatda'}
        </Link>
      </div>

      {preview.length > 0 && (
        <div className="max-w-2xl mx-auto px-6 pb-16">
          <h2 className="font-bold text-white mb-4">Upcoming meetups</h2>
          <div className="flex flex-col gap-4 mb-6">
            {preview.map(e => <EventCard key={e.id} event={e} />)}
          </div>
          <Link href="/events" className="text-orange-400 text-sm font-semibold hover:text-orange-300">
            See all events →
          </Link>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '👤', title: 'See who\'s going', body: 'Browse attendee profiles and social links before you apply — not possible on open chat' },
          { icon: '✅', title: 'Host-approved', body: 'Every attendee is reviewed by the host. No random strangers.' },
          { icon: '🍖', title: 'Real Korean food', body: 'Locals take you to actual spots — samgyeopsal, not tourist traps' },
        ].map(item => (
          <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-3xl mb-3">{item.icon}</div>
            <div className="font-bold text-white text-sm mb-1">{item.title}</div>
            <div className="text-white/40 text-xs leading-relaxed">{item.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add app/page.tsx
git commit -m "feat: landing page"
```

---

## Task 11: Host Panel

**Files:**
- Create: `middleware.ts`
- Create: `app/(host)/host/page.tsx`
- Create: `app/(host)/host/events/new/page.tsx`
- Create: `app/(host)/host/events/[id]/rsvps/page.tsx`
- Create: `app/api/host/events/route.ts`
- Create: `app/api/host/rsvps/[id]/route.ts`

**Step 1: Protect /host routes**
```ts
// middleware.ts — redirect non-hosts away from /host
export { auth as default } from '@/lib/auth';
export const config = { matcher: ['/host/:path*'] };
```

Add to `lib/auth.ts` callbacks:
```ts
async authorized({ auth, request }) {
  if (request.nextUrl.pathname.startsWith('/host')) {
    return auth?.user?.email === process.env.HOST_EMAIL;
  }
  return true;
},
```

**Step 2: Create event API**
```ts
// app/api/host/events/route.ts
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { events } from '@/db/schema';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== process.env.HOST_EMAIL) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as {
    title: string; format: string; date: string; time: string;
    location: string; locationMapUrl?: string; capacity: number;
    fee: number; description?: string;
  };

  const { db } = await import('@/db');

  await db.insert(events).values({
    id: nanoid(),
    ...body,
    format: body.format as 'eats' | 'nights',
    locationMapUrl: body.locationMapUrl || null,
    description: body.description || null,
    hostId: session.user.id ?? null,
    createdAt: new Date(),
  });

  return Response.json({ ok: true });
}
```

**Step 3: Approve/reject RSVP API**
```ts
// app/api/host/rsvps/[id]/route.ts
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { rsvps } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.email !== process.env.HOST_EMAIL) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { status } = await req.json() as { status: 'approved' | 'rejected' };
  const { db } = await import('@/db');

  await db.update(rsvps).set({ status }).where(eq(rsvps.id, params.id));
  return Response.json({ ok: true });
}
```

**Step 4: Host dashboard**
```tsx
// app/(host)/host/page.tsx
import Link from 'next/link';
import { getDb } from '@/db';
import { rsvps } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export default async function HostPage() {
  const { db } = await import('@/db');

  const [{ pendingCount }] = await db
    .select({ pendingCount: sql<number>`count(*)` })
    .from(rsvps).where(eq(rsvps.status, 'pending'));

  return (
    <div className="min-h-screen bg-black pt-12 px-6">
      <h1 className="text-2xl font-black text-white mb-8">Host dashboard</h1>
      <div className="flex flex-col gap-3 max-w-sm">
        <Link href="/host/events/new"
          className="bg-orange-500 text-white py-3 px-6 rounded-xl font-semibold text-center hover:bg-orange-600">
          + Create event
        </Link>
        <Link href="/host/rsvps"
          className="bg-white/10 text-white py-3 px-6 rounded-xl font-semibold text-center hover:bg-white/20 flex items-center justify-between">
          <span>Review applications</span>
          {pendingCount > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </Link>
      </div>
    </div>
  );
}
```

**Step 5: Create event form**
```tsx
// app/(host)/host/events/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', format: 'eats', date: '', time: '',
    location: '', locationMapUrl: '', capacity: 10, fee: 1000, description: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch('/api/host/events', {
      method: 'POST',
      body: JSON.stringify({ ...form, capacity: +form.capacity, fee: +form.fee }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) router.push('/events');
    setLoading(false);
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm';

  return (
    <div className="min-h-screen bg-black pt-12 px-6 pb-12">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-black text-white mb-8">Create event</h1>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Title</label>
            <input value={form.title} onChange={set('title')} placeholder="chatda eats — Samgyeopsal Night" className={inputClass} />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Format</label>
            <select value={form.format} onChange={set('format')} className={inputClass}>
              <option value="eats">chatda eats</option>
              <option value="nights">chatda nights</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={set('date')} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Time</label>
              <input type="time" value={form.time} onChange={set('time')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Location</label>
            <input value={form.location} onChange={set('location')} placeholder="망원동 OO삼겹살" className={inputClass} />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Map URL <span className="text-white/30">(optional)</span></label>
            <input value={form.locationMapUrl} onChange={set('locationMapUrl')} placeholder="https://maps.google.com/..." className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={set('capacity')} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Fee (₩)</label>
              <input type="number" min={0} value={form.fee} onChange={set('fee')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Description <span className="text-white/30">(optional)</span></label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              className={`${inputClass} resize-none`} />
          </div>

          <button onClick={handleSubmit} disabled={loading || !form.title || !form.date}
            className="bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-30 hover:bg-orange-600">
            {loading ? 'Creating...' : 'Create event'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 6: RSVP review page — host sees full applicant profile + social links**
```tsx
// app/(host)/host/rsvps/page.tsx
import { getDb } from '@/db';
import { rsvps, users, events, socialLinks } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { TrackBadge } from '@/components/ui/Badge';
import { ApproveRejectButtons } from '@/components/ApproveRejectButtons';

export default async function HostRsvpsPage() {
  const { db } = await import('@/db');

  const pending = await db
    .select({
      rsvpId: rsvps.id,
      message: rsvps.message,
      createdAt: rsvps.createdAt,
      eventTitle: events.title,
      eventDate: events.date,
      userId: users.id,
      userName: users.name,
      userNationality: users.nationality,
      userTrack: users.track,
      userBio: users.bio,
      userImage: users.profileImage,
    })
    .from(rsvps)
    .innerJoin(users, eq(rsvps.userId, users.id))
    .innerJoin(events, eq(rsvps.eventId, events.id))
    .where(eq(rsvps.status, 'pending'))
    .orderBy(rsvps.createdAt);

  const userIds = pending.map(p => p.userId);
  const links = userIds.length > 0
    ? await db.select().from(socialLinks).where(inArray(socialLinks.userId, userIds))
    : [];

  return (
    <div className="min-h-screen bg-black pt-12 px-6 pb-12">
      <h1 className="text-2xl font-black text-white mb-2">Applications</h1>
      <p className="text-white/40 text-sm mb-8">{pending.length} pending</p>

      <div className="flex flex-col gap-4 max-w-2xl">
        {pending.length === 0 && <p className="text-white/30">No pending applications.</p>}
        {pending.map(p => {
          const userLinks = links.filter(l => l.userId === p.userId);
          return (
            <div key={p.rsvpId} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              {/* Event */}
              <p className="text-xs text-white/30 mb-3">{p.eventTitle} · {p.eventDate}</p>

              {/* Applicant profile */}
              <div className="flex items-start gap-3 mb-4">
                {p.userImage
                  ? <img src={p.userImage} alt="" className="w-12 h-12 rounded-full flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex-shrink-0" />
                }
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-white">{p.userName}</span>
                    {p.userTrack && <TrackBadge track={p.userTrack as any} />}
                  </div>
                  <p className="text-xs text-white/40">{p.userNationality}</p>
                  {p.userBio && <p className="text-xs text-white/60 mt-1">{p.userBio}</p>}
                  {userLinks.length > 0 && (
                    <div className="flex gap-3 mt-2">
                      {userLinks.map(l => (
                        <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-orange-400 hover:text-orange-300 capitalize">
                          {l.platform}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Applicant message */}
              {p.message && (
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                  <p className="text-xs text-white/60 italic">"{p.message}"</p>
                </div>
              )}

              {/* Approve / Reject */}
              <ApproveRejectButtons rsvpId={p.rsvpId} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 7: ApproveRejectButtons client component**
```tsx
// components/ApproveRejectButtons.tsx
'use client';
import { useState } from 'react';

export function ApproveRejectButtons({ rsvpId }: { rsvpId: string }) {
  const [state, setState] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [loading, setLoading] = useState(false);

  const act = async (status: 'approved' | 'rejected') => {
    setLoading(true);
    await fetch(`/api/host/rsvps/${rsvpId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: { 'Content-Type': 'application/json' },
    });
    setState(status);
    setLoading(false);
  };

  if (state === 'approved') return <p className="text-green-400 text-sm font-semibold">Approved ✓</p>;
  if (state === 'rejected') return <p className="text-red-400 text-sm font-semibold">Rejected</p>;

  return (
    <div className="flex gap-3">
      <button onClick={() => act('rejected')} disabled={loading}
        className="flex-1 border border-red-500/30 text-red-400 py-2 rounded-xl text-sm font-semibold hover:bg-red-500/10 disabled:opacity-50">
        Reject
      </button>
      <button onClick={() => act('approved')} disabled={loading}
        className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
        Approve
      </button>
    </div>
  );
}
```

**Step 8: Commit**
```bash
git add app/(host)/ app/api/host/ components/ApproveRejectButtons.tsx middleware.ts
git commit -m "feat: host panel — create events, review and approve/reject RSVP applications"
```

---

## Task 12: Deploy to Cloudflare

**Step 1: Create production D1**
```bash
npx wrangler d1 create chatda-prod
# Update wrangler.toml with production database_id
npx wrangler d1 execute chatda-prod --file=./drizzle/0000_initial.sql
```

**Step 2: Create R2 bucket**
```bash
npx wrangler r2 bucket create chatda-uploads
```

**Step 3: Set secrets**
```bash
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put HOST_EMAIL
```

**Step 4: Add Google OAuth redirect URI**

Google Cloud Console → OAuth Client → Authorized redirect URIs:
```
https://chatda.life/api/auth/callback/google
```

**Step 5: Deploy**
```bash
npm run build
npx wrangler pages deploy
```

**Step 6: Smoke test**
```
1. chatda.life → landing page
2. Join chatda → Google OAuth → /onboarding
3. Fill profile (track + social links) → /events
4. Click event → see attendees
5. "Request to join" → write message → submit
6. /host/rsvps → see application + social links → Approve
7. User's /profile → status shows "Approved"
```

**Step 7: Commit**
```bash
git add .
git commit -m "chore: production deployment"
```

---

## Summary

| Task | What it builds |
|---|---|
| 1 | Next.js + Cloudflare scaffold |
| 2 | D1 schema — Users, SocialLinks, Events, RSVPs |
| 3 | Design system — Button, Badge, Card, Nav |
| 4 | Google OAuth + email magic link |
| 5 | Onboarding — profile + track (self-reported) + social links |
| 6 | Events list |
| 7 | Event detail + attendee profiles |
| 8 | RSVP request flow — pending → host approval |
| 9 | My profile page with RSVP status |
| 10 | Landing page |
| 11 | Host panel — create events, approve/reject applications |
| 12 | Cloudflare deployment |

**No OTP. No SMS. No payment API. Track = self-reported dropdown. RSVP = host reviews applicant's profile + social links → approve or reject.**
