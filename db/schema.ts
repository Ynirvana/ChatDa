import { pgTable, pgEnum, text, integer, boolean, timestamp, date, jsonb } from 'drizzle-orm/pg-core';

export const platformEnum = pgEnum('platform', ['linkedin', 'instagram', 'x', 'tiktok', 'snapchat', 'whatsapp', 'kakao', 'facebook', 'threads']);
export const rsvpStatusEnum = pgEnum('rsvp_status', ['pending', 'approved', 'rejected', 'cancelled']);
// user_status enum은 v4에서 drop — 값이 유동적이라 application-level validation(constants.ts USER_STATUSES)로 관리.

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  googleId: text('google_id').unique(),
  nationality: text('nationality'),
  location: text('location'),
  bio: text('bio'),
  profileImage: text('profile_image'),
  status: text('status'),
  lookingFor: text('looking_for').array().notNull().default([]),
  // Step 2 — 프로필 페이지에서 나중에 채움. 전부 optional.
  stayArrived: date('stay_arrived'),       // 도착일 (Living/Visiting/Visiting soon/Visited before)
  stayDeparted: date('stay_departed'),     // 출국일 (Visiting/Visited before)
  languages: jsonb('languages').$type<{ language: string; level: string }[]>().notNull().default([]),
  interests: text('interests').array().notNull().default([]),
  onboardingComplete: boolean('onboarding_complete').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const socialLinks = pgTable('social_links', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  url: text('url').notNull(),
});

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  date: text('date').notNull(),         // YYYY-MM-DD
  time: text('time').notNull(),          // HH:MM start time
  endTime: text('end_time'),             // HH:MM end time (optional)
  location: text('location').notNull(),
  area: text('area'),
  capacity: integer('capacity').notNull(),
  fee: integer('fee').notNull().default(0),  // KRW, display only
  description: text('description'),
  coverImage: text('cover_image'),
  googleMapUrl: text('google_map_url'),
  naverMapUrl: text('naver_map_url'),
  directions: text('directions'),        // "How to find us" — e.g. "Take exit 3 at Hongik Univ station"
  requirements: text('requirements'),   // JSON array e.g. '["profile_photo","instagram"]'
  paymentMethod: text('payment_method'), // 'dutch' | 'split' | 'cover' | 'included'
  feeNote: text('fee_note'),            // e.g. "Includes 2 shots + beer"
  hostId: text('host_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const postComments = pgTable('post_comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),  // null = top-level comment, set = reply
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const postLikes = pgTable('post_likes', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Event memories = post-event photos/reviews from attendees
export const eventMemories = pgTable('event_memories', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  photos: text('photos'),  // JSON array of base64 strings
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tags — "what I can do" / "what I'm looking for"
export const tagCategoryEnum = pgEnum('tag_category', ['can_do', 'looking_for']);

export const userTags = pgTable('user_tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  category: tagCategoryEnum('category').notNull(),
});

// Connections — 1촌 (friend request system)
export const connectionStatusEnum = pgEnum('connection_status', ['pending', 'accepted', 'rejected']);

export const connections = pgTable('connections', {
  id: text('id').primaryKey(),
  requesterId: text('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: text('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: connectionStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Banned emails — blocked from signing in (ban is separate from account deletion)
export const bannedEmails = pgTable('banned_emails', {
  email: text('email').primaryKey(),
  bannedAt: timestamp('banned_at').notNull().defaultNow(),
  bannedBy: text('banned_by'),
  reason: text('reason'),
});

// RSVP = request to join. Host approves/rejects.
export const rsvps = pgTable('rsvps', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: rsvpStatusEnum('status').notNull().default('pending'),
  message: text('message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
