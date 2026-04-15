import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// 커넥션 풀 싱글톤 — HMR/재시작 시 커넥션 폭발 방지
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle> | undefined;
}

function createDb() {
  const client = postgres(process.env.DATABASE_URL!, {
    max: 10,          // 최대 커넥션 수 (PostgreSQL default max_connections=100)
    idle_timeout: 20, // 20초 idle이면 커넥션 반환
    connect_timeout: 10,
  });
  return drizzle(client, { schema });
}

// dev: 글로벌 싱글톤 (HMR 재시작마다 새 커넥션 방지)
// prod: 모듈 싱글톤 (프로세스당 1개 풀)
export const db = globalThis.__db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db;
}
