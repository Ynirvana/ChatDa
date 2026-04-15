# 프로덕션 아키텍처 (2026-04-15 기준)

## 전체 데이터 흐름

```
사용자 브라우저
   ↓ https://chatda.life
Cloudflare Edge (TLS 종료, 캐시)
   ↓ Cloudflare Argo Tunnel (암호화)
cloudflared (systemd 서비스, 호스트 OS)
   ↓ http://localhost:3001
chatda-app (Next.js 16.2.3 prod standalone, Docker)
   ↓ http://backend:8000 (Docker 내부 네트워크)
chatda-backend (FastAPI + uvicorn, Docker)
   ↓ postgresql+asyncpg://db:5432
chatda-db-1 (Postgres 16-alpine, Docker, 볼륨 postgres_data)
```

**외부 노출 도메인:** `chatda.life`만 (백엔드 서브도메인 없음. Next.js가 `/api/*`로 흡수)
**Cloudflare Tunnel UUID:** `8dca3205-b12c-43cf-8a76-7753048fe927` (라벨: `chatcity`. 다른 프로젝트와 공유 중이라 이름 안 바꿈)

---

## 호스트 머신

- **OS**: Windows 11 + WSL2 (Ubuntu)
- **호스트명**: `DESKTOP-CGQGH6P`
- **외부 IP** (한국 ISP): 네 ISP가 할당한 IP
- **경로 규약**: `/home/dykim/project/ChatDa` (모든 상대경로 기준)

---

## 포트 맵

| 포트 | 프로세스 | 실행 위치 | 용도 |
|---|---|---|---|
| 3000 | `next-server` dev | 호스트 (npm run dev) | ChatDa 개발 서버 |
| **3001** | `chatda-app` | **Docker 컨테이너** | **ChatDa prod Next.js** ← 외부 노출 |
| 5434 | `postgres` | Docker `chatda-db-1` | DB (dev/prod 공유 인스턴스, 별도 DATABASE) |
| **8000** | `chatda-backend` | **Docker 컨테이너** | **ChatDa prod 백엔드** |
| 8001 | `uvicorn --reload` | 호스트 (anaconda python) | ChatDa 개발 백엔드 |
| 8002 | `chatcity-backend-1` | 다른 프로젝트 Docker | ChatCity (토이 프로젝트, 원래 :8000이었으나 :8002로 이동) |

**굵은 글씨**는 prod 가동 요소.

---

## 컨테이너

### `chatda-app` (prod Next.js)
- **이미지**: `chatda-app:prod` (multi-stage Dockerfile의 `runner` stage)
- **CMD**: `node server.js` (Next.js standalone)
- **포트 매핑**: `3001:3000` (호스트 3001 → 컨테이너 3000)
- **env_file**: `.env.production.local`
- **override env**: `BACKEND_URL=http://backend:8000` (Docker 내부 서비스명)
- **healthcheck**: `wget -qO- http://localhost:3000/`
- **resource limits**: mem 768m / cpu 1.5
- **restart**: `unless-stopped`

### `chatda-backend` (prod FastAPI)
- **이미지**: `chatda-backend:prod`
- **CMD**: `uvicorn main:app --host 0.0.0.0 --port 8000`
- **포트 매핑**: `8000:8000`
- **env_file**: `backend/.env.production`
- **override env**: `DATABASE_URL=postgresql+asyncpg://chatda:chatda@db:5432/chatda`
- **healthcheck**: Python `urllib.request.urlopen('http://localhost:8000/docs')`
- **resource limits**: mem 512m / cpu 1.0
- **restart**: `unless-stopped`

### `chatda-db-1` (공유 Postgres)
- **이미지**: `postgres:16-alpine`
- **포트 매핑**: `5434:5432`
- **env**: `POSTGRES_USER=chatda`, `POSTGRES_PASSWORD=chatda`, `POSTGRES_DB=chatda`
- **볼륨**: `postgres_data` (docker named volume, 영구)
- **init 스크립트**: `db/init/01-create-dev-db.sql` (볼륨 신규 생성 시에만 실행)
- **healthcheck**: `pg_isready -U chatda -d chatda`
- **restart**: `unless-stopped`

---

## DB 분리

**같은 Postgres 인스턴스, 다른 DATABASE:**

| DATABASE | 용도 | 접속 |
|---|---|---|
| `chatda` | **prod** | Docker 내부: `db:5432/chatda` |
| `chatda_dev` | **dev** | 호스트: `localhost:5434/chatda_dev` |

**이유:** 로컬 prod 테스트 중 dev 작업이 prod 데이터 오염시키는 사고 방지.

---

## Docker Compose 파일 구조

```
docker-compose.yml              # 베이스: db 서비스만 (dev/prod 공유)
docker-compose.dev.yml          # dev override: backend-dev(:8001) + app-dev(:3000), 볼륨 마운트 + --reload
docker-compose.prod.yml         # prod override: backend + app, healthcheck + mem_limit + restart
```

