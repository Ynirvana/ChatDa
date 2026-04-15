# ChatDa 배포 가이드 (chatda.life · 자체 호스팅)

> WSL2 (Ubuntu) + Cloudflare Tunnel 기반 셀프 호스팅. 도메인: **chatda.life**

> ⚠️ **이 문서는 2026-04-15 오전에 작성된 systemd 기반 배포 "계획"입니다.** 실제 배포는 **Docker Compose** 기반으로 진행됐습니다. 현재 운영 중인 구조는 [`docs/deploy/`](../deploy/README.md)를 참조하세요.
>
> 이 문서에서 여전히 유효한 부분:
> - "사전 준비" (WSL2 systemd 활성화, Google OAuth, Cloudflare 도메인 추가)
> - "자주 만나는 이슈" (대부분 그대로 적용됨)
> - "보안 체크" 원칙
>
> 이 문서에서 더 이상 유효하지 않은 부분:
> - "2단계 환경변수" — `.env.production` 대신 `.env.production.local` 사용
> - "3단계 백엔드 CORS" — 현재 FastAPI가 전 origin 허용 상태 (재검토 필요)
> - "4단계 프로덕션 빌드" — `npm run build` 대신 `docker compose build`
> - "5단계 systemd 서비스 등록" — 전체 미사용. Docker Compose로 대체
> - "운영 명령어 치트시트" — Docker Compose 명령어 버전은 [`../deploy/runbook.md`](../deploy/runbook.md)

---

## 아키텍처

```
Internet
   │ HTTPS (Cloudflare 인증서 자동)
   ▼
Cloudflare Tunnel (cloudflared 데몬)
   │
   ▼
Next.js Frontend  (localhost:3000)   ← 외부에 노출되는 유일한 서비스
   │ /api/* → server-side fetch
   ▼
FastAPI Backend   (localhost:8001)   ← 로컬만, 외부 노출 X
   │
   ▼
PostgreSQL        (Docker, localhost:5434)
```

**핵심**: 백엔드와 DB는 절대 외부에 노출되지 않음. Next.js 서버 사이드에서만 백엔드 호출.

---

## 사전 준비 (한 번만)

### 1. WSL2 systemd 활성화

```bash
# /etc/wsl.conf 작성
sudo tee /etc/wsl.conf > /dev/null <<'EOF'
[boot]
systemd=true
EOF
```

PowerShell에서 `wsl --shutdown` 후 다시 진입.

확인: `systemctl --version` 정상 출력되면 OK.

### 2. Google OAuth Console 설정

