import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { nanoid } from 'nanoid';
import * as schema from '../db/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function seed() {
  console.log('🌱 Seeding...');

  // 테스트 유저 2명
  const hostId = nanoid();
  const userId = nanoid();

  await db.insert(schema.users).values([
    {
      id: hostId,
      name: 'Jun',
      email: 'jun@chatda.test',
      nationality: 'Korean',
      bio: "I'll order for you lol",
      onboardingComplete: true,
    },
    {
      id: userId,
      name: 'Alex',
      email: 'alex@chatda.test',
      nationality: 'American',
      bio: 'Here for the food and bad jokes',
      onboardingComplete: true,
    },
  ]).onConflictDoNothing();

  await db.insert(schema.socialLinks).values([
    { id: nanoid(), userId: hostId, platform: 'instagram', url: 'https://instagram.com/jun' },
    { id: nanoid(), userId, platform: 'instagram', url: 'https://instagram.com/alex' },
  ]).onConflictDoNothing();

  // 이벤트 2개
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
      description: 'Real Korean BBQ with locals who\'ll help you order, grill, and eat like you\'ve been here for years. We split the bill equally at the end.',
      hostId,
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
      hostId,
    },
  ]).onConflictDoNothing();

  // Alex가 event1에 approved RSVP
  await db.insert(schema.rsvps).values({
    id: nanoid(),
    eventId: event1Id,
    userId,
    status: 'approved',
  }).onConflictDoNothing();

  console.log('✅ Done!');
  console.log(`   Event 1: /meetups/${event1Id}`);
  console.log(`   Event 2: /meetups/${event2Id}`);
  await client.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
