import { pgTable, pgEnum, text, integer, boolean, timestamp, date, jsonb, serial } from 'drizzle-orm/pg-core';

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
  locationDistrict: text('location_district'),  // Seoul은 25개 구(gu)까지, 다른 지역은 null
  school: text('school'),  // Student(exchange_student) status일 때 필수 — 네트워크 매칭 축
  gender: text('gender'),  // male | female | other — 앱 레벨에서 required (기존 유저는 null 허용 유지)
  age: integer('age'),  // optional, 18-99
  showPersonalInfo: boolean('show_personal_info').notNull().default(true),  // false면 viewer가 본인 아닐 때 age/gender 비공개
  bio: text('bio'),
  profileImage: text('profile_image'),  // Primary avatar (= profileImages[0]) — 기존 컴포넌트 호환용
  profileImages: text('profile_images').array().notNull().default([]),  // Max 5 photos, first = primary. profileImage와 동기화 유지.
  status: text('status'),
  countryOfResidence: text('country_of_residence').notNull().default('KR'),
  lookingFor: text('looking_for').array().notNull().default([]),
  lookingForCustom: text('looking_for_custom'),
  // Step 2 — 프로필 페이지에서 나중에 채움. 전부 optional.
  stayArrived: date('stay_arrived'),       // 도착일 (Living/Visiting/Visiting soon/Visited before)
  stayDeparted: date('stay_departed'),     // 출국일 (Visiting/Visited before)
  languages: jsonb('languages').$type<{ language: string; level: string }[]>().notNull().default([]),
  interests: text('interests').array().notNull().default([]),
  onboardingComplete: boolean('onboarding_complete').default(false),
  // Approval flow — pending | approved | rejected. 기존 유저는 마이그레이션에서 'approved'로 backfill.
  approvalStatus: text('approval_status').notNull().default('pending'),
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by'),          // admin 이메일
  rejectionReason: text('rejection_reason'),
  rejectedAt: timestamp('rejected_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Approval history — audit log for every submission/decision. 재신청 유저 판단 context용.
export const approvalHistory = pgTable('approval_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),    // 'submitted' | 'approved' | 'rejected' | 'resubmitted'
  reason: text('reason'),              // rejection 사유 (action='rejected'일 때만)
  actorEmail: text('actor_email'),     // admin 이메일. self-submission이면 user 이메일
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

// Invite tokens — admin-issued single-use link for invite-only signup gate.
// Flow: admin POST /admin/invites → token. User opens /join?token=xxx → cookie → NextAuth signIn callback → claim.
export const inviteTokens = pgTable('invite_tokens', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  inviteNumber: serial('invite_number').notNull(),  // auto-increment, 초대장 번호 "Invite #47"
  createdByUserId: text('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  claimedByUserId: text('claimed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  claimedAt: timestamp('claimed_at'),
  note: text('note'),  // e.g. "Sarah from Yonsei"
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
