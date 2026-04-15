# 2026-04-15 프로덕션 배포 세션 로그

> 오전부터 오후까지 이루어진 chatda.life 초기 라이브 전환의 시간순 기록. 계획 변경 근거와 함정도 포함.

## 요약

- **시작**: `docs/deployment/` 계획은 있었지만 실제 prod 인프라 0
- **끝**: `https://chatda.life` HTTP/2 200, Google OAuth 플로우 작동, 3컨테이너 Docker Compose prod

---

## 1. 초기 상태 파악 (세션 시작 시점)

- ChatDa Next.js **dev 서버** :3000에 Apr 14부터 돌고 있음 (로컬 npm run dev)
- ChatDa **백엔드 uvicorn** :8001에 --reload로 돌고 있음 (anaconda python, 로컬)
- **Postgres** `chatda-db-1` :5434 Docker로 돌고 있음, DB `chatda` 하나, 마이그레이션 12개 전부 적용됨
- **Cloudflare Tunnel** 이미 존재 (UUID `8dca3205-...`, 이름 `chatcity`). **`chatcity.io` 도메인을 서빙하는 중** (Unique visitors 523, 다른 프로젝트)
- **포트 8000** 점유: `chatcity-backend-1` 컨테이너 (47시간째). 이건 ChatCity라는 별개 프로젝트의 백엔드
- **NextAuth v5 beta** 설정돼있으나 `trustHost` 누락
- **기존 docs** (`docs/deployment/`)는 **systemd 기반 배포 계획**을 전제로 작성됨

---

## 2. 코드 변경

### 2.1 NextAuth `trustHost: true` 추가

**파일**: `lib/auth.ts`

**문제**: `@auth/core`의 env.js가 `trustHost`를 다음 중 하나 있을 때만 true로 설정:
- `AUTH_URL`, `AUTH_TRUST_HOST`, `VERCEL`, `CF_PAGES` 환경변수
- 또는 `NODE_ENV !== 'production'`

우리는 self-hosted + prod이라 **이 중 아무것도 해당 없음** → prod에서 `UntrustedHost` 에러로 모든 로그인 시도 차단.

**해결**: 코드에 `trustHost: true` 박음 (env 의존성 제거).

### 2.2 Nav 드롭다운 (Profile / Logout)

**파일**: `components/ui/Nav.tsx`

**문제**: 로그인 상태에서 로그아웃 방법이 **UI에 없었음**. 아바타는 `/profile`로 이동만. `lib/auth.ts`가 `signOut` export하지만 어디서도 안 씀.

**해결**: 아바타 클릭 → 드롭다운 (Profile 링크 + Log out 버튼). `signOut({ callbackUrl: '/' })` 호출. Click-outside + Esc 닫기, pathname 변경 시 auto close, ARIA role 설정.

### 2.3 온보딩 리다이렉트 정리

**파일**: `app/onboarding/page.tsx`, `app/profile/page.tsx`

**문제**: 기존 로직상 **이미 온보딩 끝난 유저가 로그인 후에도 `/onboarding` 폼을 다시 봄** (edit 모드 느낌으로 기존 값 prefill). 사용자 기대와 다름.

**해결**: `/onboarding`에 `?edit=1` 쿼리 추가. 
- `isReturning && !edit=1` → `/meetups`로 리다이렉트
- `/profile`의 Edit 링크를 `/onboarding?edit=1`로 변경

### 2.4 Card 컴포넌트 `clickable` prop 추가

**파일**: `components/ui/Card.tsx`

**문제**: `Card`는 `onClick` 있을 때만 hover 효과. EventCard는 `<Link>`로 감싸서 Card에 onClick 없음 → hover 피드백 X.

**해결**: 새 prop `clickable` 도입. `onClick || clickable` 중 하나면 hover 동작. 다른 11개 Card 사용처는 영향 없음.

### 2.5 EventCard — hover + 참가자 아바타

**파일**: `components/EventCard.tsx`, `lib/server-api.ts`, `app/meetups/page.tsx`, `backend/routers/events.py`

