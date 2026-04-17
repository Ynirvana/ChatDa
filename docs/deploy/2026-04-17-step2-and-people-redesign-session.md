# 2026-04-17 — Step 1 보강 + Step 2 + People 리디자인 + Threads 세션

## 개요

v4 기획의 Step 1 빈틈 보강과 Step 2 신규 구현을 한 덩어리로 마무리한 세션. 같이 People 탭 UI를 LinkedIn 스타일로 리디자인하고, 네이티브 `<select>`가 다크 테마와 어긋나던 필터를 커스텀 `FilterSelect`로 전면 교체. Threads 소셜 플랫폼 추가와 Admin self-protect도 포함.

**결과:** 마이그레이션 0015~0017 전부 prod 적용, 컨테이너 rebuild 완료, https://chatda.life 라이브 반영.

---

## 1. Step 1 보강

### v4 기획서 반영해 Step 1 필수 필드를 6개로 확정
- 사진 / Display name / Nationality / Current location / I am a... (status) / What brings you here (1~3개 필수)
- Bio는 Step 1 화면에 노출하되 입력 자체는 optional

### 변경
- **USER_STATUSES 5개로 재정의**: `local / expat / visitor / visiting_soon / visited_before`
  - 마이그레이션 `0015`에서 기존 enum 6개 → 5개 값으로 매핑 (`tourist → visitor`, `student/expat → expat`, `local_* / korean_worker → local`)
  - enum drop + text 전환 (향후 값 변경 유연성)
- **"What brings you here?" 신규 필드** — `users.looking_for text[] NOT NULL '{}'` (10개 모티브 중 1~3개 필수)
- **Nationality combobox** — 197개 형용사 목록 `lib/nationalities.ts`, 타이핑 검색, 키보드 ↑↓ Enter Esc
- 안내 문구 `Your profile is how others find you in Korea. Make it real.`
- 리다이렉트 `/meetups` → `/people`

### 신규 컴포넌트
- `components/NationalityCombobox.tsx`
- `components/LookingForPicker.tsx` (3/3 도달 시 나머지 disabled)

---

## 2. Step 2 — 프로필 페이지 인라인

### DB (마이그레이션 0016)
```sql
ALTER TABLE users ADD COLUMN stay_arrived date;
ALTER TABLE users ADD COLUMN stay_departed date;
ALTER TABLE users ADD COLUMN languages jsonb NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN interests text[] NOT NULL DEFAULT '{}';
```

### Backend
- `PATCH /users/me` 신규 — partial update (bio/stay dates/languages/interests). Pydantic `exclude_unset` 활용.
- `LanguageEntry` 모델 (language + level). level은 `Literal[native|fluent|conversational|learning]`.
- `/users/me` · `/users/directory` · `/users/{id}/profile` 응답에 새 필드 전파.

### 신규 컴포넌트
- `StayDatesEditor` — status별 분기
  - `local` → 섹션 숨김
  - `expat` → Since when (arrived only)
  - `visitor` → arrived + departed
  - `visiting_soon` → arrived 강조 (주황 테두리)
  - `visited_before` → 과거 arrived + departed
- `LanguagesEditor` — 언어 드롭다운(18개) + 레벨 드롭다운 → Add → 리스트. 레벨별 색(Native green / Fluent blue / Conversational amber / Learning gray).
- `InterestsEditor` — 20개 프리셋 최대 10개. TagEditor와 동일한 "선택된 것 위 + Add more 접이식" 패턴.
- `ProfileCompleteness` — `lib/completeness.ts` 50% base + Step 2 6개(Local은 5개) × 각 ~8% 가점. 진척률 바 + "Complete your profile to get more connections" 안내.

### `/profile` 페이지 섹션 순서
Completeness 바 → 프로필 헤더 → Connection Requests → Stay(non-Local) → Languages → Interests → My Tags → My Meetups.

### TagEditor UX 리팩터
기존엔 can_do/looking_for 각각 20개 태그 전부 렌더링해서 "선택됨"과 "선택 가능"이 구분 안 됨 → **선택된 것만 진한 fill(+ × 제거)로 위에 / "+ Add more" 접이식으로 가릴 수 있게** 재작성.

---

## 3. People 탭 리디자인 (LinkedIn 톤)

### PersonCard 전면 재작성
- **상단 커버 배너** (80px, status별 그라데이션): local=teal/cyan, expat=orange/pink, visitor=violet/purple, visiting_soon=pink/orange, visited_before=gray.
- **원형 프로필 사진** (80px, border 3px 다크) — 커버에 반쯤 걸침, 중앙 정렬.
- 이름·status·location·bio·motivation pill 전부 **센터 정렬**.
- **Mutual count** 표시 (`👥 N mutual connection(s)`, 보라).
- **Outline Connect 버튼** — 기본 투명 + 주황 테두리, hover 시 그라데이션 채워짐.
- `height: 100%` + 하단 spacer로 **카드 높이 균일**.

### Backend `mutual_count` 계산
`/users/directory`에서 viewer의 accepted peers와 각 target의 accepted peers 집합을 미리 가져온 뒤 교집합 크기. N+1 방지.

### FilterSelect 컴포넌트 — 네이티브 select 추방
네이티브 `<select>`가 다크 테마에서 OS 기본 흰 배경으로 떠서 촌스러웠던 문제. 새 `components/FilterSelect.tsx`:
- pill 버튼 + 다크 팝업(`#2d1b4e`)
- 선택된 값은 버튼에 주황 그라데이션
- 키보드 ↑↓ Enter Esc
- 외부 클릭 close
- 옵션에 `prefix` 슬롯 (이모지 지원 — motivation 옵션용)

