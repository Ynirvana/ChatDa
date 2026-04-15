@AGENTS.md

---

# 현재 상태 (2026-04-15 — 프로덕션 라이브)

- **Live**: https://chatda.life (Cloudflare Tunnel + self-hosted Docker Compose)
- **Stack**: Next.js 16.2.3 (App Router, standalone) + FastAPI + Postgres 16, 전부 Docker
- **Auth**: Google OAuth only (NextAuth v5, `trustHost: true`). 비밀번호 없음.
- **Admin**: `ADMIN_EMAILS` env whitelist (DB role 컬럼 없음) → `/admin` UI
- **DB**: Postgres 한 인스턴스, DATABASE 분리 — `chatda` (prod) / `chatda_dev` (dev)
- **Middleware 파일명**: `proxy.ts` (Next.js 16에서 `middleware.ts`에서 리네임됨)

## 반드시 먼저 읽을 문서 (작업 전)
- [`docs/deploy/architecture.md`](docs/deploy/architecture.md) — 현재 시스템 구조 (포트/컨테이너/DB/CF)
- [`docs/deploy/runbook.md`](docs/deploy/runbook.md) — 운영 명령 (start/logs/update/rollback/백업)
- [`docs/deploy/security-followup.md`](docs/deploy/security-followup.md) — 남은 하드닝 backlog

## 포트 맵 (빠른 참조)
| 서비스 | Dev 호스트 | Prod 호스트 | 컨테이너 |
|---|---|---|---|
| Next.js | 3000 (로컬) | **3001** (prod container) | 3000 |
| Backend | 8001 (로컬 uvicorn) | **8000** (prod container) | 8000 |
| Postgres | 5434 (공유) | 5434 (공유) | 5432 |

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
