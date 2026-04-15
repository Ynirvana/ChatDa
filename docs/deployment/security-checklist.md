# 배포 전 보안 체크리스트

> 배포 전 반드시 확인해야 할 항목. 🔴 = 차단 (수정 전 배포 금지), 🟡 = 강력 권장, 🟢 = 향후 개선.
>
> **2026-04-15 라이브 후 적용된 것들 (✅ 마크):** 보안 헤더 5종, 백엔드 body size 15 MiB 미들웨어 (JSONResponse 413), CORS 명시 (chatda.life + www), NextAuth `trustHost: true`, `ADMIN_EMAILS` 기반 모더레이션 UI, 입력 검증 (Pydantic `Field(max_length=...)`, 개별 이미지 ~4.5 MiB 제한), `GET /events/{id}` attendees는 인증된 viewer에게만 (프론트 "Sign in to see" 가드의 백엔드 대응).
>
> **여전히 갭 (🟡 다음 라운드):** rate limiting (slowapi), 페이지네이션, Sentry 에러 모니터링, dev/prod OAuth 클라이언트 분리, `NEXTAUTH_SECRET` 정기 회전.

---

## 🔴 차단 항목 (배포 전 필수 수정)

### 1. 시크릿/환경변수 노출
- [ ] **`.env*` 파일이 `.gitignore`에 포함됨**
  ```bash
  grep -E "^\.env" .gitignore
  ```
- [ ] **git 히스토리에 시크릿 커밋 안 됨**
  ```bash
  git log --all --full-history -- "*.env*"
  git log -p | grep -iE "(client_secret|password|nextauth_secret)" | head
  ```
  → 발견 시 `git filter-repo`로 제거하고 OAuth/시크릿 모두 재발급
- [ ] **`NEXTAUTH_SECRET`이 dev/prod 다름** (prod는 `openssl rand -base64 32`로 새로 생성)
- [ ] **Google OAuth Client Secret이 `.env.production`에만, 코드에 하드코딩 X**
  ```bash
  grep -rn "GOOGLE_CLIENT_SECRET\|GOCSPX" --include="*.ts" --include="*.tsx" --include="*.py"
  ```

### 2. JWT 시크릿 일관성
- [ ] **Next.js `NEXTAUTH_SECRET`과 백엔드 `.env`의 `NEXTAUTH_SECRET`이 동일**
  - 둘이 다르면 백엔드가 모든 요청을 401로 거절함
  - 동시에 둘 다 prod용 새 시크릿으로 교체

### 3. Postgres 외부 노출 차단
- [ ] **Postgres 컨테이너가 외부 인터넷에 노출 X**
  ```bash
  docker ps | grep db
  # 포트 매핑이 0.0.0.0:5434->5432인 건 OK (WSL2 NAT 안이라 안전)
  # 단, Windows 호스트가 외부에서 5434를 포워딩하면 위험 → 라우터 포트 포워딩 설정 확인
  ```
- [ ] **Postgres 비밀번호가 기본값(`chatda`) 아님 — 프로덕션은 강한 비밀번호로 변경**
  ```bash
  # docker-compose.yml의 POSTGRES_PASSWORD + DATABASE_URL 양쪽 모두 업데이트
  ```

### 4. 백엔드 외부 노출 차단
- [ ] **uvicorn이 `127.0.0.1`에만 바인드 (0.0.0.0 X)**
  - systemd 서비스 ExecStart에 `--host 127.0.0.1` 명시
  - Cloudflare Tunnel은 frontend(:3000)만 노출, 백엔드는 로컬만

### 5. CORS 도메인 제한
- [ ] **`backend/main.py`의 `allow_origins`에 와일드카드(`"*"`) 없음**
  - 현재: `["http://localhost:3000", "https://chatda.life"]` 정확한 origin만 허용
- [ ] **`allow_credentials=True`일 때 와일드카드 origin 사용 금지** (현재 OK)

### 6. Google OAuth Redirect URI 화이트리스트
- [ ] **Google Cloud Console에 등록된 redirect URI가 `https://chatda.life/api/auth/callback/google`만**
- [ ] 개발용 `http://localhost:3000` URI는 별도 OAuth 클라이언트로 분리 (선택)

---

## 🟡 강력 권장 (배포 전 처리)

