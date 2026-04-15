# 환경 변수 관리 전략

> 로컬 개발 / 프로덕션 환경 분리. **하나도 헷갈릴 일 없게** 파일 위치와 우선순위를 못 박는다.

---

## 핵심 원칙

1. **시크릿은 절대 git에 안 들어간다** — 모든 `.env*` 파일은 `.gitignore`에 있음 (단 `.env.example` 제외)
2. **dev/prod는 물리적으로 다른 파일** — `.env.local` (dev) ↔ `.env.production.local` (prod). 환경 분리는 파일 분리로 해결
3. **NEXTAUTH_SECRET은 dev/prod 다른 값** — prod 새로 생성. JWT 키가 같으면 dev에서 발급한 토큰이 prod에서 통과함 (위험)
4. **`.env.example`만 커밋** — 새 개발자/배포자는 이걸 보고 자기 환경 만듦

---

## Next.js (Frontend) 환경 변수 로딩 순서

Next.js는 자동으로 아래 우선순위로 로드 (위가 우선):

```
1. process.env (셸/systemd가 직접 설정한 값)
2. .env.$(NODE_ENV).local       ← .env.production.local, .env.development.local
3. .env.local                    ← test 환경 외엔 항상 로드, 가장 자주 쓰는 dev 시크릿
4. .env.$(NODE_ENV)              ← .env.production, .env.development (커밋 가능한 값)
5. .env                          ← 모든 환경 공통 (커밋 가능한 값)
```

`NODE_ENV`는:
- `next dev` → `development`
- `next build` + `next start` → `production`

**즉 우리는:**
- 로컬 개발: `.env.local` 사용 (이미 있음)
- 프로덕션: `.env.production.local` 새로 만듦

---

## 권장 파일 구조

### Frontend (`/home/dykim/project/ChatDa/`)

| 파일 | git 커밋? | 누가 씀 | 내용 |
|---|---|---|---|
| `.env.example` | ✅ | 템플릿 | 키 이름만, 값은 비움 |
| `.env.local` | ❌ | `npm run dev` | dev 시크릿 (이미 있음) |
| `.env.production.local` | ❌ | `npm start` (prod) | prod 시크릿 (새로 만들 것) |

### Backend (`/home/dykim/project/ChatDa/backend/`)

| 파일 | git 커밋? | 누가 씀 | 내용 |
|---|---|---|---|
| `.env.example` | ✅ | 템플릿 | 키 이름만 |
| `.env.local` | ❌ | 호스트에서 `uvicorn` 실행 (dev) | DATABASE_URL=`localhost:5434` |
| `.env.production` | ❌ | systemd로 prod 실행 | DATABASE_URL=`localhost:5434`, prod NEXTAUTH_SECRET |
| `.env` | ❌ | Docker Compose 컨테이너 (현재 사용 안 함) | DATABASE_URL=`db:5432` |

> 백엔드는 pydantic-settings가 `.env`만 자동으로 읽음 — `.env.local`이나 `.env.production`을 쓰려면 `settings.py`에서 `env_file` 명시 또는 systemd `EnvironmentFile=` 사용.

---

## 구체적 파일 예시

### `/.env.example` (커밋)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Backend
BACKEND_URL=

# Drizzle (마이그레이션 시에만 필요)
DATABASE_URL=
```

### `/.env.local` (dev — gitignored)

```bash
GOOGLE_CLIENT_ID=363147099...   # dev OAuth 클라이언트
GOOGLE_CLIENT_SECRET=GOCSPX-...
NEXTAUTH_SECRET=tp0rI2+64csu... # dev 시크릿
NEXTAUTH_URL=http://localhost:3000
BACKEND_URL=http://localhost:8001
DATABASE_URL=postgresql://chatda:chatda@localhost:5434/chatda
```

### `/.env.production.local` (prod — gitignored, 배포 시 새로 만들 것)

```bash
GOOGLE_CLIENT_ID=<prod 클라이언트 ID>           # 별도 OAuth 클라이언트 권장
GOOGLE_CLIENT_SECRET=<prod 클라이언트 시크릿>    # 또는 dev 시크릿 회전
NEXTAUTH_SECRET=<openssl rand -base64 32 결과>  # 반드시 새로 생성
NEXTAUTH_URL=https://chatda.life
BACKEND_URL=http://localhost:8001
DATABASE_URL=postgresql://chatda:<강한_비밀번호>@localhost:5434/chatda
```

### `/backend/.env.example` (커밋)

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
```

