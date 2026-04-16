# 2026-04-16 — 카피 수정 + 캐퍼시티·PWA 하드닝 세션

## 개요

런칭 카피 조정 3회 이후, 동시요청 처리 / PWA / 모바일 웹 세 축을 실제 작동 상태로 끌어올린 세션. 전부 `https://chatda.life` 라이브 반영 완료.

---

## 1. 런딩 히어로 카피 (3단계로 수렴)

최종:
- **Tag**: `cross-cultural network`
- **Headline**: `Find your people in Korea`
- **Subline**: `The person you're looking for is already here`

반영 파일:
- `app/page.tsx` — 히어로 섹션
- `app/layout.tsx` — SEO `<title>` + `description`
- `public/manifest.json` — PWA description

검증: `curl -s https://chatda.life/ | grep …` 에서 새 문구 3종 확인, 이전 문구 0건.

---

## 2. 백엔드 동시요청 처리 (`--workers 2`)

### 문제
`backend/Dockerfile`의 CMD가 uvicorn 기본값(`--workers 1`)으로 실행 중. `backend/main.py`는 대부분 `async def` 핸들러라 I/O 바운드 동시성은 있지만, CPU 바운드나 event loop 블로킹이 발생하면 전체 대기.

### 사전 점검
- `backend/main.py`: startup event / 글로벌 mutable state 없음 → multi-worker 안전
- `backend/database.py`: engine/SessionLocal은 worker마다 독립 생성. `pool_size=10 + max_overflow=5` → worker 2개 × 15 = **최대 30 conn** (Postgres `max_connections=100` 여유)

