import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { nanoid } from 'nanoid';
import * as schema from '../db/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// dev 전용 시드 — Step 1 + Step 2 필드 다양하게 채워서 People 탭 UI 확인용.
// 절대 prod에 돌리지 말 것 (npm run db:seed:prod 는 의도적으로만).
async function seed() {
  console.log('🌱 Seeding dev users + events...');

  const sarahId = nanoid();
  const junId = nanoid();
  const yukiId = nanoid();
  const marcoId = nanoid();
  const meiId = nanoid();

  await db.insert(schema.users).values([
    {
      id: sarahId,
      name: 'Sarah',
      email: 'sarah@chatda.test',
      nationality: 'American',
      location: 'Seoul',
      status: 'expat',
      lookingFor: ['local_friends', 'language_exchange', 'food_nightlife'],
      stayArrived: '2025-03-15',
      languages: [
        { language: 'English', level: 'native' },
        { language: 'Korean', level: 'learning' },
        { language: 'Spanish', level: 'conversational' },
      ],
      interests: ['K-pop', 'Food', 'Hiking', 'Photography'],
      bio: 'UX designer in Gangnam. Love bibimbap more than I should.',
      onboardingComplete: true,
    },
    {
      id: junId,
      name: 'Jun',
      email: 'jun@chatda.test',
      nationality: 'Korean',
      location: 'Seoul',
      status: 'local',
      lookingFor: ['creative_collab', 'work_networking'],
      languages: [
        { language: 'Korean', level: 'native' },
        { language: 'English', level: 'fluent' },
        { language: 'Japanese', level: 'conversational' },
      ],
      interests: ['Art', 'Music', 'Coffee', 'Tech'],
      bio: 'Indie filmmaker. I know every hidden jazz bar in Mapo.',
      onboardingComplete: true,
    },
    {
      id: yukiId,
      name: 'Yuki',
      email: 'yuki@chatda.test',
      nationality: 'Japanese',
      location: 'Busan',
      status: 'visitor',
      lookingFor: ['travel_buddy', 'food_nightlife', 'language_exchange'],
      stayArrived: '2026-04-10',
      stayDeparted: '2026-05-05',
      languages: [
        { language: 'Japanese', level: 'native' },
        { language: 'Korean', level: 'fluent' },
        { language: 'English', level: 'conversational' },
      ],
      interests: ['Food', 'Travel', 'Anime', 'Photography'],
      bio: 'Solo-traveling around Busan for a month. Seafood recs welcome!',
      onboardingComplete: true,
    },
    {
      id: marcoId,
      name: 'Marco',
      email: 'marco@chatda.test',
      nationality: 'Italian',
      location: 'Seoul',
      status: 'visiting_soon',
      lookingFor: ['work_networking', 'just_exploring'],
      stayArrived: '2026-06-01',
      languages: [
        { language: 'Italian', level: 'native' },
        { language: 'English', level: 'fluent' },
      ],
      interests: ['Tech', 'Coffee', 'Fashion', 'Art'],
      bio: 'Milan → Seoul in June for a 3-month startup residency. Who should I meet?',
      onboardingComplete: true,
    },
    {
      id: meiId,
      name: 'Mei',
      email: 'mei@chatda.test',
      nationality: 'Chinese',
      location: 'Jeju',
      status: 'visited_before',
      lookingFor: ['kpop_fandom', 'creative_collab'],
      stayArrived: '2025-08-01',
      stayDeparted: '2025-11-20',
      languages: [
        { language: 'Chinese', level: 'native' },
        { language: 'Korean', level: 'fluent' },
        { language: 'English', level: 'fluent' },
      ],
      interests: ['K-pop', 'Dance', 'Fashion', 'Photography', 'Music'],
      bio: 'Content creator. Came back to Korea every year since 2023.',
      onboardingComplete: true,
    },
  ]).onConflictDoNothing();

  await db.insert(schema.socialLinks).values([
    { id: nanoid(), userId: sarahId, platform: 'instagram', url: 'https://instagram.com/sarah_seoul' },
    { id: nanoid(), userId: sarahId, platform: 'linkedin', url: 'https://linkedin.com/in/sarah' },
    { id: nanoid(), userId: junId,   platform: 'instagram', url: 'https://instagram.com/jun_films' },
    { id: nanoid(), userId: junId,   platform: 'x',         url: 'https://twitter.com/jun' },
    { id: nanoid(), userId: yukiId,  platform: 'instagram', url: 'https://instagram.com/yuki_trips' },
    { id: nanoid(), userId: marcoId, platform: 'linkedin',  url: 'https://linkedin.com/in/marco' },
    { id: nanoid(), userId: meiId,   platform: 'tiktok',    url: 'https://tiktok.com/@mei' },
    { id: nanoid(), userId: meiId,   platform: 'instagram', url: 'https://instagram.com/mei' },
  ]).onConflictDoNothing();

  await db.insert(schema.userTags).values([
    { id: nanoid(), userId: sarahId, tag: 'Graphic Design', category: 'can_do' },
    { id: nanoid(), userId: sarahId, tag: 'English Tutoring', category: 'can_do' },
    { id: nanoid(), userId: sarahId, tag: 'Korean Tutoring', category: 'looking_for' },
    { id: nanoid(), userId: junId,   tag: 'Tour Guide', category: 'can_do' },
    { id: nanoid(), userId: junId,   tag: 'Video Editing', category: 'can_do' },
    { id: nanoid(), userId: junId,   tag: 'Language Exchange', category: 'can_do' },
    { id: nanoid(), userId: yukiId,  tag: 'Translation', category: 'can_do' },
    { id: nanoid(), userId: yukiId,  tag: 'Tour Guide', category: 'looking_for' },
    { id: nanoid(), userId: marcoId, tag: 'Business', category: 'can_do' },
    { id: nanoid(), userId: marcoId, tag: 'Business', category: 'looking_for' },
    { id: nanoid(), userId: meiId,   tag: 'Content Creation', category: 'can_do' },
    { id: nanoid(), userId: meiId,   tag: 'Modeling', category: 'can_do' },
    { id: nanoid(), userId: meiId,   tag: 'Photography', category: 'looking_for' },
  ]).onConflictDoNothing();

  // 이벤트 (Jun이 호스트)
  const event1Id = nanoid();
  const event2Id = nanoid();

  await db.insert(schema.events).values([
    {
      id: event1Id,
      title: 'Samgyeopsal Night 🥩',
      date: '2026-04-25',
      time: '7:00 PM',
      location: '맛찬들왕소금구이 홍대점',
      area: 'Hongdae',
      capacity: 12,
      fee: 10000,
      description: "Real Korean BBQ with locals who'll help you order, grill, and eat like you've been here for years. We split the bill equally at the end.",
      hostId: junId,
    },
    {
      id: event2Id,
      title: 'Friday Night Drinks 🍺',
      date: '2026-05-02',
      time: '8:00 PM',
      location: '펀마이마이 이태원점',
      area: 'Itaewon',
      capacity: 20,
      fee: 0,
      description: 'Beer, board games, and new friends. Darts, pool, card games — pay for your own drinks. Just show up.',
      hostId: junId,
    },
  ]).onConflictDoNothing();

  await db.insert(schema.rsvps).values([
    { id: nanoid(), eventId: event1Id, userId: sarahId, status: 'approved' },
    { id: nanoid(), eventId: event1Id, userId: yukiId,  status: 'pending' },
    { id: nanoid(), eventId: event2Id, userId: meiId,   status: 'approved' },
  ]).onConflictDoNothing();

  console.log('✅ Done!');
  console.log('   Users: Sarah (American/Seoul/expat), Jun (Korean/Seoul/local),');
  console.log('          Yuki (Japanese/Busan/visitor), Marco (Italian/Seoul/visiting_soon),');
  console.log('          Mei (Chinese/Jeju/visited_before)');
  await client.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