### `/backend/.env.local` (dev — 이미 존재)

```bash
DATABASE_URL=postgresql+asyncpg://chatda:chatda@localhost:5434/chatda
NEXTAUTH_SECRET=tp0rI2+64csu...   # frontend의 .env.local과 반드시 동일
```

### `/backend/.env.production` (prod — 새로 만들 것)

```bash
DATABASE_URL=postgresql+asyncpg://chatda:<강한_비밀번호>@localhost:5434/chatda
NEXTAUTH_SECRET=<frontend .env.production.local과 반드시 동일>
```

---

## systemd가 어느 파일을 읽는지 명시

배포 가이드의 systemd unit 파일 `EnvironmentFile=`을 통해 명시적으로 prod 파일 지정:

### `chatda-frontend.service`
```ini
[Service]
WorkingDirectory=/home/dykim/project/ChatDa
EnvironmentFile=/home/dykim/project/ChatDa/.env.production.local
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
```

> `npm start` (= `next start`)는 NODE_ENV=production이라 자동으로 `.env.production.local`도 읽음. EnvironmentFile=으로 한 번 더 명시하면 systemd가 systemd-level에서도 환경변수 주입해주니까 이중 안전망.

### `chatda-backend.service`
```ini
[Service]
WorkingDirectory=/home/dykim/project/ChatDa/backend
EnvironmentFile=/home/dykim/project/ChatDa/backend/.env.production
ExecStart=/usr/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --workers 2
```

> 백엔드는 pydantic-settings가 `.env`만 자동 인식하므로 EnvironmentFile=로 명시 필수.

---

## 개발 vs 배포 흐름 비교

```
┌─────────────────────────┬──────────────────────────────────────┐
│ 로컬 개발                │ 프로덕션                              │
├─────────────────────────┼──────────────────────────────────────┤
│ 1. npm run dev          │ 1. npm run build                     │
│    → NODE_ENV=development│    → NODE_ENV=production             │
│    → .env.local 자동    │    → .env.production.local 자동      │
│                         │ 2. sudo systemctl start chatda-*     │
│                         │    → systemd가 EnvironmentFile 주입  │
│                         │                                      │
│ 2. uvicorn --reload     │ 3. (systemd가 backend도 띄움)        │
│    → .env.local 수동    │    → EnvironmentFile=.env.production │
│      로드 필요          │      → DATABASE_URL 등 주입          │
└─────────────────────────┴──────────────────────────────────────┘
```

---

## 시크릿 분리 — 왜 dev/prod 다른 값을 써야 하나

| 항목 | 같이 쓰면? | 왜? |
|---|---|---|
| `NEXTAUTH_SECRET` | **위험** | dev에서 발급한 JWT가 prod 백엔드 인증 통과. 개발자 노트북 털리면 prod 침투 가능 |
| `GOOGLE_CLIENT_SECRET` | **위험** | dev OAuth가 prod redirect로 악용 가능. Google에선 dev/prod 클라이언트 분리 권장 |
| `DATABASE_URL` 비밀번호 | **치명적** | dev 비밀번호 기본값(`chatda`)이 외부에 알려지면 prod도 같이 뚫림 |
| `NEXTAUTH_URL` | 다름 | dev는 `http://localhost:3000`, prod는 `https://chatda.life` |

---

## 운영 절차

### 새 시크릿 생성 (배포 1회)

```bash
# NEXTAUTH_SECRET (32 bytes base64)
openssl rand -base64 32

# Postgres 비밀번호 (강한 랜덤)
openssl rand -base64 24
```

### Postgres 비밀번호 변경 (배포 1회)

```bash
# 1. 기존 DB에서 비밀번호 변경
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda \
  -c "ALTER USER chatda WITH PASSWORD '<새_비밀번호>';"

# 2. docker-compose.yml의 POSTGRES_PASSWORD 업데이트
# 3. .env.production.local의 DATABASE_URL 업데이트
# 4. backend/.env.production의 DATABASE_URL 업데이트

# 5. 컨테이너 재시작
docker compose down
docker compose up -d db
```

### 시크릿 회전 (정기, 6개월마다 권장)

