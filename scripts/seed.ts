import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as schema from '../db/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// dev 전용 시드 — landing Section 2 + People 탭 UI 확인용.
// 전부 @chatda.test 이메일 → backend `/users/directory`가 prod(ENVIRONMENT=production)에서 자동 필터.
// 재실행 idempotent: 먼저 @chatda.test 유저 delete → cascade로 연관 row 정리.
async function seed() {
  console.log('🌱 Seeding dev users + events...');

  // 1. 기존 시드 제거 (idempotent) — events.host_id는 cascade 없으므로 먼저 이벤트부터.
  const oldEvents = await db.execute(
    sql`DELETE FROM events WHERE host_id IN (SELECT id FROM users WHERE email LIKE '%@chatda.test') RETURNING id`
  );
  if (oldEvents.length) console.log(`   Removed ${oldEvents.length} existing seed event(s)`);
  const deleted = await db.execute(
    sql`DELETE FROM users WHERE email LIKE '%@chatda.test' RETURNING id`
  );
  if (deleted.length) console.log(`   Removed ${deleted.length} existing seed user(s)`);

  // 2. 10명 시드 — status × nationality × location × gender 다양성
  const sarahId = nanoid();   // American F Resident Seoul
  const junId = nanoid();     // Korean M Local Seoul (filmmaker)
  const yukiId = nanoid();    // Japanese F Visitor Busan
  const marcoId = nanoid();   // Italian M Visitor Seoul
  const meiId = nanoid();     // Chinese F Resident Jeju
  const emmaId = nanoid();    // German F Student Seoul (Yonsei)
  const lucasId = nanoid();   // Brazilian M Resident Busan
  const chloeId = nanoid();   // French F Resident Seoul
  const jackId = nanoid();    // Australian M Student Seoul (Korea Univ)
  const putriId = nanoid();   // Indonesian F Visitor Jeju

  await db.insert(schema.users).values([
    {
      id: sarahId,
      name: 'Sarah',
      email: 'sarah@chatda.test',
      nationality: 'American',
      location: 'Seoul',
      locationDistrict: 'Gangnam',
      status: 'expat',
      gender: 'female',
      age: 28,
      profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
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
      locationDistrict: 'Mapo',
      status: 'local',
      gender: 'male',
      age: 31,
      profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
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
      gender: 'female',
      age: 26,
      profileImage: 'https://randomuser.me/api/portraits/women/65.jpg',
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
      locationDistrict: 'Jongno',
      status: 'visitor',
      gender: 'male',
      age: 33,
      profileImage: 'https://randomuser.me/api/portraits/men/47.jpg',
      lookingFor: ['work_networking', 'just_exploring'],
      stayArrived: '2026-06-01',
      stayDeparted: '2026-08-30',
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
      status: 'expat',
      gender: 'female',
      age: 29,
      profileImage: 'https://randomuser.me/api/portraits/women/79.jpg',
      lookingFor: ['kpop_fandom', 'creative_collab'],
      stayArrived: '2025-01-08',
      languages: [
        { language: 'Chinese', level: 'native' },
        { language: 'Korean', level: 'fluent' },
        { language: 'English', level: 'fluent' },
      ],
      interests: ['K-pop', 'Dance', 'Fashion', 'Photography', 'Music'],
      bio: 'Content creator based in Jeju. Shooting island lifestyle and brand campaigns.',
      onboardingComplete: true,
    },
    {
      id: emmaId,
      name: 'Emma',
      email: 'emma@chatda.test',
      nationality: 'German',
      location: 'Seoul',
      locationDistrict: 'Seodaemun',
      status: 'exchange_student',
      school: 'Yonsei University',
      gender: 'female',
      age: 22,
      profileImage: 'https://randomuser.me/api/portraits/women/12.jpg',
      lookingFor: ['local_friends', 'language_exchange', 'study_tutoring'],
      stayArrived: '2026-03-02',
      stayDeparted: '2026-12-20',
      languages: [
        { language: 'German', level: 'native' },
        { language: 'English', level: 'fluent' },
        { language: 'Korean', level: 'learning' },
      ],
      interests: ['Hiking', 'Coffee', 'Photography', 'Languages'],
      bio: 'Exchange semester at Yonsei. First time in Asia — please show me your favorite cafes.',
      onboardingComplete: true,
    },
    {
      id: lucasId,
      name: 'Lucas',
      email: 'lucas@chatda.test',
      nationality: 'Brazilian',
      location: 'Busan',
      status: 'expat',
      gender: 'male',
      age: 35,
      profileImage: 'https://randomuser.me/api/portraits/men/85.jpg',
      lookingFor: ['work_networking', 'food_nightlife'],
      stayArrived: '2024-07-15',
      languages: [
        { language: 'Portuguese', level: 'native' },
        { language: 'English', level: 'fluent' },
        { language: 'Korean', level: 'conversational' },
      ],
      interests: ['Sports', 'Food', 'Fitness', 'Music'],
      bio: 'Shipbuilding engineer in Busan. Surf on weekends, BBQ on weeknights.',
      onboardingComplete: true,
    },
    {
      id: chloeId,
      name: 'Chloé',
      email: 'chloe@chatda.test',
      nationality: 'French',
      location: 'Seoul',
      locationDistrict: 'Mapo',
      status: 'expat',
      gender: 'female',
      age: 29,
      profileImage: 'https://randomuser.me/api/portraits/women/31.jpg',
      lookingFor: ['creative_collab', 'local_friends'],
      stayArrived: '2023-09-10',
      languages: [
        { language: 'French', level: 'native' },
        { language: 'English', level: 'fluent' },
        { language: 'Korean', level: 'conversational' },
      ],
      interests: ['Art', 'Fashion', 'Coffee', 'Travel', 'Movies'],
      bio: 'Paris → Seoul three years ago. Illustrator, sometimes gallery-hopping around Yeonnam-dong.',
      onboardingComplete: true,
    },
    {
      id: jackId,
      name: 'Jack',
      email: 'jack@chatda.test',
      nationality: 'Australian',
      location: 'Seoul',
      locationDistrict: 'Seongbuk',
      status: 'exchange_student',
      school: 'Korea University',
      gender: 'male',
      age: 22,
      profileImage: 'https://randomuser.me/api/portraits/men/19.jpg',
      lookingFor: ['local_friends', 'travel_buddy', 'food_nightlife'],
      stayArrived: '2026-03-02',
      stayDeparted: '2026-06-25',
      languages: [
        { language: 'English', level: 'native' },
        { language: 'Korean', level: 'learning' },
      ],
      interests: ['Sports', 'Gaming', 'Food', 'Travel'],
      bio: 'Sydney kid at KU for one semester. Keen for anyone who wants to hike Bukhansan this weekend.',
      onboardingComplete: true,
    },
    {
      id: putriId,
      name: 'Putri',
      email: 'putri@chatda.test',
      nationality: 'Indonesian',
      location: 'Jeju',
      status: 'visitor',
      gender: 'female',
      age: 26,
      profileImage: 'https://randomuser.me/api/portraits/women/50.jpg',
      lookingFor: ['travel_buddy', 'kpop_fandom'],
      stayArrived: '2026-04-14',
      stayDeparted: '2026-04-28',
      languages: [
        { language: 'Indonesian', level: 'native' },
        { language: 'English', level: 'fluent' },
        { language: 'Korean', level: 'learning' },
      ],
      interests: ['K-pop', 'Food', 'Photography', 'Nature'],
      bio: 'Jakarta → Jeju for two weeks of beach + cafes. Trying to find the best haenyeo lunch.',
      onboardingComplete: true,
    },
  ]);

  // 3. Social links
  await db.insert(schema.socialLinks).values([
    { id: nanoid(), userId: sarahId,  platform: 'instagram', url: 'https://instagram.com/sarah_seoul' },
    { id: nanoid(), userId: sarahId,  platform: 'linkedin',  url: 'https://linkedin.com/in/sarah' },
    { id: nanoid(), userId: junId,    platform: 'instagram', url: 'https://instagram.com/jun_films' },
    { id: nanoid(), userId: junId,    platform: 'x',         url: 'https://twitter.com/jun' },
    { id: nanoid(), userId: yukiId,   platform: 'instagram', url: 'https://instagram.com/yuki_trips' },
    { id: nanoid(), userId: marcoId,  platform: 'linkedin',  url: 'https://linkedin.com/in/marco' },
    { id: nanoid(), userId: meiId,    platform: 'tiktok',    url: 'https://tiktok.com/@mei' },
    { id: nanoid(), userId: meiId,    platform: 'instagram', url: 'https://instagram.com/mei' },
    { id: nanoid(), userId: emmaId,   platform: 'instagram', url: 'https://instagram.com/emma_in_seoul' },
    { id: nanoid(), userId: lucasId,  platform: 'linkedin',  url: 'https://linkedin.com/in/lucas-br' },
    { id: nanoid(), userId: lucasId,  platform: 'instagram', url: 'https://instagram.com/lucas.busan' },
    { id: nanoid(), userId: chloeId,  platform: 'instagram', url: 'https://instagram.com/chloe.illustrates' },
    { id: nanoid(), userId: chloeId,  platform: 'threads',   url: 'https://threads.net/@chloe' },
    { id: nanoid(), userId: jackId,   platform: 'instagram', url: 'https://instagram.com/jack_syd_seoul' },
    { id: nanoid(), userId: putriId,  platform: 'tiktok',    url: 'https://tiktok.com/@putri' },
    { id: nanoid(), userId: putriId,  platform: 'instagram', url: 'https://instagram.com/putri_travels' },
  ]);

  // 4. Tags
  await db.insert(schema.userTags).values([
    { id: nanoid(), userId: sarahId,  tag: 'Graphic Design',    category: 'can_do' },
    { id: nanoid(), userId: sarahId,  tag: 'English Tutoring',  category: 'can_do' },
    { id: nanoid(), userId: sarahId,  tag: 'Korean Tutoring',   category: 'looking_for' },
    { id: nanoid(), userId: junId,    tag: 'Tour Guide',        category: 'can_do' },
    { id: nanoid(), userId: junId,    tag: 'Video Editing',     category: 'can_do' },
    { id: nanoid(), userId: junId,    tag: 'Language Exchange', category: 'can_do' },
    { id: nanoid(), userId: yukiId,   tag: 'Translation',       category: 'can_do' },
    { id: nanoid(), userId: yukiId,   tag: 'Tour Guide',        category: 'looking_for' },
    { id: nanoid(), userId: marcoId,  tag: 'Business',          category: 'can_do' },
    { id: nanoid(), userId: marcoId,  tag: 'Business',          category: 'looking_for' },
    { id: nanoid(), userId: meiId,    tag: 'Content Creation',  category: 'can_do' },
    { id: nanoid(), userId: meiId,    tag: 'Photography',       category: 'can_do' },
    { id: nanoid(), userId: meiId,    tag: 'Modeling',          category: 'looking_for' },
    { id: nanoid(), userId: emmaId,   tag: 'Language Exchange', category: 'can_do' },
    { id: nanoid(), userId: emmaId,   tag: 'Korean Tutoring',   category: 'looking_for' },
    { id: nanoid(), userId: lucasId,  tag: 'Business',          category: 'can_do' },
    { id: nanoid(), userId: lucasId,  tag: 'Fitness',           category: 'can_do' },
    { id: nanoid(), userId: chloeId,  tag: 'Graphic Design',    category: 'can_do' },
    { id: nanoid(), userId: chloeId,  tag: 'Translation',       category: 'can_do' },
    { id: nanoid(), userId: jackId,   tag: 'Travel Buddy',      category: 'looking_for' },
    { id: nanoid(), userId: jackId,   tag: 'Language Exchange', category: 'looking_for' },
    { id: nanoid(), userId: putriId,  tag: 'Content Creation',  category: 'can_do' },
    { id: nanoid(), userId: putriId,  tag: 'Travel Buddy',      category: 'looking_for' },
  ]);

  // 5. 이벤트 (Jun이 호스트)
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
  ]);

  await db.insert(schema.rsvps).values([
    { id: nanoid(), eventId: event1Id, userId: sarahId, status: 'approved' },
    { id: nanoid(), eventId: event1Id, userId: yukiId,  status: 'pending' },
    { id: nanoid(), eventId: event1Id, userId: emmaId,  status: 'approved' },
    { id: nanoid(), eventId: event2Id, userId: meiId,   status: 'approved' },
    { id: nanoid(), eventId: event2Id, userId: chloeId, status: 'approved' },
    { id: nanoid(), eventId: event2Id, userId: jackId,  status: 'pending' },
  ]);

  console.log('✅ Done — 10 users, 2 events, 6 RSVPs');
  console.log('   Sarah (US/Seoul/Resident)  Jun (KR/Seoul/Local)');
  console.log('   Yuki (JP/Busan/Visitor)    Marco (IT/Seoul/Visitor)');
  console.log('   Mei (CN/Jeju/Resident)     Emma (DE/Seoul/Student Yonsei)');
  console.log('   Lucas (BR/Busan/Resident)  Chloé (FR/Seoul/Resident)');
  console.log('   Jack (AU/Seoul/Student KU) Putri (ID/Jeju/Visitor)');
  await client.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