**실행 방식:**
- 베이스만: `docker compose up` → DB만
- Dev: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` → 현재 사용 안 함 (호스트 프로세스로 dev 실행 중)
- **Prod**: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` ← **현재 실행 중**

---

## Cloudflare Tunnel

- **UUID**: `8dca3205-b12c-43cf-8a76-7753048fe927`
- **라벨**: `chatcity` (기존 라벨 유지. 여러 도메인 서빙하는 하나의 공유 터널)
- **관리 방식**: Locally-managed (`/etc/cloudflared/config.yml` 파일로 제어)
- **systemd 서비스**: `cloudflared.service` (auto-start)
- **config 파일 위치**:
  - `/etc/cloudflared/config.yml` ← systemd가 읽는 것
  - `/home/dykim/.cloudflared/config.yml` ← 백업/복제본 (수동 동기화 필요)

**ingress 규칙 (2026-04-15 기준):**
```yaml
ingress:
  - hostname: chatcity.io
    service: http://localhost:3000        # 다른 프로젝트 (현재 :3000에 ChatDa dev가 있어 깨진 상태, 중요 X)
  - hostname: api.chatcity.io
    service: http://localhost:8002        # 다른 프로젝트 백엔드 (정상)
  - hostname: "*.chatcity.io"
    service: http://localhost:3000        # 와일드카드
  - hostname: chatda.life
    service: http://localhost:3001        # ChatDa prod
  - hostname: www.chatda.life
    service: http://localhost:3001        # www 별칭 (apex 리다이렉트는 추후 CF Rule로)
  - service: http_status:404              # fallback
```

---

## Cloudflare Dashboard 설정 (chatda.life zone)

- **DNS 레코드:**
  - `chatda.life` → Tunnel (`8dca3205...cfargotunnel.com`) Proxied
  - `www.chatda.life` → CNAME → `chatda.life` Proxied
- **SSL/TLS**: Full
- **Always Use HTTPS**: ON
- **Automatic HTTPS Rewrites**: ON
- **Min TLS Version**: 1.2
- **AI Crawlers**: Block on all pages
- **Cache Rules**:
  - `/api/*` → Bypass cache
  - `/_next/static/*` → Cache eligible, Edge TTL 1y

---

## Google OAuth (Cloud Console)

- **Client ID 하나로 dev + prod 공유** (향후 분리 권장)
- **Authorized JavaScript origins**:
  - `http://localhost:3000` (dev)
  - `https://chatda.life` (prod)
  - `https://www.chatda.life` (prod)
- **Authorized redirect URIs**:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://chatda.life/api/auth/callback/google`
  - `https://www.chatda.life/api/auth/callback/google`

---

## 환경변수 파일

**Frontend** (`/home/dykim/project/ChatDa/`):
- `.env.example` (커밋됨, 키만)
- `.env.local` (gitignored, dev용, 값 채움)
- `.env.production.local` (gitignored, prod용, 값 채움)

**Backend** (`/home/dykim/project/ChatDa/backend/`):
- `.env.example` (커밋됨)
- `.env` (gitignored, settings.py 기본 로드)
- `.env.local` (gitignored, dev용)
- `.env.production` (gitignored, prod용)

**필수 키:**

Frontend 공통: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BACKEND_URL`, `DATABASE_URL`
Backend 공통: `DATABASE_URL`, `NEXTAUTH_SECRET`

**Prod/Dev 차이 포인트:**
- `NEXTAUTH_URL`: `https://chatda.life` vs `http://localhost:3000`
- `BACKEND_URL`: `http://backend:8000` (Docker 내부) vs `http://localhost:8001` (호스트 dev)
- `DATABASE_URL`: `chatda` DB vs `chatda_dev` DB
- `NEXTAUTH_SECRET`: **현재 dev/prod 동일**. 향후 분리 권장 (dev 유출 시 prod 침투 위험)

**규칙:** Frontend와 Backend의 `NEXTAUTH_SECRET`은 같은 환경 내에서 **반드시 일치** (JWT 서명/검증).

---

## NextAuth 설정

- `lib/auth.ts`에 `trustHost: true` 설정 ← **self-hosted 환경 필수**. 없으면 prod에서 `UntrustedHost` 에러
- `pages.newUser: '/onboarding'` (JWT 전략이라 실제로는 `redirectTo='/onboarding'`을 signIn 호출 시 명시)
- `redirectTo`: `/login` 페이지의 signIn() 호출에서 `'/onboarding'`으로 고정 → `/onboarding/page.tsx`가 returning user는 `/meetups`로 리다이렉트

---

## Next.js 설정 포인트

- `next.config.ts`: `output: 'standalone'` (Docker 이미지 최소화)
- `@ducanh2912/next-pwa` 사용, dev에선 disabled
- Next.js **16.2.3** — middleware.ts → **proxy.ts**로 파일명 변경됨 (NextAuth 인증 처리)