```bash
# 1. 새 NEXTAUTH_SECRET 생성
NEW_SECRET=$(openssl rand -base64 32)

# 2. .env.production.local + backend/.env.production 양쪽 업데이트
sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEW_SECRET|" \
  /home/dykim/project/ChatDa/.env.production.local \
  /home/dykim/project/ChatDa/backend/.env.production

# 3. 두 서비스 재시작 (동시에 — JWT 키 교체)
sudo systemctl restart chatda-frontend chatda-backend

# 4. 모든 사용자가 재로그인 필요 (기존 세션 무효)
```

---

## 새 변수 추가 시 체크리스트

새로운 환경변수를 추가하게 됐을 때 빼먹지 말 것:

1. [ ] `.env.example`에 키 추가 (값 없이)
2. [ ] `backend/.env.example` 또는 frontend `.env.example` 중 어느 쪽인지 명확히
3. [ ] `.env.local`에 dev 값 추가
4. [ ] `.env.production.local`에 prod 값 추가 (배포 머신에서)
5. [ ] 코드에서 변수 사용 시 fallback / 검증 추가
   ```ts
   const url = process.env.BACKEND_URL ?? 'http://localhost:8001';
   ```
   ```python
   from settings import settings  # pydantic-settings로 자동 검증
   ```
6. [ ] README 또는 이 문서에 변수 설명 추가

---

## 환경변수 검증 (런타임 fail-fast)

서비스가 잘못된 환경에서 조용히 시작되는 게 가장 위험. 부팅 시 검증:

### Frontend (Next.js) — `lib/env.ts` 만들기 (선택)

```ts
const required = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'BACKEND_URL'];
for (const k of required) {
  if (!process.env[k]) throw new Error(`Missing env var: ${k}`);
}
```

`app/layout.tsx` 같은 진입점 server-side에서 `import './env'` 한 번이면 빌드/부팅 시 즉시 실패.

### Backend (FastAPI) — 이미 pydantic-settings로 처리됨

`backend/settings.py`에 필드 있으면 누락 시 ValidationError로 부팅 실패. 이미 적용된 상태로 추정.

---

## "어느 환경인지 헷갈릴 때" 빠른 진단

```bash
# Frontend 서비스가 어느 .env를 읽고 있나
sudo systemctl show chatda-frontend | grep -E "Environment|EnvironmentFile"

# Backend 서비스도
sudo systemctl show chatda-backend | grep -E "Environment|EnvironmentFile"

# 실행 중인 프로세스가 NODE_ENV 뭐로 떴나
ps aux | grep -E "next|uvicorn"
sudo cat /proc/$(pgrep -f 'next start')/environ | tr '\0' '\n' | grep NODE_ENV
```

---

## 자주 만나는 함정

### ❌ `.env.local`을 prod에서도 그대로 쓰기
- `NODE_ENV=production`이어도 `.env.local`이 로드됨
- dev 시크릿이 prod에 들어가는 사고 발생
- **해결**: prod 배포 머신에서 `.env.local`을 지우고 `.env.production.local`만 두기

### ❌ Frontend와 Backend의 `NEXTAUTH_SECRET` 다름
- 백엔드가 모든 요청 401 반환
- **해결**: 두 파일의 값을 정확히 동일하게 (복사 붙여넣기)

### ❌ `.env.production`을 git에 커밋
- `.env*`이 gitignore에 있어도 `.env.production`은 별도 패턴이라 슬쩍 들어갈 수 있음
- **해결**: `.gitignore`에 `.env*` 패턴 명시, 커밋 전 `git status`로 확인

### ❌ 쉘에서 `export NEXTAUTH_SECRET=xxx` 후 systemd로 시작
- systemd 서비스는 그 셸의 환경변수 안 받음. EnvironmentFile= 만 봄
- **해결**: 항상 EnvironmentFile=로 명시, 셸 export는 의미 없음

### ❌ Docker 컨테이너 백엔드 vs 호스트 백엔드 혼재
- 현재 `backend/.env`는 `db:5432` (Docker 내부), `backend/.env.local`은 `localhost:5434` (호스트)
- 둘이 동시에 떠 있으면 어느 게 트래픽 받는지 헷갈림
- **해결**: 프로덕션은 systemd 호스트 실행으로 통일. Docker compose는 DB만 띄움

---

## 요약 1줄

> **"파일은 환경별로, 시크릿은 환경별로 다르게, systemd는 EnvironmentFile=로 명시 — 끝."**
