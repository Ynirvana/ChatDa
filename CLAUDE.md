@AGENTS.md

---

# 현재 상태 (2026-04-17 — 프로덕션 라이브, v4 Step 2 배포 완료)

- **Live**: https://chatda.life (Cloudflare Tunnel + self-hosted Docker Compose)
- **Stack**: Next.js 16.2.3 (App Router, standalone) + FastAPI + Postgres 16, 전부 Docker
- **Auth**: Google OAuth only (NextAuth v5, `trustHost: true`). 비밀번호 없음.
- **Admin**: `ADMIN_EMAILS` env whitelist (DB role 컬럼 없음) → `/admin` UI. 본인/타 admin 삭제 차단 (self-protect).
- **DB**: Postgres 한 인스턴스, DATABASE 분리 — `chatda` (prod) / `chatda_dev` (dev)
- **Middleware 파일명**: `proxy.ts` (Next.js 16에서 `middleware.ts`에서 리네임됨)
- **최신 마이그레이션**: `0017_orange_the_stranger.sql` — platform enum에 `threads` 추가

## 제품 방향 (기획서 v4 — 2026-04-16)

**"한국에 있는 외국인과 로컬을 프로필 기반으로 연결하는 플랫폼"** — "한국판 외국인 The Facebook".

- **People 탭이 첫 탭** (핵심). Meetups는 **부트스트랩 수단**(밋업 → 프로필 등록 유도). Feed는 유저 밀도 전엔 제외.
- 판단 기준: 모든 기능은 "People 탐색/매칭에 기여하는가"로 가중.
- 랜딩 카피: Tag "Korea's cross-cultural network" / Headline "See who else is here in Korea." / CTA "Browse Profiles →" (`/people`)
- 온보딩 Step 1 (30초, 6필드 필수): 사진 / Display name / Nationality(combobox 197개) / Current location(광역 14개) / I am a...(5개: local/expat/visitor/visiting_soon/visited_before) / What brings you here(10개 모티브 중 1~3개) + Bio optional. 소셜 링크는 accordion optional, connect accepted 후에만 공개.
- Step 2 (프로필 페이지 인라인): 체류 기간(status별 분기) / Languages(언어+레벨) / Interests(20개 프리셋 최대 10) / 태그(can_do/looking_for) / 소셜 링크. ProfileCompleteness 바로 진척률 표시.
- **People 카드**: LinkedIn 스타일 — status별 커버 그라데이션 + 원형 아바타 + mutual count + outline Connect 버튼.
- **People 필터 7개** (커스텀 FilterSelect, 네이티브 select 금지): Location / Nationality(Combobox) / Status / What they offer / Language / What brings them / Has social(특정 플랫폼 필터).

## 반드시 먼저 읽을 문서 (작업 전)
- [`docs/ChatDa.md`](docs/ChatDa.md) — 제품 기획서 **최신 (v4)**. 이전 v3 종합본(BM/로드맵/경쟁사 상세)은 `docs/ChatDa-v3-archive.md`
- [`docs/deploy/architecture.md`](docs/deploy/architecture.md) — 현재 시스템 구조 (포트/컨테이너/DB/CF)
- [`docs/deploy/runbook.md`](docs/deploy/runbook.md) — 운영 명령 (start/logs/update/rollback/백업/마이그레이션)
- [`docs/deploy/security-followup.md`](docs/deploy/security-followup.md) — 남은 하드닝 backlog

## 포트 맵 (빠른 참조)
| 서비스 | Dev 호스트 | Prod 호스트 | 컨테이너 |
|---|---|---|---|
| Next.js | 3000 (로컬) | **3001** (prod container) | 3000 |
| Backend | 8001 (로컬 uvicorn) | **8000** (prod container) | 8000 |
| Postgres | 5434 (공유) | 5434 (공유) | 5432 |

## DB 마이그레이션 규칙 (중요)
- `npm run db:migrate` → **`chatda_dev`** (항상 먼저 dev에)
- `npm run db:migrate:prod` → `chatda`. `scripts/migrate-prod.sh`가 `APPLY` 타이핑 요구. 오타나 엔터로 abort.
- 순서: `db:generate` → SQL 검토 → `db:migrate` → 검증 → **백업** → `db:migrate:prod` → 컨테이너 rebuild
- 자세히: [`runbook.md §5`](docs/deploy/runbook.md)

## 절대 건드리지 말 것
- `chatcity*` — 별개 프로젝트 (같은 터널 공유, 사용자 523명 라이브). `/etc/cloudflared/config.yml`의 chatcity.io / api.chatcity.io(→:8002) / *.chatcity.io ingress 룰 유지.
- cloudflared 터널 라벨 "chatcity" — locally-managed 터널이라 rename 불가. 그대로 둬.

---

# Secret hygiene — `.env*` 파일은 절대 읽지 마

**금지 사항:**
- `.env`, `.env.local`, `.env.production`, `.env.production.local`, `.env.development`, `backend/.env*` 등 **모든 `.env*` 파일을 절대로 `cat`, `head`, `tail`, `Read` 도구 등으로 읽지 말 것**
- 시크릿이 들어있을 가능성이 있는 파일 (`*.pem`, `*.key`, `credentials.json`, `~/.cloudflared/*.json`)도 동일
- `grep`으로 검색할 때도 시크릿 값이 노출될 수 있는 패턴 (예: `grep -r "GOCSPX" .env*`) 금지

**필요한 경우 처리법:**
1. **존재 여부만 확인**해야 한다면: `ls .env.local` 또는 `test -f .env.local && echo "exists"`
2. **키 이름만 확인**해야 한다면 사용자에게 직접 물어봐: *"`.env.local`에 `BACKEND_URL` 키가 들어있어? 값은 알려주지 말고 yes/no만"*
3. **새 환경변수가 필요**하면: 사용자에게 *"이러이러한 키를 `.env.local`에 추가해줘. 값은 X 형식으로"* 라고 가이드만 줄 것
4. **디버깅 중 실제 값 검증이 필요**하면: 사용자에게 마스킹해서 보여달라고 요청 (예: 첫 5자리만, 또는 길이만)

**예외:**
- `.env.example` (시크릿 없는 템플릿)은 읽고 수정 가능
- `.env*` 파일을 **생성**할 때 placeholder (`<FILL_IN_HERE>` 등)로만 작성하고, 실제 값은 사용자가 직접 채우도록 안내

**이유:** 시크릿이 한 번이라도 대화 로그에 등장하면 유출된 것으로 간주됨. 시크릿 회전 비용/위험 회피.