**추가한 것**:
- `Card clickable` — hover 시 translate(-2px) + 오렌지 border + glow shadow
- `AttendeeStack` 컴포넌트 — 상위 5명 아바타 겹쳐서 (Instagram 스타일) + "+N" overflow + "N going" 카피
- 빈 이벤트: "Be the first to join →" 카피

**백엔드 변경** (`backend/routers/events.py`):
- `EventOut`에 `attendee_previews: list[AttendeePreview]` 필드 추가
- `list_events`에서 이벤트 리스트 쿼리 후 추가 쿼리로 `approved` RSVP의 유저 정보 fetch → 이벤트별 Python에서 상위 5명 슬라이스

**프론트 타입 동기화**: `ApiAttendeePreview` 인터페이스 추가, `EventSummary` 확장.

---

## 3. Docker Compose dev/prod 분리

### 기존 상태
- `docker-compose.yml` 하나에 db + backend + app 모두 정의
- dev는 로컬 프로세스, prod는 미정
- `backend/.env.production` 파일은 있지만 compose가 안 읽음 (`env_file: backend/.env`만 로드)
- 환경 분리 불완전

### 재설계 결정사항
- **3-file compose 구조**: base (db) + dev override + prod override
- **같은 Postgres 인스턴스 공유, 다른 DATABASE**: `chatda` (prod), `chatda_dev` (dev) 분리
- **포트 분리**: dev 3000/8001, prod 3001/8000
- **Prod에 `restart: unless-stopped` + healthcheck + mem/cpu limit**

### 만든 파일
- `.dockerignore` (env 파일, node_modules, .next 등 이미지에서 제외)
- `Dockerfile` 리팩토링 (deps → builder → runner 3-stage)
- `db/init/01-create-dev-db.sql` (새 DB 볼륨 생성 시 auto-create chatda_dev)
- `docker-compose.yml` (base, DB만)
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`

### DB 분리 실행
- **옵션 (B)** 선택: 빈 `chatda_dev` 만들고 마이그레이션 적용. 기존 `chatda`는 prod로 남김 (seed 테스트 데이터 유지, 배포 직전 정리하기로)
- `CREATE DATABASE chatda_dev OWNER chatda;` 수동 실행
- drizzle migrate로 chatda_dev에 12개 마이그레이션 적용

---

## 4. 포트 충돌 해결 — ChatCity 이동

### 문제
- Prod 계획: ChatDa 백엔드 :8000
- 실제: :8000은 `chatcity-backend-1`이 47시간째 점유 중 (다른 프로젝트)

### 결정
- ChatDa가 메인 프로젝트라 :8000을 가져가고 **ChatCity를 :8002로 이동**
- ChatCity는 토이 프로젝트라 다운타임 감수 허용

### 실행
- `/home/dykim/project/ChatCity/docker-compose.yml` backend 포트 `8000:8000` → `8002:8000`
- `docker compose up -d backend`로 재생성 → :8002 리스닝 확인
- `/etc/cloudflared/config.yml`에서 `api.chatcity.io` → `localhost:8002`로 변경
- `~/.cloudflared/config.yml` 동기화
- `sudo systemctl restart cloudflared`
- 검증: `curl -I https://api.chatcity.io/` → HTTP 404 (chatcity 백엔드가 `/`에 라우트 없어서 404 = 터널 관통 정상)

---

## 5. Cloudflare 세팅 (chatda.life 도메인)

### 도메인 상태 (세션 시작 시점)
- 구매: **hosting.kr**에서 이미 구매
- Cloudflare 추가: **안 됨**
- 네임서버: hosting.kr 기본

### 진행
1. **Cloudflare에 chatda.life 추가** (Free 플랜)
   - AI Crawlers: "Block on all pages" 선택 (사용자 프로필 노출 때문)
   - DNS 자동 임포트 — A 레코드 2개 (`99.83.196.71`, `75.2.85.42`) 잡혔음. 이건 어딘가의 주차 IP
2. **hosting.kr에서 네임서버 교체**
   - ns1~4.hosting.co.kr → alec.ns.cloudflare.com, alice.ns.cloudflare.com