### 7. 입력 값 제한 (DoS 방지)
이미지 업로드가 base64로 DB에 저장되기 때문에 크기 제한이 특히 중요.

- [ ] **백엔드에 요청 본문 크기 제한 추가** (Cloudflare 기본 100MB지만 우리는 더 작게)
  - `backend/main.py`에 미들웨어:
  ```python
  from fastapi import Request, HTTPException
  
  @app.middleware("http")
  async def limit_body_size(request: Request, call_next):
      MAX = 15 * 1024 * 1024  # 15MB
      if request.headers.get("content-length"):
          if int(request.headers["content-length"]) > MAX:
              raise HTTPException(status_code=413, detail="Payload too large")
      return await call_next(request)
  ```
- [ ] **프론트엔드도 업로드 전 파일 크기 체크**
  - `MemoriesSection.tsx`, `OnboardingForm.tsx`, `CreateEventForm.tsx`의 파일 입력에 5MB 제한 등 추가
- [ ] **현재 글자 수 제한** (이미 적용됨, 확인용)
  - 게시글 1000자, 댓글 500자, 메모리 본문 1000자, 메모리 사진 10장 — OK

### 8. 비공개 데이터 노출 점검
- [ ] **`GET /events/{id}`이 누구에게 무엇을 보여주는지 의도와 일치**
  - 현재: 비로그인도 attendees 정보 가져옴. 프론트에서 비로그인엔 가림 → **하지만 API는 그대로 노출됨**
  - 권장: 백엔드에서 비로그인이면 attendees 빈 배열 반환 (또는 인증 필수)
- [ ] **`GET /users/me` 외에 다른 사용자 프로필 조회 엔드포인트 없는지** (있으면 누가 무엇을 볼 수 있는지 확인)
- [ ] **메모리 사진은 누구에게 노출되는지** — 현재 GET `/events/{id}/memories`는 공개. 의도 맞으면 OK, 아니면 인증 필수로 변경

### 9. Authorization 누락 점검
- [ ] **타인의 RSVP/post/comment를 수정·삭제할 수 없는지 코드 검토**
  ```bash
  # 모든 PATCH/DELETE 라우트 훑어보기
  grep -rn "@router\.\(patch\|delete\)" backend/routers/
  ```
  - 각 라우트가 `if x.user_id != user_id: raise 403` 체크하는지 확인
  - 현재 확인된 것: posts, comments, events, memories, host pending 모두 권한 체크 있음 ✅

### 10. 보안 헤더
`next.config.js`에 추가:
```js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    },
  ];
}
```
- [ ] **HSTS** (HTTPS 강제 — 1년)
- [ ] **X-Frame-Options: DENY** (clickjacking 방지)
- [ ] **X-Content-Type-Options: nosniff**
- [ ] **Referrer-Policy**

### 11. Cloudflare 보안 설정
대시보드에서:
- [ ] **SSL/TLS → Full (strict)** 설정
- [ ] **Always Use HTTPS** ON
- [ ] **Bot Fight Mode** ON (무료 플랜 가능)
- [ ] **Security Level: Medium** 이상
- [ ] **Page Rules** — `/api/*`는 Cache 끄기 (인증 응답 캐시되면 큰일)
- [ ] (선택) **Rate Limiting** 무료 플랜 — `/api/auth/*`에 분당 10회 등

### 12. 의존성 취약점 스캔
- [ ] **npm 취약점 점검**
  ```bash
  npm audit --production
  ```
  → high/critical 있으면 `npm audit fix` 또는 수동 업데이트
- [ ] **Python 취약점 점검**
  ```bash
  pip install pip-audit
  cd backend && pip-audit
  ```

### 13. XSS 점검
React는 기본적으로 escape 해주지만, 위험 패턴 확인:
```bash
grep -rn "dangerouslySetInnerHTML" --include="*.tsx" --include="*.ts"
grep -rn "innerHTML" --include="*.tsx" --include="*.ts"
```
- [ ] 검색 결과에 사용자 입력이 들어가는 곳 없는지 확인 (현재 없음 ✅)
- [ ] **사용자 작성 콘텐츠 (post/comment/memory content)에 `<a>` 자동 링크 변환 시 `rel="noopener noreferrer nofollow"` 누락 X**
  - 현재 자동 링크화 없음. 추가 시 주의