[console.cloud.google.com](https://console.cloud.google.com) → Credentials → 기존 OAuth 클라이언트 편집:

- **Authorized JavaScript origins**: `https://chatda.life` 추가
- **Authorized redirect URIs**: `https://chatda.life/api/auth/callback/google` 추가

### 3. Cloudflare에 도메인 추가

[dash.cloudflare.com](https://dash.cloudflare.com) → Add a site → `chatda.life` 입력 → Free 플랜 → 네임서버를 도메인 등록업체에서 Cloudflare 것으로 변경 (전파 5분~24시간).

---

## 1단계 — 테스트 데이터 정리

```bash
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda <<'SQL'
-- 테스트 RSVP, 이벤트, 사용자 삭제 (ON DELETE CASCADE로 연관 테이블 자동 정리됨)
DELETE FROM users WHERE email IN ('jun@chatda.test', 'alex@chatda.test');
DELETE FROM events WHERE title = 'ㅇㅇㅇ';
SQL
```

내 계정만 남기고 싶으면:
```bash
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda \
  -c "DELETE FROM users WHERE email != 'dykim9304@gmail.com';"
```

---

## 2단계 — 프로덕션 환경변수

### `/.env.production` (Next.js, 프로젝트 루트)

```bash
NEXTAUTH_URL=https://chatda.life
NEXTAUTH_SECRET=<openssl rand -base64 32 결과>
GOOGLE_CLIENT_ID=<현재 .env에 있는 값>
GOOGLE_CLIENT_SECRET=<현재 .env에 있는 값>

DATABASE_URL=postgresql://chatda:chatda@localhost:5434/chatda
BACKEND_URL=http://localhost:8001
```

새 시크릿 생성:
```bash
openssl rand -base64 32
```

### `/backend/.env` (FastAPI)

```bash
DATABASE_URL=postgresql://chatda:chatda@localhost:5434/chatda
NEXTAUTH_SECRET=<위와 동일한 값>
```

⚠️ Next.js의 `NEXTAUTH_SECRET`과 백엔드의 `NEXTAUTH_SECRET`은 **반드시 동일**해야 함 (JWT 서명 검증).

---

## 3단계 — 백엔드 CORS 업데이트

`backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://chatda.life"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 4단계 — 프로덕션 빌드

```bash
cd /home/dykim/project/ChatDa
npm install
npm run build
```

테스트:
```bash
npm start  # localhost:3000 에서 production 모드 확인
```

---

## 5단계 — systemd 서비스 등록

### Frontend 서비스

`/etc/systemd/system/chatda-frontend.service`:

```ini
[Unit]
Description=ChatDa Next.js Frontend
After=network.target

[Service]
Type=simple
User=dykim
WorkingDirectory=/home/dykim/project/ChatDa
EnvironmentFile=/home/dykim/project/ChatDa/.env.production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Backend 서비스

`/etc/systemd/system/chatda-backend.service`:

```ini
[Unit]
Description=ChatDa FastAPI Backend
After=network.target docker.service

[Service]
Type=simple
User=dykim
WorkingDirectory=/home/dykim/project/ChatDa/backend
EnvironmentFile=/home/dykim/project/ChatDa/backend/.env
ExecStart=/usr/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 활성화

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now chatda-backend
sudo systemctl enable --now chatda-frontend

# 상태 확인
sudo systemctl status chatda-frontend chatda-backend
```

### 로그 확인

```bash
sudo journalctl -u chatda-frontend -f
sudo journalctl -u chatda-backend -f
```

### Postgres (Docker) 자동 재시작 보장

```bash
docker update --restart=always chatda-db-1
```

---

## 6단계 — Cloudflare Tunnel 설치 & 연결

### 설치

```bash
# Cloudflare 공식 apt 저장소
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
```

### 로그인 (브라우저 자동 열림)

```bash
cloudflared tunnel login
```

브라우저에서 chatda.life 선택 → 인증서가 `~/.cloudflared/cert.pem`에 저장됨.

### 터널 생성

```bash
cloudflared tunnel create chatda
```

UUID와 함께 credentials 파일 경로 출력됨 (예: `~/.cloudflared/<UUID>.json`).

### 설정 파일

`~/.cloudflared/config.yml`:

```yaml
tunnel: chatda
credentials-file: /home/dykim/.cloudflared/<UUID>.json

ingress:
  - hostname: chatda.life
    service: http://localhost:3000
  - hostname: www.chatda.life
    service: http://localhost:3000
  - service: http_status:404
```

### DNS 라우팅

```bash
cloudflared tunnel route dns chatda chatda.life
cloudflared tunnel route dns chatda www.chatda.life
```

### systemd 서비스로 등록

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

확인:
```bash
sudo systemctl status cloudflared
```

---

## 7단계 — 검증

1. `https://chatda.life` 접속 → 랜딩 페이지 정상 로드
2. Google 로그인 → 정상 인증
3. 미팅 생성 → DB에 정상 저장
4. RSVP → 호스트 페이지에 신청 표시
5. 모바일에서도 접속 확인

---

## 운영 명령어 치트시트

| 작업 | 명령어 |
|---|---|
| 프론트 재시작 | `sudo systemctl restart chatda-frontend` |
| 백엔드 재시작 | `sudo systemctl restart chatda-backend` |
| 전체 로그 (실시간) | `sudo journalctl -u chatda-frontend -u chatda-backend -f` |
| 빌드 후 배포 | `cd ~/project/ChatDa && npm run build && sudo systemctl restart chatda-frontend` |
| DB 백업 | `docker exec chatda-db-1 pg_dump -U chatda chatda > backup-$(date +%F).sql` |
| DB 복원 | `cat backup.sql \| docker exec -i chatda-db-1 psql -U chatda chatda` |
| 마이그레이션 적용 | `DATABASE_URL=postgresql://chatda:chatda@localhost:5434/chatda npx drizzle-kit migrate` |
| 터널 상태 | `sudo systemctl status cloudflared` + `cloudflared tunnel info chatda` |

---

## 자주 만나는 이슈

### "redirect_uri_mismatch" 로그인 에러
→ Google OAuth Console에 `https://chatda.life/api/auth/callback/google` 추가 안 됨

### 로그인은 되는데 백엔드 호출이 401
→ Next.js의 `NEXTAUTH_SECRET`과 백엔드 `.env`의 `NEXTAUTH_SECRET` 불일치

### 502/Connection refused
→ `chatda-frontend` 서비스 죽었거나 포트 3000 비어있음. `systemctl status` 확인

### WSL2 컴퓨터 재부팅 후 모든 서비스 자동 시작 안 됨
→ Windows에서 WSL2가 자동 시작 안 되는 게 원인. Windows 시작 시 WSL2 자동 시작 설정:
- Windows 작업 스케줄러에 `wsl -d Ubuntu --exec sleep infinity` 부팅 시 실행 등록
- 또는 Windows 11이면 `wsl --install` 최신 버전에서 자동 시작 옵션 활성화

### Postgres 데이터 영구 백업
→ Docker volume `chatda_db_data`(또는 비슷한 이름)에 저장됨. 정기적으로 덤프 백업 권장.

---

## 보안 체크

- [ ] `.env*` 파일들이 `.gitignore`에 포함되어 있음
- [ ] `NEXTAUTH_SECRET`이 dev/prod 다름 (prod는 새로 생성한 값)
- [ ] Postgres 외부 노출 X (`docker ps`에서 0.0.0.0:5434는 호스트만 접근, 인터넷 아님 — WSL2는 NAT 안에 있어서 안전)
- [ ] 백엔드 8001 포트 외부 노출 X (Cloudflare Tunnel은 3000만 노출)
- [ ] Cloudflare 대시보드에서 SSL/TLS → "Full (strict)" 또는 "Flexible" 설정
- [ ] (선택) Cloudflare → Security → Bot Fight Mode 활성화

---

## 향후 개선

- **Sentry/PostHog**: 에러 모니터링, 사용자 분석
- **이미지 → S3/R2**: 사용자 100명 이상 시 base64 → object storage 이전
- **DB 백업 자동화**: cron + S3 또는 Backblaze B2로 야간 스냅샷
- **Healthcheck**: `/health` 엔드포인트 활용한 uptime 모니터링 (UptimeRobot 무료)