3. **DNS propagation 대기** (~15분)
   - SOA가 cloudflare로 전환된 시점이 전파 확정 신호
4. **Cloudflare Dashboard DNS 정리**
   - 자동 임포트된 A 레코드 2개 **삭제**
   - 터널 CNAME 추가: `chatda.life → 8dca3205...cfargotunnel.com` Proxied
   - `www.chatda.life → chatda.life` (유지)

### 함정 — cloudflared CLI route 명령 잘못됨
```bash
cloudflared tunnel route dns 8dca3205-... chatda.life
# → Added CNAME chatda.life.chatcity.io which will route to this tunnel  ❌
```
**원인**: `~/.cloudflared/cert.pem`이 3월 8일 `cloudflared tunnel login`에서 **chatcity.io zone만 인증**. chatda.life zone 권한 없어서 fallback으로 chatcity.io의 서브도메인으로 추가.

**해결**: Dashboard에서 수동으로 chatda.life zone에 CNAME 추가. 잘못 만들어진 `chatda.life.chatcity.io` 레코드 2개는 chatcity.io zone에서 수동 삭제.

### SSL/TLS 설정
- Encryption mode: **Full**
- Always Use HTTPS: ON
- Min TLS Version: 1.2

### Cache Rules
- `/api/*` → Bypass cache
- `/_next/static/*` → Cache eligible, Edge TTL 1년

---

## 6. Cloudflared ingress 추가

### 기존 ingress (chatcity만)
```yaml
ingress:
  - hostname: chatcity.io          → http://localhost:3000
  - hostname: api.chatcity.io      → http://localhost:8002
  - hostname: "*.chatcity.io"      → http://localhost:3000
  - service: http_status:404
```

### 추가 후
```yaml
ingress:
  - hostname: chatcity.io          → http://localhost:3000
  - hostname: api.chatcity.io      → http://localhost:8002
  - hostname: "*.chatcity.io"      → http://localhost:3000
  - hostname: chatda.life          → http://localhost:3001
  - hostname: www.chatda.life      → http://localhost:3001
  - service: http_status:404
```

### 함정 — 터널 이름 변경 불가
사용자가 라벨 `chatcity` → `Y-SERVER`로 바꾸고 싶어했음. 시도한 경로:
1. `cloudflared tunnel rename` — **이 버전 CLI에 없음**. 주 명령이 login/create/route/vnet/run만
2. Zero Trust Dashboard → 해당 터널이 **locally-managed**라 Migrate 없이 rename 불가. Migrate는 irreversible이라 포기
3. CF API로 PATCH 가능하나 API 토큰 발급 필요 → 배포 이후로 미룸

**결론**: 이름은 `chatcity` 유지. 라벨일 뿐 동작 영향 0.

---

## 7. Prod Docker Compose 기동

### 실행
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

빌드 시간 약 2~3분 (deps → builder → runner, backend pip install).

### 컨테이너 구성 결과
- `chatda-app` :3001 (Next.js standalone, healthy)
- `chatda-backend` :8000 (FastAPI, healthy)
- `chatda-db-1` :5434 (Postgres, healthy, 기존 볼륨 유지)

### 검증
```bash
curl -I https://chatda.life/             # HTTP/2 200 ✓
curl -I https://chatda.life/login        # 200 ✓
curl -s https://chatda.life/api/auth/providers  # Google provider with callback URL = https://chatda.life/... ✓
```

- `__Host-authjs.csrf-token` 쿠키 Secure 플래그 ✓ (HTTPS 인식)
- `__Secure-authjs.callback-url=https%3A%2F%2Fchatda.life` ✓ (NEXTAUTH_URL 올바름)
- `x-powered-by: Next.js` ✓ (Cloudflare 경유 확인)
- Next.js 로그: `✓ Ready in 0ms`

---

## 8. 라이브 후 추가 작업