### 14. 사진/파일 업로드 검증
- [ ] **base64 prefix가 `data:image/...`로 시작하는지 백엔드에서 검증**
  - 사용자가 임의 base64를 보내면 DB가 텍스트 폭탄 받음
  ```python
  if not photo.startswith("data:image/"):
      raise HTTPException(400, "Invalid image")
  ```
- [ ] (선택) base64 길이로 실제 바이트 추정 (`len(b64) * 0.75`) 후 5MB 이상이면 reject

### 15. 로그에 시크릿/PII 안 찍는지
- [ ] uvicorn access log가 쿼리 파라미터에 토큰을 안 찍는지 (현재 JWT는 헤더로만 — OK)
- [ ] 에러 응답에 stack trace 노출 X
  - FastAPI는 기본적으로 운영 모드에서 trace 안 보냄. 단 `--reload` 절대 prod에서 X

---

## 🟢 향후 개선 (배포 후 점진적으로)

### 16. 레이트 리미팅
- 현재 없음. 한 사용자가 1초에 100번 게시글 생성 가능
- 도구: `slowapi` (FastAPI), Cloudflare WAF Rules
- 우선순위: `/api/auth/*`, `/feed/posts`, `/feed/comments`, `/host/events`

### 17. 콘텐츠 신고/모더레이션
- 현재 없음. 부적절한 게시글/사진 신고 기능 부재
- 사용자 50명 넘으면 우선 추가

### 18. 2단계 인증
- Google OAuth 자체가 충분히 강함. 추가 2FA는 필요 시

### 19. CSP (Content Security Policy)
- 인라인 스타일 많이 써서 도입이 까다로움. 점진적으로:
  - `'unsafe-inline'` 허용으로 시작
  - 추후 styled-components나 CSS module 전환 후 strict CSP

### 20. 백업 + 암호화
- DB 정기 백업 자동화 (cron + S3)
- 백업 파일은 GPG/AWS KMS로 암호화

### 21. 침해 모니터링
- Sentry로 에러 모니터링
- Cloudflare Logs (Enterprise 플랜) 또는 자체 ELK 스택
- 의심스러운 패턴 (한 IP에서 다수 계정 생성 등) 알림

### 22. 데이터 주체 권리 (GDPR/PIPA 대비)
- 사용자가 자기 데이터 다운로드/삭제 요청할 수 있는 엔드포인트
- 한국 거주 외국인 대상이라 PIPA(개인정보보호법) 적용
- 개인정보 처리방침 페이지 필요 (배포 후 반드시 추가)

### 23. SBOM (Software Bill of Materials)
- 의존성 lockfile 정기 백업 (`package-lock.json`, `requirements.txt`)
- Renovate/Dependabot으로 자동 업데이트 PR

---

## 빠른 점검 명령어 한 줄씩

```bash
# 1. 시크릿이 git에 있는지
git log -p | grep -iE "GOCSPX|nextauth_secret|password" | head

# 2. 코드에 시크릿 하드코딩
grep -rn "GOCSPX\|nextauth_secret" --include="*.ts" --include="*.tsx" --include="*.py" .

# 3. dangerouslySetInnerHTML
grep -rn "dangerouslySetInnerHTML" --include="*.tsx" .

# 4. 무권한 접근 가능한 mutation 라우트
grep -rn "@router.post\|@router.patch\|@router.delete" backend/routers/

# 5. 의존성 취약점
npm audit --production
cd backend && pip-audit 2>/dev/null || echo "pip-audit 설치 필요"

# 6. 백엔드/DB 외부 노출 여부
docker ps | grep -E "0.0.0.0|::"
ss -tlnp | grep -E "3000|8001|5434"
```

---

## 배포 직전 최종 점검 (1분 컷)

```
□ NEXTAUTH_SECRET prod용 새로 생성됨
□ NEXTAUTH_SECRET이 frontend/backend 동일
□ Postgres 비밀번호 변경됨
□ Google OAuth redirect URI 추가됨
□ CORS allow_origins에 chatda.life 추가됨
□ 백엔드 --host 127.0.0.1 로 바인드
□ npm audit 클린
□ 테스트 계정/이벤트 정리됨
□ HTTPS 강제 + HSTS 헤더
□ Cloudflare SSL "Full (strict)"
```

전부 체크되면 배포 OK.