### 변경
```diff
- CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
+ CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### 검증
컨테이너 내부 `/proc/*/cmdline`에서 `uvicorn ... --workers 2` 확인. backend mem_limit 512m 안에서 안전.

---

## 3. PWA — 설정만 있고 죽어있던 상태 복구

### 문제 발견
`next.config.ts`에 `@ducanh2912/next-pwa` wrapper가 있고 `public/manifest.json`도 있었지만 `curl https://chatda.life/sw.js` → **404**. Next.js 16 turbopack 기본 빌드에서 webpack 플러그인이 실행되지 않아 `sw.js` 생성 자체가 실패. `next.config.ts:14` 주석도 "silences webpack/turbopack conflict warning from next-pwa"로 이미 호환성 의심은 있었음.

### 해결 — 자작 Service Worker
서드파티 빌드 플러그인 의존 제거, 표준 Web Platform API로 수동 구현.

**신규 파일:**
- `public/sw.js` (~90줄)
  - HTML 요청: **network-first** (fetch 성공 시 `PAGES_CACHE`에 store, 실패 시 cache → 최종 실패 시 `/offline.html`)
  - 정적 자원 (`/_next/static/*`, 아이콘, 폰트, CSS/JS): **cache-first** (Next.js가 파일명에 hash 붙이므로 content-addressed라 안전)
  - **바이패스:** `/api/*`, `/admin/*`, `?_rsc=…` RSC 페이로드, non-GET, cross-origin
  - `install` 이벤트에서 `OFFLINE_URL` + `manifest.json` precache
  - `activate` 이벤트에서 `CACHE_VERSION` 불일치 캐시 전체 삭제 → `clients.claim()`
- `public/offline.html` — 인라인 스타일로 된 1-파일 폴백 페이지 (브랜드 그라디언트 + Retry 버튼)
- `components/ServiceWorkerRegistration.tsx`
  - `'use client'` 훅. `window.load` 이후 `navigator.serviceWorker.register('/sw.js', { scope: '/' })`
  - **Kill switch**: URL에 `?kill-sw=1` 포함 시 모든 registration `unregister()` + `caches.delete(*)` → SW 버그 시 유저 측에서 자가 복구 가능

**기존 수정:**
- `app/layout.tsx`: `<ServiceWorkerRegistration />` 추가
- `next.config.ts`: `withPWA()` wrapper 제거, `/sw.js`에 대해 `Cache-Control: public, max-age=0, must-revalidate` 응답 헤더 추가 (SW 파일 자체는 절대 캐시 안 되어야 업데이트가 즉시 전파됨)
- `package.json` + `package-lock.json`: `@ducanh2912/next-pwa` 의존 제거, `npm install --package-lock-only`로 lockfile 싱크

### 검증
- `curl -sI https://chatda.life/sw.js` → **200** + `application/javascript`
- `curl -sI https://chatda.life/offline.html` → **200**
- `curl -s https://chatda.life/sw.js | head -5` → 자작 주석 + `CACHE_VERSION` 확인

### 안전장치 요약
1. 세션 쿠키 민감한 `/api/*`, `/admin/*` 절대 캐시 안 함
2. `sw.js` 자체는 `max-age=0` → 구버전 SW가 끈질기게 살지 않음
3. `?kill-sw=1` 페이지 접속만으로 사용자 브라우저에서 SW 완전 제거
4. `CACHE_VERSION` 상수 bump → 다음 activate에서 이전 캐시 전부 삭제

---

## 4. 모바일 웹 마이크로 개선

`app/globals.css`의 `.page-bg`:
```diff
  min-height: 100vh;
+ min-height: 100dvh;                            /* iOS 주소창 변동 대응 */
+ padding-left: env(safe-area-inset-left);
+ padding-right: env(safe-area-inset-right);
+ padding-bottom: env(safe-area-inset-bottom);   /* iPhone 노치/홈바 */
- overflow: hidden;
+ overflow-x: hidden;                            /* 세로 스크롤은 유지 */
```

**남은 이슈 (의도적 보류):** `app/layout.tsx:34`의 `userScalable: false` — 접근성 관점에선 바람직하지 않지만 네이티브 앱스러운 UX 선호일 수 있어 유지. 향후 리뷰 후 제거 검토.

---

## 5. 배포

`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` 2회:
1. 카피 변경만 (`app` 서비스)
2. backend + app 전체 rebuild (workers + CSS + PWA 묶음)

롤링 restart: db healthy 대기 → backend recreate → app recreate → 정상.

---

## 6. 트래픽 캐퍼시티 실측

### 호스트 여유
- 24 vCPU, 30 GiB RAM, 2.3 GiB 사용 (99% 놀고 있음)

### 컨테이너 제한 (`docker-compose.prod.yml`)
| 컨테이너 | CPU 할당 | RAM 할당 | 아이들 사용량 |
|---|---|---|---|
| `chatda-backend` (uvicorn × 2) | 1.0 | 512 MiB | 178 MiB / 0.3% |
| `chatda-app` (Next.js) | 1.5 | 768 MiB | 76 MiB / 0% |
| `chatda-db-1` (Postgres 16) | 무제한 | 무제한 | 42 MiB / 0.1% |

### Postgres
- `max_connections=100`, 현재 7 active
- 앱 풀: 2 workers × (pool_size=10 + overflow=5) = **최대 30 conn** (30% 사용)

### 예상 처리량 (현실적 추정)
- **홈페이지** (`revalidate=60` ISR로 캐시): Next.js 1,000+ req/s
- **동적 백엔드 엔드포인트**: async + 2 workers + 1.0 CPU → 100–300 req/s sustained
- **쓰기**: 50–100 write/s (로컬 디스크 Postgres)
- **동시 활성 사용자 환산**: 1인 분당 1–5 req 가정 시 **500–1,000명 여유**

### 먼저 병목 걸릴 순서 (확장 시)
1. **백엔드 CPU 1.0 제한** — 수백 req/s 근처에서 포화. `cpus: 2.0`으로 올리면 즉시 해소 (호스트 여유 충분)
2. **base64 이미지** (`cover_image`, `profile_image` DB Text) — 100명+ 단계에서 payload·DB 비대화 심각. S3/Cloudinary 이전 권장
3. **홈 ISP 업로드 속도** — 셀프호스팅 상한
4. **WSL2 + 노트북 전원** — 가장 큰 구조적 리스크. 끄면 사이트 다운

### 결론
- **MVP 0–500명**: 압도적 헤드룸
- **1,000–5,000 동시**: 가능, CPU 할당 2배 올리면 안정
- **10,000+ / 바이럴 스파이크**: 단일 WSL2로는 한계. 다음 단계는 VPS 이전 + 이미지 CDN

---

## 후속 작업 후보

- `docker-compose.prod.yml`의 backend `cpus: 1.0` → `2.0` (여유 생길 때)
- 이미지 S3/Cloudinary 이전 (`security-followup.md`에도 기록됨)
- `userScalable: false` a11y 관점 재검토
- SW 캐시 히트율 모니터링 (Cloudflare Analytics 내장 지표로는 한계, Workbox analytics 붙이면 정밀)
