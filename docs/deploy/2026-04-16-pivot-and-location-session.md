# 2026-04-16 — v4 피벗 + Location 필드 + db:migrate 분리 세션

## 개요

제품 방향을 **"모임 플랫폼"에서 "People 탭 기반 외국인-로컬 매칭"으로 피벗**하고, 온보딩 Step 1을 30초 목표로 재설계. 동시에 `npm run db:migrate`가 prod DB를 건드리던 위험을 스크립트 분리로 해결.

**상태:** 코드 완료, dev 적용 완료. Prod DB에 location 컬럼은 이미 들어갔지만 (스크립트 실수로 선반영), prod 컨테이너 rebuild + 브라우저 QA 는 **다음 세션**.

---

## 1. v4 피벗 — People 탭 중심

### 배경
기존 기획("참가자 프로필이 보이는 모임 플랫폼")은 Meetups 중심이었음. 하지만 최근 커밋(`People tab + tag system + 1촌 connect requests`, `/people/[id]` 프로필 상세) 이 이미 People 중심으로 이동 중이었고, 사용자가 v4 기획서 (`"한국판 외국인 The Facebook"`)를 재확인.

### 결정사항
- **첫 탭 = People** (탐색/매칭 핵심). Meetups는 **부트스트랩 수단**(밋업 → 프로필 풀 축적)이지 목적 아님.
- **Feed는 유저 밀도 확보 전까진 제외.**
- 판단 기준: 모든 기능은 "People 탐색/매칭에 기여하는가"로 가중.
- 온보딩 Step 1은 **30초 목표** → 광범위한 필드 수집은 Step 2(프로필 페이지)로.

### 메모리 업데이트
`~/.claude/projects/.../memory/project_chatda.md`를 v2 기준으로 재작성 (기존 "모임 플랫폼" 정의 폐기).

---

## 2. 온보딩 Step 1 재설계

### 추가: `users.location` (nullable)
기존 스키마엔 위치 필드가 없어서 "Seoul에 누가 있어?" 같은 People 탭 기본 필터가 불가능. 광역 단위 14개로 시작 (동·구는 Step 2에서 자유 입력 예정).

**마이그레이션 `0014_curly_lockheed.sql`:**
```sql
ALTER TABLE "users" ADD COLUMN "location" text;
```

**LOCATIONS 상수:**
```
Seoul, Busan, Incheon, Daegu, Daejeon, Gwangju, Ulsan, Jeju,
Gyeonggi, Gangwon, Chungcheong, Jeolla, Gyeongsang, Other
```

### 소셜 링크: 필수 → Optional (accordion)
- 이전: 5개 플랫폼 input 항상 노출 + 최소 1개 필수 (`filledLinks >= 1`)
- 이후: "Add social links (optional) ▼" 접이식. 기본 접힘. 펼치면 `🔒 Only visible to members you accept as connections` 문구 + 입력 UI
- 공개 게이팅은 이미 백엔드에 구현돼 있음 (`/users/directory`, `/users/{id}/profile`가 connection status=accepted 체크)

### 리다이렉트: `/meetups` → `/people`
- `OnboardingForm.tsx` submit 후
- `app/onboarding/page.tsx` returning user check
- `OnboardingForm.tsx` "Done" 버튼 (edit mode)

### 변경 파일
- `db/schema.ts` — `users.location` 컬럼
- `backend/database.py` — `User.location` 매핑
- `backend/routers/users.py` — `OnboardingBody`, `ProfileOut`, `/users/me`, `/users/directory`, `/users/{id}/profile` 모두 location in/out
- `lib/constants.ts` — `LOCATIONS` 추가
- `lib/server-api.ts` — `ApiProfile.location`
- `app/api/onboarding/complete/route.ts` — body에 location 전달
- `app/onboarding/OnboardingForm.tsx` — Location 드롭다운, 소셜 accordion, canSubmit 로직, `/people` 리다이렉트
- `app/onboarding/page.tsx` — initial에 location, returning user → `/people`
- `app/people/PeopleClient.tsx` — Location 필터 드롭다운 (제일 앞)
- `app/people/[id]/page.tsx` — 상세 페이지에 📍 Location
- `app/profile/page.tsx` — 내 프로필 헤더에 📍 Location
- `components/PersonCard.tsx` — 카드에 📍 Location

