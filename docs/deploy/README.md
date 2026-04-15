# ChatDa 배포 문서 (실제 배포 기준)

> 2026-04-15 chatda.life 라이브 전환 시점의 실제 배포 구조를 문서화. `docs/deployment/`(계획)과 달리 **Docker Compose 기반**으로 구현됨.

## 문서 인덱스

| 문서 | 용도 | 언제 볼 것 |
|---|---|---|
| [architecture.md](architecture.md) | 현재 프로덕션 구조 (포트/도메인/컨테이너/DB) | "지금 시스템이 어떻게 생겼더라?" |
| [runbook.md](runbook.md) | 운영 매뉴얼 (start/stop/logs/update/rollback) | "재시작/업데이트 어떻게 하지?" |
| [security-followup.md](security-followup.md) | 보안/운영 하드닝 backlog (rate limit, Sentry, uptime, CF Bot Fight, ...) | "다음 라운드에 뭐 보강할까?" |
| [2026-04-15-prod-deploy-session.md](2026-04-15-prod-deploy-session.md) | 초기 라이브 전환 세션 로그 | "이 결정 왜 이렇게 했지?" |

## 관련 문서 (다른 디렉토리)

- `docs/deployment/` — **계획 단계 문서** (systemd 기반 제안이었지만 실제로는 Docker Compose로 감)
  - `env-management.md`는 여전히 유효 (환경변수 원칙)
  - `security-checklist.md`는 여전히 유효
- `docs/QA/pre-deploy-qa.md` — 배포 전 QA 체크리스트
- `docs/plans/` — 초기 구현 플랜

## 현재 상태 (요약)

- **도메인**: `https://chatda.life` (Cloudflare Tunnel)
- **인프라**: WSL2 (Ubuntu) 위 Docker Compose
- **구성**: 3컨테이너 (app/backend/db) + cloudflared (systemd) + 로컬 dev 프로세스 병행
- **DB 분리**: `chatda` (prod) / `chatda_dev` (dev) — 같은 Postgres 인스턴스