### 8.1 보안 헤더 + 백엔드 하드닝 (QA 후 보강)
- `next.config.ts`: HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy 5종 추가
- `backend/main.py`: 15MB body size 미들웨어 (JSONResponse로 413 반환 — HTTPException 경로는 500됨), CORS allow_origins를 `chatda.life`/`www.chatda.life`로 명시 (기존 오타 `chatda.app` 수정)
- `docker-compose.prod.yml` app 서비스에 `HOSTNAME: "0.0.0.0"` 추가 — Next.js standalone의 healthcheck 버그 수정 (Docker가 HOSTNAME을 컨테이너ID로 세팅해서 0.0.0.0에 바인드 안 됨)

### 8.2 Prod DB 테스트 데이터 정리
jun@chatda.test / alex@chatda.test + 3개 이벤트 + 관련 RSVP/social/memories 삭제. 실계정(dykim9304, gpt.plus.openai)은 유지.

### 8.3 관리자 (모더레이션) 기능 추가
**요구**: "욕설하는 유저는 삭제할 수 있어야 최소"

**선택**: `ADMIN_EMAILS` 환경변수 기반 (DB 스키마 변경 없이, env만으로 on/off).

**구현:**
- `backend/settings.py`: `admin_emails: str` + `admin_email_list` property
- `backend/auth.py`: `is_admin_email(email)`, `require_admin` dependency
- `backend/routers/admin.py` (신규): `/admin/overview` (GET), `/admin/users/{id}` (DELETE cascade), `/admin/events/{id}` (DELETE cascade)
- `backend/routers/{feed,memories}.py`: 기존 DELETE 엔드포인트에 `email` 의존성 추가 + `is_admin_email(email)` override 허용
- `backend/routers/host.py`: 기존 host-only 체크 유지 (admin은 별도 admin 경로로 처리)
- `lib/admin.ts` (신규): `isAdminEmail(email)` 헬퍼 (server-side only)
- `app/admin/page.tsx`: 서버 컴포넌트, 비admin은 `/`로 리다이렉트
- `app/admin/AdminClient.tsx`: 5탭 UI (Posts/Comments/Memories/Users/Events) + 각 행 Delete 버튼
- `app/api/admin/{users,events}/[id]/route.ts`: Next.js 프록시
- `components/ui/Nav.tsx`: `isAdmin` prop 추가 → 드롭다운에 Admin 링크
- 모든 페이지의 `<Nav user>` 호출처 7곳에 `isAdmin={isAdminEmail(session?.user?.email)}` 주입

**배포 절차:** `.env.production.local` + `backend/.env.production` 양쪽에 `ADMIN_EMAILS=dykim9304@gmail.com` 추가 → `docker compose ... up -d`로 env 재주입 (rebuild 불필요, 이미 새 이미지 빌드됨).

**제거한 죽은 코드**: `backend/settings.py`의 `host_email` 필드 (초기 계획에 있었으나 "모든 로그인 유저가 호스팅 가능"으로 변경되며 미사용).

---

## 9. 남은 작업 / 의도적 미루기

### 정리 대기
- `chatda` prod DB의 **테스트 seed 데이터 3개** (Jun 유저 등) — 실사용자 생기기 전 TRUNCATE 필요
- **www → apex 301 redirect** — 현재 둘 다 같은 콘텐츠. CF Redirect Rule 한 줄로 해결 가능
- **터널 이름 `Y-SERVER`로 변경** — CF API 경유 가능. 우선순위 낮음

### 기존 docs와의 괴리
- `docs/deployment/README.md`는 systemd 기반 가정. 우리는 Docker Compose.
  - 해당 문서의 "5단계 systemd 등록", "4단계 프로덕션 빌드" 부분은 **현재 배포와 맞지 않음**
  - `env-management.md`, `security-checklist.md`는 여전히 유효 (환경변수 원칙, 보안 체크)
- `docs/deploy/` (이 디렉토리)가 현재 실제 배포 기준의 **단일 진실 공급원(source of truth)**

### 향후 개선
- Google OAuth client를 **dev/prod 분리**
- `NEXTAUTH_SECRET`을 **dev/prod 다른 값으로** (현재 동일할 가능성)
- Sentry 등 에러 모니터링
- DB 자동 백업 cron
- Uptime 모니터링 (UptimeRobot 등)