### 검증
- `npx tsc --noEmit` 통과
- `curl -s http://localhost:8001/users/directory` 응답에 `location` 키 포함 확인
- `/people` 200, `/onboarding` 307(로그인 리다이렉트)

---

## 3. `npm run db:migrate` 스크립트 분리 (중요)

### 문제
기존 `package.json`:
```json
"db:migrate": "DATABASE_URL=postgresql://chatda:chatda@localhost:5434/chatda drizzle-kit migrate"
```
→ **prod DB에 하드코드**. 심지어 runbook §5의 "dev DB에 적용" 가이드인 `DATABASE_URL=... npm run db:migrate`조차 npm 스크립트 내 URL이 덮어써서 **실제로는 prod에 적용됨**. 오늘 location 컬럼 추가 시 정확히 이 사고가 발생 (nullable이라 무해했지만 NOT NULL 이었다면 서비스 다운).

### 해결
- **`db:migrate`** → `chatda_dev` 기본 타깃 (모든 신규 마이그레이션은 항상 dev 먼저)
- **`db:migrate:prod`** → `scripts/migrate-prod.sh` 호출. 아래 기능:
  - Target URL / 호스트 / 타임스탬프 출력
  - "1. 백업 / 2. dev 테스트 / 3. destructive 변경 주의" 체크리스트 출력
  - `read -p "Type 'APPLY' to continue"` — 오타 한 번에 abort
  - 정확히 `APPLY` 입력 시에만 `DATABASE_URL=<prod> npx drizzle-kit migrate` 실행
- `db:seed` / `db:seed:prod` 도 동일 원칙으로 분리

### 검증
- `npm run db:migrate` → `chatda_dev` 정상 적용 (hash 박힘)
- `echo "not-apply" | bash scripts/migrate-prod.sh` → `✗ Aborted. No changes made.` 확인
- `chatda_dev` / `chatda` 양쪽 `__drizzle_migrations`에 0014가 이미 기록됨 → 다음번 prod migrate 돌려도 중복 실행 없음

### runbook 업데이트
- §5 마이그레이션: 새 순서 명시 (generate → dev migrate → 검증 → 백업 → prod migrate → rebuild)
- §10 시드: `db:seed` / `db:seed:prod` 분리 설명

---

## 4. 남은 것

### 우선순위
1. **브라우저 QA** — Google 로그인 → 신규 유저 플로우:
   - Location 드롭다운 14개 정상 표시
   - Social accordion 기본 접힘 + `🔒 Only visible...` 문구
   - Finish setup → `/people` 이동
   - People 탭 Location 필터 작동
   - PersonCard 📍 표시
2. **Prod 배포** — `docker compose ... up -d --build app backend` (DB 스키마는 이미 반영됨)
3. **Step 2 구현** — 프로필 페이지에 체류 상태/기간/can-offer/looking-for/언어/관심사 + 프로필 완성도 % + People 탭 필터 확장
4. 기존 유저 데이터 마이그레이션 안내 (NULL location 유저는 프로필 편집에서 채우도록 CTA)

### 주의
- prod 컨테이너는 현재 **구 코드 + 신 스키마** 상태 (location 컬럼 있음, 코드는 location 모름). nullable이라 작동엔 무해하지만 rebuild 전까진 신규 기능 미적용.
- 사용자 일부(`onboarding_complete=true`)는 location=NULL. People 탭 Location 필터 걸면 필터 아웃됨 (의도된 동작). 프로필 편집 통해 보완하도록 CTA 필요할 수 있음.