PeopleClient 6개 필터 전부 교체. Nationality만 검색 필요해서 기존 `NationalityCombobox` 유지.

### 필터 7개
Location · Nationality · Status(`Everyone`) · **What they offer** (can_do 태그 한정) · Language · What brings them · **Has social** (Instagram only / Threads only / ...).

### 접이식 패널
검색창 + `⚙︎ Filters (N)` 버튼만 기본 노출. 클릭시 패널 열림. 결과 카운트 힌트 `N people matched`.

---

## 4. Threads 소셜 플랫폼 추가 (0017)

```sql
ALTER TYPE platform ADD VALUE 'threads';
```

- `lib/constants.PLATFORMS` 재정렬: `instagram → threads → x → tiktok → linkedin → facebook` (외국인 사용 빈도 순)
- `components/ui/PlatformIcon.tsx`에 Threads 공식 @ 로고 SVG
- `app/profile/page.tsx` 이모지 폴백 맵에도 threads/facebook 추가

---

## 5. Admin self-protect

백엔드 `DELETE /admin/users/{id}`에 2 가드:
```python
if user_email.lower() == admin_email.lower():
    raise HTTPException(400, "Cannot delete your own admin account")
if is_admin_email(user_email):
    raise HTTPException(400, "Cannot delete an admin account")
```

프론트엔드 `AdminClient.tsx`는 `currentAdminEmail` prop + 각 유저 `is_admin` 플래그 받아서:
- 본인 행: `(you — can't self-moderate)` 표시, 버튼 숨김
- 다른 admin: `ADMIN` 뱃지 + `(admin — protected)`
- 일반 유저: 기존 Ban / Delete+Ban / Delete Only

---

## 6. 랜딩 카피 v4 교체

| 위치 | 전 | 후 |
|---|---|---|
| `app/page.tsx` tag | Korea's International Network | **Korea's cross-cultural network** |
| headline | Find your people in Korea | **See who else is here in Korea.** |
| subline | The person you're looking for is already here | **The person you're looking for already has a profile here.** |
| CTA | Browse Meetups → (`/meetups`) | **Browse Profiles → (`/people`)** |
| `app/layout.tsx` | | SEO title/description 업데이트 |
| `public/manifest.json` | | PWA description 업데이트 |

---

## 7. Dev 환경 정비

### `.env`의 DATABASE_URL이 prod 가리키던 문제
오늘 Step 1 배포 후 dev uvicorn · Next.js 둘 다 prod DB(`chatda`)에 붙어있던 이슈 발견. Migration 0015 적용 후 prod DB엔 신 스키마지만 prod 컨테이너 구 코드 → 새 코드로 dev 돌릴 때 스키마 불일치로 500 / Access Denied.

**임시 조치**: 두 프로세스 모두 `DATABASE_URL=...chatda_dev`로 override 재시작.
**근본 해결 권장**: `.env.local` / `backend/.env`의 DATABASE_URL을 `chatda_dev`로 영구 수정 — 사용자 몫.

### Dev DB 리셋 + 시드
0013 이후 dev에 마이그레이션 누락돼 있었고 상태 꼬여서 dev DB DROP + CREATE 후 0~17 전부 재적용. 유저 0명이라 무피해.

`scripts/seed.ts` Step 1+2 전체 필드 반영해서 리라이트. 5 페르소나:
- Sarah (American / Seoul / expat / can_do: Graphic Design, English Tutoring / 3개 언어)
- Jun (Korean / Seoul / local / Tour Guide, Video Editing / 3개 언어)
- Yuki (Japanese / Busan / visitor / Translation / 3개 언어)
- Marco (Italian / Seoul / visiting_soon / Business / 2개 언어)
- Mei (Chinese / Jeju / visited_before / Content Creation / 3개 언어)

Connections 5개 수동 SQL로 추가해 mutual count UI 검증.

---

## 8. 배포

**순서:** 백업 → 0015~0017 prod 적용 → 컨테이너 rebuild → 스모크

1. `bash scripts/backup-db.sh` → `chatda-2026-04-17-0059.sql.gz` (2.5MB)
2. `echo APPLY | bash scripts/migrate-prod.sh` → 0015·0016·0017 연속 적용
   - prod 유저 2명 status 매핑 검증: `expat → expat`, `tourist → visitor`. 누락 케이스 0.
3. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build backend app`
4. 스모크:
   - 컨테이너 전부 healthy
   - `/` `/people` 200, `/onboarding` `/profile` 307 (로그인 리다이렉트)
   - 컨테이너 내 `curl /users/directory` → `keys: ['bio','connection','id','interests','languages','location','looking_for','mutual_count','name','nationality','profile_image','social_links','social_platforms','status','tags']`

---

## 남은 것 (다음 라운드 Backlog)

1. **알림 시스템** — Connect 요청/수락/거절, RSVP 승인 등의 이벤트를 Nav 🔔 벨 + unread 카운트 + dropdown으로 노출. DB `notifications` 테이블 + API + 폴링.
2. **하드닝** — `docs/deploy/security-followup.md`: Sentry / UptimeRobot / slowapi rate limit / OAuth dev·prod 분리 / NEXTAUTH_SECRET 회전.
3. **이미지 → S3/Cloudinary** — 현재 base64 in DB. 유저 수 증가 시 DB 부담.
4. **이벤트 취소/신청 취소**, **반복 일정**, **Gigs 탭** (기획서 v4 2단계).
