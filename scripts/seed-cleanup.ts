import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// 시드 유저 전부 제거. 모든 연관 row는 users 테이블의 onDelete: cascade로 자동 정리됨
// (social_links, user_tags, rsvps, posts, connections, event_memories, post_likes, post_comments).
// events는 host_id FK가 cascade 아니므로 Jun이 호스트인 이벤트는 먼저 직접 삭제.
async function cleanup() {
  console.log('🧹 Cleaning up @chatda.test seed data...');

  // 1. Jun이 호스트인 이벤트 선제 삭제 (events.host_id는 cascade 없음)
  const eventsDeleted = await db.execute(
    sql`DELETE FROM events WHERE host_id IN (SELECT id FROM users WHERE email LIKE '%@chatda.test') RETURNING id`
  );
  console.log(`   Deleted ${eventsDeleted.length} seed-hosted event(s)`);

  // 2. 유저 삭제 — 나머지 연관 테이블은 cascade로 자동 정리
  const usersDeleted = await db.execute(
    sql`DELETE FROM users WHERE email LIKE '%@chatda.test' RETURNING id, name, email`
  );
  console.log(`   Deleted ${usersDeleted.length} seed user(s)`);
  for (const u of usersDeleted as unknown as { name: string; email: string }[]) {
    console.log(`     - ${u.name} <${u.email}>`);
  }

  console.log('✅ Cleanup done');
  await client.end();
}

cleanup().catch(e => { console.error(e); process.exit(1); });