---

## 10. 이 세션에서 수정된 파일 (커밋 대상)

```
M  .gitignore                               (기존, 변경 X)
M  CLAUDE.md                                (기존, 변경 X)
M  app/globals.css                          (Orb 관련, 세션 중엔 롤백)
M  app/layout.tsx                           (기존)
M  app/onboarding/page.tsx                  ← 수정 (returning user redirect)
M  app/profile/page.tsx                     ← 수정 (Edit link ?edit=1)
M  next.config.ts                           (기존)
M  package.json, package-lock.json          (기존)
?? .dockerignore                            ← 신규
?? .env.example                             (기존)
?? Dockerfile                               ← 수정 (deps/builder/runner 3단계)
?? app/api/, app/feed/, app/host/, ...      (세션 외 기존 작업)
?? backend/                                 (대부분 기존)
M  backend/routers/events.py                ← 수정 (attendee_previews)
?? components/ui/Card.tsx                   ← 수정 (clickable prop)
?? components/ui/Nav.tsx                    ← 수정 (드롭다운)
?? components/EventCard.tsx                 ← 수정 (hover + AttendeeStack)
?? db/, db/init/01-create-dev-db.sql        ← 신규
?? docker-compose.yml                       ← 수정 (base만)
?? docker-compose.dev.yml                   ← 신규
?? docker-compose.prod.yml                  ← 신규
?? docs/deploy/                             ← 신규 (이 문서 포함)
?? lib/auth.ts                              ← 수정 (trustHost)
?? lib/server-api.ts                        ← 수정 (AttendeePreview type)
?? proxy.ts                                 (기존)
?? scripts/seed.ts                          (기존)
?? app/meetups/page.tsx                     ← 수정 (attendee_previews mapping)
```

---

## 11. 결정 로그 (Why)

| 결정 | 선택 | 이유 |
|---|---|---|
| Dev/Prod 격리 | 같은 머신, 다른 Docker compose, 다른 DATABASE | 솔로 MVP 수준이라 별도 서버 오버킬. DB 데이터는 격리. |
| 터널 재사용 vs 새 터널 | 기존 chatcity 터널 재사용 | 하나 터널이 여러 도메인 ingress 가능. 추가 비용 0. |
| systemd vs Docker Compose (서비스 관리) | **Docker Compose** | 이미지 빌드 일관성, 격리, 로그 통합. systemd 계획서는 작성만 했고 실제론 채택 안 함. |
| DB 분리 방식 | 같은 인스턴스의 다른 DATABASE | 완전 별도 컨테이너는 오버킬. 격리 수준 충분. |
| 기존 chatcity 터널 라우트 | 유지 (chatcity.io, api.chatcity.io, *.chatcity.io) | 다른 프로젝트 라이브 트래픽 보호 |
| chatcity backend 이동 | :8000 → :8002 | ChatDa가 메인이고 chatcity는 토이. 좋은 포트(:8000)를 ChatDa에. |
| 터널 라벨 변경 | 스킵 (chatcity 그대로) | CLI 미지원 + Migrate는 irreversible. 라벨은 내부용이라 동작 영향 0. |
| `NEXTAUTH_SECRET` dev/prod | (현재 동일로 추정) | 배포 급해서 향후 분리로 미룸 |
| www/apex 전략 | 둘 다 같은 콘텐츠로 (301 아직 안 함) | CF Redirect Rule은 언제든 추가 가능 |
| Admin 구현 방식 | `ADMIN_EMAILS` env 화이트리스트 | DB 스키마 변경 없이 admin on/off 가능. solo MVP에 적합. 유저 50명+면 `users.role` 컬럼으로 마이그레이션 고려 |
| Admin UI 위치 | `/admin` 전용 페이지 (기존 페이지에 admin 버튼 박지 않음) | 실수 삭제 방지, 관심사 분리, 일반 유저 UI 영향 0 |
| 유저 삭제 방식 | Cascade 수동 delete (FK cascade 미정의) | DB FK 재설계는 별개 작업. 수동 cascade로 MVP 커버 |
