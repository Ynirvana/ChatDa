# 보안·운영 Follow-up Backlog

> 2026-04-15 라이브 후 남은 하드닝 항목. 우선순위는 트래픽/사용자 수가 늘면 재검토.
>
> 적용 완료 항목은 [`../deployment/security-checklist.md`](../deployment/security-checklist.md) 상단 주석 참조.

---

## 1. ⚙️ 자동 DB 백업 cron 등록 (즉시)

스크립트는 이미 있음: [`scripts/backup-db.sh`](../../scripts/backup-db.sh)

### 활성화 방법

```bash
# 1. crontab 편집
crontab -e

# 2. 아래 줄 추가 (매일 04:00 KST)
0 4 * * * /home/dykim/project/ChatDa/scripts/backup-db.sh

# 3. 저장하고 나와서 확인
crontab -l
```

### 동작
- `/home/dykim/chatda-backups/`에 gzip된 pg_dump 저장
- 30일 초과 백업 자동 삭제 (RETENTION_DAYS env로 변경 가능)
- `backup.log`에 타임스탬프 + 용량 기록
- gzip 무결성 검증까지 수행

### 향후 개선
- Slack webhook 알림 (스크립트 하단 주석 해제)
- S3/B2 오프사이트 업로드 (디스크 손상 대비)

---

## 2. 🚦 Rate Limiting (slowapi)

**필요성**: 현재 `/feed/posts`, `/api/auth/*` 등 무제한. 봇/스크립트 학대 가능.

**방식**: FastAPI용 `slowapi` 라이브러리 + 인-메모리 또는 Redis 버킷.

### 구현 스케치

```python
# backend/requirements.txt
slowapi

# backend/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# backend/routers/feed.py
@router.post("/posts")
@limiter.limit("5/minute")
async def create_post(request: Request, ...):
    ...
```

### 권장 제한
| 엔드포인트 | Limit |
|---|---|
| `POST /feed/posts` | 5/min per IP |
| `POST /feed/posts/{id}/comments` | 20/min |
| `POST /rsvp` | 10/min |
| `POST /host/events` | 3/min |
| `POST /events/{id}/memories` | 10/min |
| `/auth/*` (frontend) | Cloudflare WAF Rule로 분리 |

### 예상 작업
- 30~45분
- backend 재빌드

### 우선순위
- **실사용자 50명+** 또는 **스팸 시도 감지 시** 도입
- 그 전엔 Cloudflare 기본 보호로 충분

---

## 3. 🐛 에러 모니터링 (Sentry)

**필요성**: 현재 백엔드 크래시가 `docker logs`에만 남음. 프론트 런타임 에러는 유저 console에서 사라짐.

### 구현
- Sentry 계정 (Developer 플랜 무료 — 5K 이벤트/월)
- Next.js: `@sentry/nextjs`
- FastAPI: `sentry-sdk[fastapi]`

### 환경변수
- `SENTRY_DSN` — 프로젝트별로 다름
- `SENTRY_ENVIRONMENT=production`

### 우선순위
- **무료 플랜으로 지금 당장 가능**
- 첫 실사용자 생기기 전에 설정 권장 (초기 제보 못 받은 버그 잡기 좋음)

---

## 4. 🔑 Google OAuth Client dev/prod 분리

**현 상태**: 하나의 OAuth Client ID를 dev + prod 공유. dev 시크릿 유출 시 prod도 영향.

### 분리 방법
1. Google Cloud Console → 신규 Client 생성 (`ChatDa Prod`)
2. prod Client ID/Secret을 `.env.production.local`에 넣음
3. 기존 Client는 `ChatDa Dev`로 이름 변경, `.env.local`에 유지

### 우선순위
- **실사용자 받기 직전 처리 권장**
- 변경 후 **현재 로그인된 세션 전부 무효화 없음** (JWT는 NEXTAUTH_SECRET 기반, OAuth client는 로그인 흐름에서만 쓰임) — 다운타임 최소

---

## 5. 🔄 `NEXTAUTH_SECRET` 정기 회전

**필요성**: JWT 서명 키 유출 시 누구든 admin 토큰 위조 가능. 주기적 교체로 노출 창 축소.

### 주기
- **6개월마다** (solo 운영 기준)
- 또는 JWT 관련 코드에 보안 이슈 발견 시 즉시

### 회전 절차
[`runbook.md` §8](runbook.md) 참조. 요약:
```bash
NEW_SECRET=$(openssl rand -base64 32)
sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEW_SECRET|" \
  /home/dykim/project/ChatDa/.env.production.local \
  /home/dykim/project/ChatDa/backend/.env.production
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend app
```

**영향**: 모든 사용자 재로그인 필요. 사용자 많아지면 점검 시간 공지 필요.

### 우선순위
- 캘린더에 2026-10-15 알람 걸어두기

---

## 6. 📈 Uptime 모니터링

**필요성**: `https://chatda.life`가 다운됐을 때 즉시 알림 받기.

### 무료 옵션
- **UptimeRobot** — 5분 간격, 50개 모니터 무료
- **BetterStack (Uptime)** — 3분 간격, 10개 무료, 상태 페이지도 자동 생성

### 체크할 URL
- `https://chatda.life/` (홈 200 기대)
- `https://api.chatcity.io/docs` (백엔드 간접 확인 — chatda api는 외부 노출 X)
  - 또는 `https://chatda.life/api/auth/providers` (로그인 페이지 의존성)

### 알림 채널
- 이메일
- (옵션) Slack, Discord webhook

### 우선순위
- **10분이면 세팅**
- 지금 바로 하는 게 이득

---

## 7. 🛡️ Cloudflare 추가 보안

### Bot Fight Mode
- CF Dashboard → chatda.life → Security → Bots → Bot Fight Mode **ON**
- 무료 플랜 가능
- 스팸 봇 자동 차단 (Turnstile 추가 시 더 강력)

### WAF Rules (Custom)
- Security → WAF → Custom rules
- 예: `http.request.uri.path contains "/api/auth/"` AND `http.request.method eq "POST"` → Rate limit 10/min

### Turnstile (CAPTCHA 대체)
- 로그인 폼에 삽입하면 자동화 공격 차단
- 무료, UX 영향 거의 없음 (안 보이게 통과)

### 우선순위
- Bot Fight Mode: 지금 바로 ON (부작용 없음)
- WAF Custom: 트래픽 생긴 후
- Turnstile: 로그인 남용 시

---

## 진행 추적

| # | 항목 | 상태 | 예상 시점 |
|---|---|---|---|
| 1 | DB 백업 cron | 🔲 crontab 등록만 남음 | **지금 5분** |
| 2 | Rate limiting | 🔲 다음 라운드 | 사용자 50명+ 또는 스팸 감지 시 |
| 3 | Sentry | 🔲 | 실사용자 받기 전 |
| 4 | OAuth dev/prod 분리 | 🔲 | 실사용자 받기 직전 |
| 5 | NEXTAUTH_SECRET 회전 | 🔲 | 6개월 (2026-10-15) |
| 6 | Uptime 모니터링 | 🔲 | **지금 10분 (무료)** |
| 7 | Cloudflare Bot Fight Mode | 🔲 | **지금 1분 (CF Dashboard)** |

---

## 즉시 추천 (오늘 10분 투자)

1. **DB 백업 cron 등록** (1번) — 데이터 보호 필수
2. **UptimeRobot 가입 + `chatda.life` 추가** (6번) — 다운 시 알림
3. **CF Dashboard → Bot Fight Mode ON** (7번) — 봇 자동 차단

나머지는 사용자 유입 단계에 맞춰.
