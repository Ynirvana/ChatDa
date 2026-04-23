# 2026-04-18 세션 리포트

> 어제(4/17) PR-A(GA4) + Light theme 배포 후 이어서 PR-B 구현 시작 → 스코프 폭넓게 확장.
> 초반: PR-B 원안 + 온보딩 재구성 + 신규 필드(school / gender / age) + 보안 정리 + 랜딩 Section 2 "Already here" + dev seed 확장(10명).
> 중반: **Section 2 철회 → 초대 전용 커뮤니티로 전환**. PersonCard 리팩 + Pre-arrival 코랄 일관성 + show_personal_info 토글 + **초대 토큰 시스템 (signIn gate + /invite/[token] 페이지 + OG 메타 + /admin Invites 탭) + Onboarding 정지 정책 공지**.
> **후반(늦은밤 마라톤)**: OG 이미지 최종 드롭 + 초대 TTL 48h 전환 + **SQLAlchemy SERIAL 배선 버그 해결** + **/invite 페이지 완전 리디자인 (AI slop 제거)** + **로그인 후 /people 튕김 버그 (NextAuth redirect callback) 수정** + **/people peek 첫 행만 sharp** + **프로필 사진 필수 + 다중 최대 5장** + **Admin 페이지 영문화** + **UTM/유저별 공유 링크 V1** + **/join 2차 리디자인 (Soho House 톤)** + **재로그인 경로 노출 (Nav·/login·/join footer)** + **Access Denied 친절한 UX**. 3페이지(랜딩/invite/join) "Find your people in Korea" 감정 앵커로 통일.
> **모든 변경이 dev에만 있음. Prod는 4/17 light theme 상태 그대로.**

---

## 🏁 오늘 마무리된 것

### A. PR-B 원안 (v4-followup.md) — 전부 구현 + 확장됨
- **Migration 0018** — `users.country_of_residence text NOT NULL DEFAULT 'KR'` + `users.looking_for_custom text`
- **`lib/stay-duration.ts`** 신규 — 순수 formatter, 5개 status × 12개 케이스 sandbox 검증
- **StayDatesEditor** — Expat/Worker는 `<input type="month">` (day=01 저장), Student/Visitor는 date. 모든 non-local에 arrived+departed 둘 다 입력 가능
- **PersonCard / /people/[id] / /profile** — 체류 라인 "🗓️ 2y 3mo in Korea" 형태
- **OnboardingForm** — Other ✨ 칩 + inline input (30자), 상한 3 합산
- **TagEditor** — +Custom 버튼 (카테고리별), inline input (1–24자), hard cap 3 — **서버 400 enforce**
- **People 필터** — 프리셋 10개만 (Other 제외)

### B. 랜딩 / 복사
- Tag: "cross-cultural network" → **"international community"**
- Footer: "Locals · Expats · Visitors · Creators — already in Korea" → **"Exchange students · Expats · Creators · Digital nomads — all in Korea"**
- `app/layout.tsx` meta description + `public/manifest.json` description 업데이트
- `CLAUDE.md` 동기화

### C. 로그인 페이지 라이트 테마
- `app/login/page.tsx` 전체 재작업 — 다크 → 크림 + 선셋. Phase 3 backlog 1개 소진.

### D. People 필터 드롭다운 z-index 버그
- `PeopleClient.tsx` 필터 패널에 `position: relative; zIndex: 30` — backdrop-filter로 생긴 stacking context가 카드 그리드 뒤로 깔리던 이슈 해결.

### E. Location 개선
- **Migration 0019** — `users.location_district text` nullable
- Label: "Current location in Korea" → "**Location in Korea (current or planned)**"
- 네이티브 `<select>` → FilterSelect 교체 (라이트 테마 일관성)
- Seoul 선택 시 **District sub-picker** 등장 — 25개 구 목록, **유명도 순** 재정렬 (Gangnam, Mapo, Yongsan, Jung, Seongdong … 상위)
- 저장/표시 포맷: `📍 Seoul · Gangnam`

### F. Onboarding 구조 재편
**이동**: Bio + "What brings you here?" → **Profile 페이지(Step 2)로 이동**
**순서**: Photo → Name → **Gender+Age** → Nationality → **I am a...(status)** → [School if Student] → Location → Social links
**검증 완화**: motive 최소 1개 요구 제거 (이제 Step 2 항목)
**Profile에 추가**: `BioEditor` + `MotivesEditor` 신규 컴포넌트, 각각 `/api/users/me` PATCH
**Backend**: `ProfilePatchBody`에 `looking_for` + `looking_for_custom` 필드 추가, 핸들러 업데이트

### G. Status 단순화
- 5개 → **3개 선택 가능** (`SELECTABLE_USER_STATUSES`): **Student / Visitor / Resident**
- Korean nationality → **자동 `local`** 세팅 + 피커 UI 숨김 + 안내 문구
- 내부 id는 유지 (`exchange_student` / `visitor` / `expat`) — DB 호환
- 레거시 `visiting_soon` / `visited_before` / `worker` (잠시 추가했다가 제거) → 렌더 fallback만 유지

### H. Nationality 재정렬
- 상단 22개는 **유명도 순** (Korean, American, Chinese, Japanese, Vietnamese, Thai, Filipino, British, Canadian, Australian, German, French, Indian, Indonesian, Uzbek, Russian, Mongolian, Spanish, Italian, Brazilian, Mexican, Nepalese)
- 나머지 173개는 알파벳 순
- **North Korean 제거**
- `Nationality` type → `string` (literal union 포기하고 유연성 확보)

### I. School 필드 — Student 네트워크 트리거 🎓
- **Migration 0020** — `users.school text` nullable (앱 레벨 required when status=exchange_student)
- **`KOREAN_UNIVERSITIES` 22개** 프리셋 (SNU / Yonsei / KAIST / POSTECH / Hanyang / SKKU / Ewha / Sogang / HUFS …)
- **`SchoolCombobox`** 신규 — NationalityCombobox 변형, free text 허용 (해외대 / 비공식 과정 대응)
- **검증 3중**: OnboardingForm canSubmit → Next API 400 → FastAPI 400
- 디스플레이: 카드 `🎓 {school}` pill, 상세 페이지 큼직한 badge, 본인 프로필 `SchoolEditor`
- **네트워크 효과 포석** — 필터/추천은 후속

### J. Gender + Age
- **Migration 0021** — `users.gender text`, `users.age integer` 둘 다 nullable (앱 레벨 gender required)
- `GENDER_OPTIONS`: Male / Female / Other (3-way segmented)
- `AGE_MIN=18, AGE_MAX=99` — Pydantic `ge=18 le=99`
- OnboardingForm Name 바로 아래 한 행: Gender(1.6fr) + Age(1fr)
- 표시: 카드·상세 이름 밑에 "24 · Female" 작게 (authed only)

### L. Landing Section 2 "Already here" + Dev Seed 확장 🎨

**배경**: 랜딩 Hero 아래 비어있어서 스크롤 보상 없음. 기획상 프로필 카드 노출해서 "누가 있는지 궁금하게" 만드는 섹션 필요.

**결정 (논의 후)**:
- **가짜 프로필 prod 주입 절대 X** — ChatDa 핵심 가치("real people in Korea") 정면 부정 + Tinder/Bumble 봇 사례 반복. 발각 시 신뢰 즉사.
- dev에선 확장된 시드(10명)로 UI 완성, **prod는 실제 유저 5~10명을 사용자 개인 네트워크로 부트스트랩**해서 채우기로.
- Section 2는 **실유저 <4면 자동 hide**. 4명+ 모이면 자연스럽게 alive.

**구현**:
- **`app/page.tsx`** — Hero 밑에 Section 2 추가. h2 "Already here" + "See who's on chatda" + PersonCard 4-grid (auto-fill minmax 240px → desktop 4 / tablet 2 / mobile 1) + "See all profiles →" CTA. `getFeaturedProfiles()`가 null이면 섹션 전체 `{featured && (...)}`로 생략.
- **`lib/featured.ts`** 신규 — `/users/directory` 호출 → completeness 스코어 (bio/tags/languages/interests/school/image) + **status·nationality 다양성 greedy pick** (중복 감점 −10/−5) → 4개 리턴, <4면 null.
- **`backend/settings.py`** — `environment: str = "development"` + `is_production` property 추가.
- **`backend/routers/users.py`** `/directory` — `settings.is_production`일 때 `User.email.like("%@chatda.test")` 자동 제외. **dev에선 노출, prod에선 필터.** /people 페이지에도 동일 효과.
- **`scripts/seed.ts`** 대폭 확장 — 5→10명. 기존 Sarah/Jun/Yuki/Marco/Mei + 신규 Emma(DE/Yonsei)/Lucas(BR/Busan)/Chloé(FR/Seoul)/Jack(AU/KU)/Putri(ID/Jeju). **전부 새 필드 채움** (gender/age/school/district/country_of_residence). Legacy status (`visiting_soon`·`visited_before`) 정리 → 정식 status로. Idempotent (재실행 시 `events` 선삭제 후 `users` DELETE → 재insert).
- **`scripts/seed-cleanup.ts`** 신규 — `WHERE email LIKE '%@chatda.test'` 삭제. `events.host_id` cascade 없어서 이벤트 선삭제. `npm run db:seed:cleanup`.
- **`package.json`** — `db:seed:cleanup` script 추가.

**프로필 사진** (사용자 요청 "사람 얼굴 비슷한걸로"):
- `randomuser.me/api/portraits/{women|men}/{n}.jpg` 사용. gender 폴더 분리돼서 매칭 쉬움.
- 법적 회색지대 (원출처 UI Faces 관련 DMCA 사례 있음)지만 **dev localhost only + DB엔 URL 문자열만 저장** + Landing unauth는 PersonCard가 `blur(14px)` 처리라 실질 노출 0.
- prod 주입 금지 이유 확장: localhost는 이미지 실제 렌더링 0건이지만, prod는 CF proxy + Google index + 원본 주인공 신고 가능성까지 → noise surface 완전히 다름.

**다양성 검증**:
- Featured 4명 (실제 실행 결과): Emma(German/exchange_student/Seoul) / Jun(Korean/local/Seoul) / Lucas(Brazilian/expat/Busan) / Putri(Indonesian/visitor/Jeju).
- status 4개 전부 + nationality 4개 전부 다름. 다양성 규칙 의도대로 작동.

**Section 2 + Landing UX**:
- Unauth 상태에선 PersonCard의 기존 처리 전부 그대로 — bio blur + "Sign up to see bio" + "Sign up to connect" CTA + 사진 `blur(14px)`. "Social proof 실루엣" 효과로 의도적.
- 카드 클릭 시 `/people/[id]` 이동 — 상세 페이지는 자체 auth 처리.

---

### M. PersonCard 리팩 — 정보 밀도 다이어트 🎴
**배경**: 카드가 9단이라 데이팅 앱/MEEFF 느낌이 났음. 커뮤니티 톤 유지하려면 정보 압축 필요.

- **나이·성별 카드에서 완전 제거** — DB 유지, 카드 렌더만 삭제. 데이팅 프레이밍 해소.
- **Status · 📍 Location · 🗓 Stay → 한 줄 통합** — `flexWrap: wrap` + `justifyContent: center`로 좁은 카드에서 자연스럽게 내려감 (강제 split 대신 유기적 flow)
- **모티브 칩 2개 + `+N` → 1개만** — 첫 preset 우선, 없으면 custom fallback. `+N` 인디케이터 완전 삭제.
- **School pill 유지** — Student(exchange_student)에만 🎓 Yonsei University 형태로 네트워크 트리거.
- 기존 9단 → **6단으로 축소**. 상세 페이지는 그대로 (모든 태그·정보 유지).

### N. Pre-arrival 코랄 강조 일관화 🧡
**배경**: 이전엔 `visitor`/`exchange_student`의 미래 arrival만 코랄. `expat`(Resident)은 미래 arrived여도 일반 톤이었음.

- `lib/stay-duration.ts` `expat`/`worker` 블록에 미래 arrival 분기 추가 — `emphasis='upcoming'` + `Arriving {Month Year}` 형식 (30일 이내면 `Arriving in X days`)
- 모든 status에서 pre-arrival = 코랄 (`#E84F3D`) + 굵기 800로 통일. Fall 2026 교환학생 bootstrap에 핵심.

### O. show_personal_info 토글 (프라이버시) 🛡️
**배경**: 여성 유저 등 프라이버시 우려 대응. 데이팅 프레이밍 회피 겸.

- **Migration 0022** — `users.show_personal_info boolean NOT NULL DEFAULT true`
- Drizzle + SQLAlchemy + `ProfileOut`/`ProfilePatchBody` 전 경로.
- **Backend gating** — `/users/{id}/profile`에서 `viewer != owner && !show_personal_info`면 age/gender 둘 다 `null` 리턴 (FE 우회 불가 — 데이터 자체를 안 내려보냄)
- **컴포넌트**: `components/PrivacyToggle.tsx` — 46×26 스위치 UI, PATCH `/api/users/me`. `/profile` "Privacy" 카드에 장착.
- 1 토글로 age + gender 묶어서 on/off.

### P. 초대 전용 시스템 🔐 (오늘 핵심)
**배경**: "한국판 외국인 The Facebook" 초기 단계 품질 관리. Tinder/MEEFF식 무제한 가입 = 스팸 봇 + 커뮤니티 diluting. **초대장 기반으로 bootstrap**.

**Migration 0023 + 0024**
- `invite_tokens(id, token, invite_number SERIAL, created_by_user_id, created_at, expires_at, claimed_by_user_id, claimed_at, note)` — Drizzle + SQLAlchemy 둘 다.
- `invite_number` SERIAL → "Invite #47 of 100" 자동 표시용.
- 7일 expiry, single-use, admin만 발급.

**Backend (`backend/routers/admin.py`)**
- `POST /admin/invites` — nanoid 24자, 옵션 note ("Sarah from Yonsei")
- `GET /admin/invites` — 최근 50개, `state: unused|claimed|expired`, claimed_by 유저 정보 join
- `DELETE /admin/invites/{id}` — unused만 revoke 가능

**Next.js signIn callback (`lib/auth.ts`)**
- **Pass 조건 3가지**: (1) 기존 유저 재로그인 (2) `ADMIN_EMAILS` 화이트리스트 (3) 유효한 초대 쿠키
- 신규 가입 시 user row 생성 → `claimInvite()` → 실패하면 user row **롤백**
- 원자성: `lib/invites.ts` `claimInvite`는 `WHERE claimed_at IS NULL`로 원자 UPDATE + race condition rollback

**신규 `/invite/[token]/page.tsx`** — 초대장 UX
- 🌅 큰 원형 아이콘 → **"Invite #N of 100" pill** → "You're invited to" → **ChatDa** 대형 그라데이션 타이포 (clamp 3~4.75rem) → Korea's international community → **Continue with Google** (clay shadow + inset highlight, 서버 액션이 쿠키 set + `signIn('google')`) → "Expires in N days · Invited by [이름]"
- Invalid 상태별 분기: expired / claimed / not_found → 🔒 + 상태 문구 + DM me on Threads + "First 100 members. Keep it small."
- `@keyframes inviteFadeIn` 12px slide + fade
- **`generateMetadata`** → `og:image`/`og:title`/`og:description` + `twitter:card: summary_large_image` + `robots: noindex, nofollow` (초대 URL 인덱싱 차단)
- OG 이미지 경로 `/og-invite.png` (placeholder — 사용자가 1200×630 PNG 드롭 예정, `public/og-invite.README.md`에 가이드)

**`/join/page.tsx` 단순화**
- 토큰 로직 제거, 범용 "Invite only for now" explainer만. Nav "Join" 버튼이 찍는 곳.
- `NEXT_PUBLIC_THREADS_HANDLE` env로 `https://www.threads.net/@{handle}` 생성 (placeholder `@yourhandle`).

**`/admin` Invites 탭 신설** — 모바일 최적화
- 기본 탭이 Invites (진입 시 바로 보임)
- "Generate Invite Link" 버튼 + optional note input → 발급 즉시 **자동 클립보드 복사** + "✓ Copied! Paste in Threads DM" confirmation
- 최근 리스트: state pill (UNUSED 그린 / CLAUDED 퍼플 / EXPIRED 회색) + Copy URL / Revoke 버튼
- 30초 내 폰에서 버튼 탭 → URL 복사 → Threads 전환 → 붙여넣기 달성

**진입점 전환** — `/login` → `/join`/`/invite/[token]` 구조로 재편
- `PersonCard` / `/people/[id]` / `PeopleClient` / `Nav` 의 "Sign up to connect" / "Join chatda" 모두 `/join`으로 교체
- `/login`은 기존 유저 재로그인용으로만 살아있음 (NextAuth pages.signIn)

**`app/layout.tsx`**
- `metadataBase = new URL(NEXT_PUBLIC_APP_URL || 'https://chatda.life')` — OG 절대 URL 빌드용

### Q. Onboarding 정지 정책 공지 ⚠️
**배경**: 커뮤니티 품질 기준 명시, 스팸 프로필 사전 차단 (법적 근거도 확보).

- `OnboardingForm.tsx` 제출 버튼 바로 위 — **신규 가입자만** 보이는 피치톤 카드:
  > Quick note: We're keeping quality high while we're small. Profiles that look incomplete or spammy may be suspended — please take your profile seriously.
- `isReturning=true` (기존 유저 편집)일 땐 숨김.

### R. Landing "Already here" Section 2 철회 ↩️
**배경**: 초대 전용 전환으로 narrative 충돌 제거. "Invite only" ↔ "See who's here" 상충.

- `app/page.tsx` Section 2 블록 + `getFeaturedProfiles` import 제거. Hero만 남음.
- `lib/featured.ts`는 **남겨둠** — 유저 50~100명 단계에서 Invite-only tone에 맞게 재작성 예정.

---

## 🌙 늦은 밤 마라톤 (4/18 저녁 → 새벽) — 디테일 라운드

### S. OG 이미지 최종 드롭 + 초대 TTL 48h 전환 🌅
**배경**: 초대 URL 소셜 미리보기 + FOMO/희소성 톤 조정.

- 사용자가 실제 OG 이미지 `public/og-invite.jpg` 드롭 (1408×736, ~156KB, JPG). 비율 1.913:1 ≈ OG 표준 1.904:1 → 크롭 거의 없음.
- **`app/invite/[token]/page.tsx`** — `/og-invite.png` → `/og-invite.jpg` + dimensions 업데이트 (1200×630 → 1408×736)
- **`public/og-invite.README.md`** — JPG/사이즈/디자인 가이드 업데이트
- **Backend TTL 7일 → 48시간**:
  - `backend/routers/admin.py` — `INVITE_TTL_DAYS = 7` → `INVITE_TTL_HOURS = 48` + `timedelta(hours=...)`
  - `lib/invites.ts` — `formatDaysLeft` → **`formatTimeLeft`** (hours 우선; `<= 72h`면 hours, 이상이면 days fallback — 레거시 토큰 대비)
  - `INVITE_COOKIE_MAX_AGE` = `60 * 60 * 48` (48h, 토큰과 매치)
- 기존 unused 토큰 dev DB에서 `expires_at = created_at + INTERVAL '48 hours'`로 업데이트 (7일로 발급돼 있었음)
- 의도: "Expires in 47 hours" 형태로 **행동 유도 압박** 증가

### T. SQLAlchemy SERIAL 배선 버그 해결 🐛
**증상**: Admin `/admin` → Generate Invite Link → **500 Internal Server Error**. Backend 로그:
```
NotNullViolationError: null value in column "invite_number" of relation "invite_tokens" violates not-null constraint
```
**원인**: Drizzle migration 0024가 `invite_number serial NOT NULL` 컬럼 + DB 시퀀스 `invite_tokens_invite_number_seq` 생성. 근데 SQLAlchemy 모델은 그냥 `Integer nullable=False`로만 선언 → SA가 INSERT 시 컬럼 포함 + 값 `None` 전달 → NOT NULL 위반.

**Fix** (`backend/database.py`):
```python
invite_number: Mapped[int] = mapped_column(
    Integer,
    nullable=False,
    server_default=text("nextval('invite_tokens_invite_number_seq'::regclass)"),
)
```
`server_default=text(...)`가 핵심. SA가 DB 쪽 default 있는 걸 인식 → INSERT에서 컬럼 제외 → RETURNING으로 값 fetch.

**교훈**: Drizzle이 `.serial()` 또는 `DEFAULT` 있는 컬럼 만들 때마다 SQLAlchemy 모델에도 `server_default` 명시 필요. 하이브리드 ORM 구조의 가장 흔한 함정.

### U. /invite/[token] 완전 리디자인 — AI slop 제거 + 감정 앵커 🎨
**배경**: 기존 페이지가 "AI 생성물" 느낌. OG 이미지와 톤 불일치. 브랜드 미형성 상태에서 "ChatDa" 로고 노출은 호기심 역효과.

**제거**:
- 좌상단 보라-핑크 정사각형 아이콘 (🌅 in gradient box) — AI placeholder 느낌
- "Invite #N of 100" pill — 초기 단계(유저 0~10명)에선 empty signal로 역효과
- 대형 "ChatDa" 브랜드 타이포 — 인지도 0 상태에서 호기심 죽임
- "Invited by [name]" — Threads DM 받은 맥락에서 이미 알고 있음 (중복)
- `Orb` 컴포넌트들 (OG와 톤 안 맞음)

**추가**:
- **배경**: 선셋 그라데이션 (`#FFF5E1 → #FFE4C2 → #FFD4B3`) + 좌상단 **코랄 glow** + 우하단 매젠타 hint (OG 이미지와 동일 family)
- **아이콘**: 64×38 **반원 선셋 SVG** (inline gradient `#FFC140 → #FF8A5C → #FF6B5B` + horizon line) — OG 중앙 아이콘과 동일 조형
- **Eyebrow**: "YOU'RE INVITED" (clamp 1.125-1.5rem, **800 bold**, letter-spacing 0.25em, 코랄 `#E84F3D`, uppercase)
- **Hero**: 2줄 스택 — "Find your people" (**코랄→마젠타 그라데이션** `#FF6B5B → #E84393`) / "in Korea." (**코코아** `#2D1810`) — clamp 3-5.25rem, letter-spacing `-0.045em`
- **Subline**: "Korea's international community" — 웜 브라운 `#5C3E36`, 17-22px
- **CTA 더 크게**: padding `20/32`, shadow 레이어 4개 (clay effect)
- **Expires**: "Expires in 48 hours" uppercase 코코아 (hours 기반 formatter)
- `@keyframes inviteFadeIn` (14px slide + opacity, 0.6s)
- `generateMetadata` description에서 invite number 참조 제거

**감정 앵커 통일**: 랜딩 Hero / /invite YOU'RE INVITED / /join YOU FOUND US → 공통 Hero "Find your people in Korea" 3면 공유. Soho House 스타일 따뜻한 배타성.

### V. 로그인 후 /people 바로 튕김 — NextAuth redirect callback 버그 🐛
**증상**: Marco Kim (신규)가 초대 URL → Continue with Google → 가입 완료. **근데 /onboarding 안 거치고 /people로 바로 감**. 온보딩 미완료 상태로 people 디렉터리 전체 노출.

**원인 1** (`lib/auth.ts` redirect callback):
```js
// 기존 (버그)
async redirect({ url, baseUrl }) {
  if (url.startsWith(baseUrl)) return url;
  return baseUrl;  // relative URL "/onboarding"이 여기 fallback
}
```
`signIn('google', { redirectTo: '/onboarding' })`의 `redirectTo`가 redirect callback에 **relative URL**로 전달됨. `'/onboarding'.startsWith('http://localhost:3000')` → false → baseUrl로 fallback → 브라우저 `/`로 이동 → `app/page.tsx`의 `if (session) redirect('/people')` → /people 도착.

**Fix**:
```js
async redirect({ url, baseUrl }) {
  if (url.startsWith('/')) return `${baseUrl}${url}`;  // relative → 절대
  if (url.startsWith(baseUrl)) return url;
  return baseUrl;
}
```

**원인 2**: /people, /people/[id]에 onboarding gate 없음.
**Fix**:
- 두 페이지 모두 `backendFetch<ApiProfile>('/users/me')`로 `onboarding_complete` 체크.
- `loggedIn && !onboarded` → `authed=false, needsOnboarding=true` → **peek 모드** + 상단 배너 **"Finish your profile to connect"** → `/onboarding` CTA
- `app/page.tsx` (home redirect) — authed && !onboarded면 `/onboarding`으로 강제. 완료되면 /people.

### W. /people peek 모드 — 첫 행 sharp, 둘째 행부터 블러 🎭
**배경**: 미로그인/needsOnboarding 유저한테 "더 많은 사람들 있네" 호기심 자극 + 체험 차등.

- **Mask**: `linear-gradient(to bottom, black 0px, black 300px, rgba(0,0,0,.25) 420px, transparent 560px)` (픽셀 기반)
- 카드 높이 ~300px 기준 → **첫 행 완전히 sharp**, 둘째 행 시작점부터 fade, ~560px에서 완전 투명
- `pointerEvents: 'none'` on 블러된 grid (클릭 방지)
- **하단 CTA 분기**:
  - 미로그인: `Join to see all {N}+ people →` → `/join`
  - needsOnboarding: `Complete profile to see everyone →` → `/onboarding`
- `filtered.length >= 3`일 때만 mask 적용 (너무 적으면 어색)

### X. 프로필 사진 필수화 + 다중 최대 5장 📸
**배경 (필수화)**: 얼굴 없는 가입자 = 봇 의심. 커뮤니티 신뢰 유지 위해 1장 이상 강제.
**배경 (다중)**: "혹시 모르니" (사용자 요청). 갤러리 feature는 미래 — 지금은 저장 구조만 확보.

**Part 1 — 사진 필수 (3중 검증)**
- FE `canSubmit`에 `profileImages.length >= 1`
- Label: "Profile photos **\***" (빨간 별)
- Next `/api/onboarding/complete` — photo 없으면 400
- FastAPI `/users/onboarding` — `user.profile_image` 최종값 없으면 400

**Part 2 — 다중 사진 (최대 5)**
- **Migration 0025** — `users.profile_images text[] NOT NULL DEFAULT '{}'`
- **Drizzle schema** + **SQLAlchemy 모델** 동기화 (SA는 `ARRAY(Text)` + `server_default='{}'`)
- **Pydantic** `OnboardingBody.profile_images: list[str] | None = Field(max_length=5)` + `_check_images` validator (per-entry: 4.5MiB, `data:image/` or `http` prefix, 최대 5개 자름)
- **Onboarding 핸들러**: body.profile_images 오면 대체 + 첫 장을 `user.profile_image`로 동기화 (기존 PersonCard 코드 호환). Legacy single body 호환도 유지.
- **`ProfileOut.profile_images`** 추가 → `/users/me` 응답에 포함
- **`ProfilePatchBody.profile_images`** + validator + PATCH 핸들러 (0장 금지, 400)
- **Next `/api/users/me`** PATCH에 `profileImages` → `profile_images` 포워드

**UI (onboarding)**:
- `OnboardingForm` 완전 재작업 — 단일 원형 아바타 → **78×78 rounded-square 타일 row** (flex wrap)
- 첫 장: 코랄 **3px 테두리** + "MAIN" 배지 (하단 그라데이션 + 9px uppercase)
- 다른 장: 회색 얇은 테두리, **탭 → MAIN으로 승격** (splice + unshift)
- 우상단 **× 삭제 버튼** (stopPropagation으로 카드 클릭과 분리)
- `+` dashed 타일 (코랄) — 최대 5개까지 표시, 도달하면 숨김
- 동적 helper text (0장 / 1장 / 2+장)
- 같은 파일 재선택 가능: `e.target.value = ''`

**UI (/profile)**:
- `components/PhotosEditor.tsx` 신규 — 온보딩과 동일 타일 UI + **자동 저장** (각 add/remove/makePrimary 때 PATCH) + 실패 시 rollback + 1장 남으면 삭제 막기 ("Add another photo first — 1 required")
- /profile "Photos" 카드 신설 (Bio 위, 가장 상단)

### Y. Admin 페이지 영문화 🌐
**배경**: 제품 primary language = 영어. admin만 한글이라 개발자 일관성 망가짐.

- **40+ 한글 string 일괄 영문 교체**: alerts/confirms/prompts/EmptyRow/Row body/Meta/comments
  - 예: `발급 실패:` → `Failed to generate:`, `밴 실패:` → `Ban failed:`, `게시글 없음` → `No posts`, `이벤트 "${e.title}" 삭제?` → `Delete event "${e.title}"?`, `(국적 없음)` → `(no nationality)`, `(지역 없음)` → `(no area)`, `(사진만)` → `(photo only)`
  - confirm/prompt 문구도 전부 영문
- `toLocaleString('ko-KR', ...)` → `'en-US'` (`4월 18일 오전 02:03` → `Apr 18, 02:03 AM`)
- 검증: `grep -P "[\x{AC00}-\x{D7A3}]"` → 0 hit

### Z. UTM 추적 + 유저별 공유 링크 V1 📊
**배경**: 멤버 초대 발급 권한 확대는 premature (Phase 2 백로그). 그 전에 **organic viral growth 추적**만 넣기 — 유저가 개인 소셜에 링크 공유하면 GA4가 자동 attribution.

- **`components/RefTracker.tsx`** 신규 (client) — 랜딩 페이지 마운트, `?ref=X` + `utm_source/medium/campaign` 쿼리 포착
  - `chatda_ref` 쿠키 30일 저장 (향후 invite claim 시 attribution 기반)
  - GA4 `referral_visit` 이벤트 (ref_id + utm_*)
- **`components/ShareLinkCard.tsx`** 신규 — `/profile`에 장착 ("Share ChatDa" 카드)
  - URL: `${NEXT_PUBLIC_APP_URL}/?ref=${user.id}` (user.id 사용. `ref_slug` 컬럼은 V2 백로그)
  - **Copy 버튼** (clipboard + ✓ Copied 피드백 2초) + **↗ Share 버튼** (Web Share API — 모바일 인스타/스레드 네이티브 선택)
  - GA4 `share_link_copy` / `share_link_native`
- `app/page.tsx`에 `<Suspense><RefTracker/></Suspense>` 장착

**V2 백로그** (배포 + 데이터 쌓이면):
- `invite_tokens.referred_via_user_id` 컬럼 추가 → `claimInvite`에서 `chatda_ref` 쿠키 읽어서 기록
- `/admin` Invites 탭에 "via Alex" 표시
- `users.ref_slug` (readable 커스텀 slug) — URL 예쁘게

### AA. /join 리디자인 — 2차에 걸친 톤 진화 🏵
**1차 개편 — 구조 전환**:
- 제거: 🔒 emoji, "Invite only for now", "First 100 members. Keep it small.", Nav/Orb
- 추가: /invite/[token]과 동일 선셋 그라데이션 bg + 반원 SVG + Hero "Find your people / in Korea." (핑크 그라데이션 + 코코아) + subline "ChatDa is a private community. Reach out on Threads and I'll send you a link." + CTA "DM me on Threads →" + 하단 "Already have an invite link? Just click it."
- Server-side `if (session) redirect('/people')`

**2차 톤 조정 — Soho House 분위기**:
- Eyebrow 추가: **"YOU FOUND US"** (clamp 1-1.5rem, medium 500, letter-spacing 0.25em, uppercase, 웜 브라운 `#5C3E36`) — /invite "YOU'RE INVITED"와 구조적 대응
- Subline 1: "ChatDa is a private community." → **"ChatDa is a private community for now."** (`for now`로 미래 개방 암시)
- Subline 2: "Reach out on Threads and I'll send you a link." → **"Reach out on Threads for invitation link."** (간결)

### BB. PersonCard needsOnboarding 분기 — "로그인 유저가 Join 누름" 버그 🐛
**Bug**: authed-but-not-onboarded 유저가 /people 카드 "Sign up to connect →" 누르면 `/join` 감. 이미 로그인된 유저한테 /join "invite only" 안내 보이는 건 엉뚱.

**Fix**: `PersonCard`에 `needsOnboarding?: boolean` prop 추가. true면 CTA를 **"Complete profile →"** + `/onboarding`으로. `PeopleClient` + `/people/[id]` 상세 둘 다 전달.

3분기:
- **미로그인**: "Sign up to connect →" → `/join`
- **로그인 + 온보딩 미완료**: "Complete profile →" → `/onboarding`
- **로그인 + 온보딩 완료**: "+ Connect" 버튼 (직접 커넥트 액션)

### CC. 재로그인 경로 노출 — 접근성 gap 🔑
**Symptom**: 기존 가입자가 세션 만료 후 돌아오면 "Log in" 링크 못 찾음. Nav에 Join 버튼만 있고, /join은 초대 요청용, /login은 URL 직접 입력해야 접근. **북마크한 회원 = 막힘**.

**4-fold fix**:
1. **`Nav` unauth**: "Log in" 텍스트 링크 추가 (Join 버튼 왼쪽). linkIdleColor.
2. **`/login` 재작성**:
   - 카피 "Join chatda / Meet people..." → **"Welcome back" / "Sign in to ChatDa"** (재로그인 톤)
   - 선셋 반원 SVG family 통일 (아이콘 56×34)
   - 하단 "New to ChatDa? Request an invite →" → `/join`
   - redirect callback `signIn('google', { redirectTo: '/people' })` (직접 /people로, NextAuth redirect 버그 이미 수정됨)
3. **`/join` footer**: "Already a member? **Log in →**" → `/login` (코랄 색)
4. **`proxy.ts`**: `/login` authed 리다이렉트 `/meetups` (구 경로) → `/people`

### DD. Access Denied — 친절한 에러 UX 🚪
**Symptom**: 초대 없는 유저가 `/login` → Continue with Google 시도 → signIn callback `return false` → NextAuth **기본 에러 페이지** "Access Denied. You do not have permission to sign in." (디자인 깨짐, 이유 없음, 해결 경로 없음).

**Fix**:
- `lib/auth.ts` `pages.error = '/login'` 추가 — 에러 시 `/login?error=AccessDenied`로 리다이렉트
- `/login` 페이지 `searchParams.error` 체크:
  - `'AccessDenied'` → 헤딩 **"Invite required"** + 설명 "That Google account isn't registered with ChatDa." + **코랄 배너** ("ChatDa is invite-only. If you have an invite link, just click it. Otherwise, request one on Threads.") + **"Request an invite →"** → `/join`
  - 기타 에러 → "Something went wrong. Please try again."
  - 정상 → "Welcome back" 그대로
- "Continue with Google" 버튼 유지 (잘못된 Google 계정 선택했을 때 다시 시도 가능)
- 에러 배너 뜨면 하단 "New to ChatDa?" 링크 숨김 (중복)

---

### K. 보안 정리 🔒
- **DB 비밀번호 로테이션** — role `chatda` 비번 변경 (`chatda:chatda` → 강한 값)
- **`docker-compose.yml` / `.dev.yml` / `.prod.yml`** — 모든 literal `chatda` 비번을 `${DB_PASSWORD:?DB_PASSWORD must be set in .env}` 변수 참조로 전환
- **프로젝트 루트 `.env`** 신규 — compose 변수 substitution 전용. `.gitignore`의 `.env*`에 이미 포함됨
- **`package.json`** scripts — DB_PASSWORD 하드코딩 제거, `bash -c 'set -a && . .env.local && set +a && ...'` 패턴으로 env file sourcing
- **`scripts/migrate-prod.sh`** — PROD_URL 하드코딩 제거, `.env.production.local` source로 전환 + 마스킹 표시
- **docs/deployment** 관련 파일들 업데이트 필요 (후속)

---

## 🚨 보안 이슈 (미해결)

### 1. DB 비밀번호 transcript 노출
- 이번 세션 중 `.env` 수정 알림 + `docker compose config` 출력에서 literal `Ckwek7777!!` 노출 **2번**
- CLAUDE.md 정책: "시크릿이 한 번이라도 대화 로그에 등장하면 유출된 것으로 간주"
- **Action**: 배포 전(또는 직후) `openssl rand -hex 32`로 한 번 더 로테이션 권장
- 영향 범위: dev + prod 공통 role이라 prod도 같이 돌려야 함

### 2. 현재 비밀번호 강도 자체가 약함
- 11자 영숫자+`!!` — 사전 공격에 취약
- 외부에서 `localhost:5434` 직접 접근 불가 (WSL2 NAT + CF Tunnel ingress 없음)라 리스크는 제한적이지만 정책적으로 강한 PW로 전환 권장

---

## 📍 현재 상태

### Git (local)
```
56a8d6b feat(ui): light theme migration              ← 최신 커밋 (4/17)
bfcae41 feat(analytics): GA4 integration
d64f90b feat(v4): Step 1/2 pivot to People-first
a8dffb2 (origin/main)                                ← 원격 main
```
**origin/main 대비 3 commits 앞서지만 오늘 작업은 전부 uncommitted.** 실질 차이 훨씬 큼.

### uncommitted (git status)
- **수정 45+ 파일**: `app/**` (page, profile, people/[id], onboarding, login, admin, invite/[token], join), `backend/**` (database, auth, settings, routers/admin, routers/users), `components/**` (PersonCard, ui/Nav, 다수), `db/schema.ts`, `docker-compose*.yml`, `lib/**` (auth, stay-duration, server-api, invites), `proxy.ts`, `package.json`, `scripts/migrate-prod.sh`, `public/manifest.json`, `CLAUDE.md`, `.env.example`/`backend/.env.example`
- **신규 파일** (alphabetized):
  - **컴포넌트**: `components/BioEditor.tsx` / `MotivesEditor.tsx` / `SchoolCombobox.tsx` / `SchoolEditor.tsx` / `PrivacyToggle.tsx` / **`PhotosEditor.tsx`** (다중 사진 편집) / **`ShareLinkCard.tsx`** (유저 공유 링크) / **`RefTracker.tsx`** (랜딩 ref/utm 추적)
  - **lib**: `lib/stay-duration.ts` / `lib/featured.ts` (유휴) / `lib/invites.ts` (토큰 lookup + atomic claim + **formatTimeLeft** hours 기반)
  - **페이지**: `app/invite/[token]/page.tsx` (2회 리디자인) / `app/join/page.tsx` (2회 리디자인)
  - **API routes**: `app/api/admin/invites/route.ts` + `/[id]/route.ts`
  - **scripts**: `scripts/seed-cleanup.ts`
  - **Migration**: `drizzle/0018` ~ **`0025`** + meta snapshots (총 **8개** migration — 0025는 profile_images)
  - **public**: `public/og-invite.jpg` (1408×736, 156KB, 사용자 드롭 완료) + `og-invite.README.md`
  - **docs**: `docs/tasks/2026-04-17/pr-b-qa-checklist.md` / `session-report.md` / (이 문서)
  - `img/`

### Dev
- Postgres `chatda_dev` — **migration 0025까지 적용됨** (0017 + 0018-0025 = 8 신규)
- Next dev (`:3000`) 돌고 있음 — HMR로 모든 변경 실시간 반영
- Host uvicorn (`:8001`) 돌고 있음 — `--reload`로 routers/admin.py, routers/users.py, database.py 변경 감지
- **환경변수**: `NEXT_PUBLIC_THREADS_HANDLE` ✓ (사용자가 직접 세팅) / `NEXT_PUBLIC_APP_URL` ✓ (https://chatda.life — OG 메타에 확인됨) / **backend `ENVIRONMENT=production` 은 prod 배포 전 마지막 확인 필요**
- **실제 유저 2명**:
  - `marco.kim.kr@gmail.com` (Marco Kim, cLYSkSR6peyZPshDooayH) — 첫 실제 invite 클레임. onboarding 완료, 사진 2장, American/exchange_student/Seoul·Gangnam
  - `dykim9304@gmail.com` (DY K, admin) — **onboarding 미완료** (/people에 안 뜸. 배포 전 처리 필요)

### Prod (chatda.life)
- Postgres `chatda` — **migration 0017 상태 그대로**. 0018→0025 **전부 안 돌림** (8개 pending)
- chatda-app / chatda-backend 컨테이너 — 새 `${DB_PASSWORD}` env로 rebuild 완료 (4/18 PW 로테이션 때). **코드는 light theme 버전까지만**
- 기능 이격 (배포 전까지 prod에 없는 것들):
  - 체류 라인 / 커스텀 모티브 / School / Gender·Age / 새 Status / 새 PersonCard / 프라이버시 토글 / **다중 사진** / **초대 전용 게이트** / **/invite/[token] + /join 새 디자인** / **재로그인 경로** / **Access Denied UX** / **/people peek 모드** / **UTM 추적**
  - prod `/login`은 여전히 **무제한 Google 가입 허용 상태**
- Cloudflared / CF 터널 — 변경 없음, 정상

### 검증 상태
- **TypeScript** ✓ clean
- **ESLint** ✓ (기존 warn만 유지)
- **Python syntax** ✓
- **`npm run build`** — 마지막 확인은 PR-B 때. 오늘 이후 변경 다시 돌려야 함
- **Dev 수동 QA** — 로그인 / 온보딩 편집 / people 탐색까지는 실사용 됨. 전체 checklist는 `pr-b-qa-checklist.md` 참조 (현재 UI랑 일부 달라졌음 — 재작성 필요)

---

## 📅 내일 (2026-04-19) 할 일

### 🔥 오전 첫 1시간 — 반드시 처리

#### 1. 커밋 분할 🥇
40+ 파일 uncommitted. **feature별로 쪼개는 게 가독성·롤백 모두 유리**.

```bash
# 제안 분할 순서 (dependencies 고려):
# A. chore(sec): env-var DB credentials + PW rotation  → docker-compose*.yml, package.json, scripts/migrate-prod.sh, .env.example
# B. feat(v4.2): onboarding restructure — gender, school, age, district  → migration 0018-0021 + OnboardingForm + Profile editors
# C. feat(ui): PersonCard density refactor + pre-arrival coral  → PersonCard.tsx, lib/stay-duration.ts, PeopleClient z-index fix
# D. feat(privacy): show_personal_info toggle  → migration 0022 + PrivacyToggle + backend gating
# E. feat(seed): dev seed expansion (10 profiles, randomuser photos)  → scripts/seed.ts, seed-cleanup.ts, backend env filter
# F. feat(auth): invite-only signup (migration 0023 + 0024, /invite/[token], /admin Invites, signIn gate)
# G. feat(ui): light theme login page + Threads CTA scaffolding
# H. feat(onboarding): quality/suspension notice
# I. chore(docs): session reports + CLAUDE.md sync
```

또는 극단적으로 통째로 `feat(v4.2): major pivot to invite-only community + onboarding refactor` 하나로 — 배포 단위가 곧 커밋 단위. **내 추천: F를 독립 commit으로 최소 분리** (큰 architectural change라 되돌리기 쉽게).

#### 2. 환경변수 세팅 ⚙️
- ~~`NEXT_PUBLIC_THREADS_HANDLE`~~ ✓ 사용자가 직접 세팅 완료
- ~~`NEXT_PUBLIC_APP_URL=https://chatda.life`~~ ✓ 세팅 확인됨 (OG 메타 `og:image` absolute URL 정상 렌더)
- **남은 것**: `backend/.env.production`에 `ENVIRONMENT=production` 추가 — `@chatda.test` 시드 필터 이중 안전장치. **이 한 줄 반드시 추가**

#### 3. OG 이미지 🎨
- ~~`og-invite.png` 1200×630~~ ✓ 사용자가 `og-invite.jpg` (1408×736, 156KB) 드롭 완료
- 코드 `app/invite/[token]/page.tsx`와 README 둘 다 `.jpg` + 1408×736으로 업데이트됨
- Prod 배포 후 OG debugger로 실제 렌더 확인만 남음

---

### 🧪 그 다음 — dev 브라우저 E2E (45분) — 오늘 밤 추가된 부분 포함

**Admin 우선 — 본인 onboarding**:
0. **admin dykim9304 계정 `/onboarding` 접속 → 프로필 채우고 제출** (지금 onboarding_complete=false 상태라 /people에 안 뜸)

**Invite 플로우** (이미 Step 1~4 dev에서 확인됨 ✓):
1. `/admin` Invites 탭 → Generate → 자동 copy ✓
2. 시크릿창 `/invite/{TOKEN}` → 새 디자인 (YOU'RE INVITED eyebrow, Find your people in Korea, 48h, sunset SVG) 확인
3. Continue with Google → 다른 Gmail → **/onboarding**으로 정확히 감 (redirect callback fix 검증) → 완료 → /people
4. admin 돌아가서 Invites 탭 CLAIMED by {새유저} 확인 ✓ (Marco로 이미 확인됨)
5. **[남음]** 같은 URL 재사용 → "Invite already used" 페이지 확인
6. **[남음]** `expires_at = NOW() - INTERVAL '1 day'` 수동 설정 → "Invite expired" 확인
7. **[남음]** `/invite/INVALID_STRING` → "Invite link not recognized" 확인

**/join + /login + 재로그인**:
8. 시크릿창 `/join` → YOU FOUND US eyebrow + "private community for now" + "Reach out on Threads for invitation link" + 푸터 "Already a member? Log in →" 확인
9. `/join`에서 "Log in →" 클릭 → `/login` 랜딩 → "Welcome back" / "Sign in to ChatDa"
10. `/login`에서 초대 없는 Gmail로 Continue with Google → **"Invite required"** + 코랄 배너 + Request an invite →
11. Nav 언오쓰 상태 → "Log in | [Join]" 둘 다 보이는지

**/people peek + PersonCard 분기**:
12. 시크릿창(미로그인) `/people` → 첫 행만 sharp, 둘째 행부터 블러 + 하단 CTA "Join to see all N+ people →" → `/join`
13. Admin 로그인 상태 (onboarding 미완료)로 `/people` → 배너 + 카드 CTA "Complete profile →" → `/onboarding`
14. 온보딩 완료한 Marco로 로그인 → 정상 "+ Connect" 버튼

**다중 사진**:
15. `/onboarding`에서 사진 2장 업로드 → 첫 장 MAIN 배지 확인 → 둘째 탭 → MAIN 이동 → × 삭제
16. `/profile` Photos 카드 → 추가/삭제/MAIN 교체 전부 auto-save

**Privacy 토글**: `/profile` Privacy off → 다른 유저로 해당 프로필 열 때 age/gender 숨김

**UTM / 공유 링크**:
17. `/profile` → Share ChatDa 카드 → Copy → ✓ Copied
18. 시크릿창 `http://localhost:3000/?ref=<marco.id>` → 콘솔 `document.cookie`에 `chatda_ref=...`
19. GA4 DebugView에서 `referral_visit` 이벤트 노출 (GA_ID 세팅돼 있을 때)

**OG preview**:
20. prod 배포 후 https://www.opengraph.xyz/url/https%3A%2F%2Fchatda.life%2Finvite%2F{TOKEN}에 붙여서 실제 렌더 확인 (dev localhost는 외부 접근 불가)

---

### 🔒 배포 준비 (2시간) — QA 통과 후

#### 4. DB 비밀번호 재로테이션
transcript 노출 건. 배포 **전**에. runbook.md §8 절차. 요약:
```bash
# 1) openssl rand -hex 32 → 메모 (대화에 노출 X)
# 2) psql로 \password chatda
# 3) /home/dykim/project/ChatDa/.env의 DB_PASSWORD 교체
# 4) .env.local / .env.production.local / backend/.env.local / backend/.env.production / backend/.env 중 DATABASE_URL 있는 것 전부 교체
# 5) docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate --no-deps app backend
```

#### 5. Prod 배포 🚀
**pre-flight**:
- [ ] `backend/.env.production`에 `ENVIRONMENT=production` 있는지 확인
- [ ] `.env.production.local`에 `NEXT_PUBLIC_THREADS_HANDLE` 값 있는지
- [ ] `.env.production.local`에 `NEXT_PUBLIC_APP_URL=https://chatda.life`
- [ ] `public/og-invite.png` 파일 존재 (있으면 좋음)

```bash
# 백업 (필수)
mkdir -p ~/backups && PGPASSWORD="$NEW_PW" pg_dump -h localhost -p 5434 -U chatda chatda \
  > ~/backups/chatda-$(date +%Y%m%d-%H%M%S).sql

# Migration 0018 → 0025 순차 적용 (8개)
npm run db:migrate:prod   # APPLY 타이핑

# 컨테이너 rebuild
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app backend

# Smoke
curl -sI https://chatda.life | head -1
curl -sI https://chatda.life/join | head -1
curl -s https://chatda.life/invite/INVALID | grep -o "Invite link not recognized"  # 비로그인 path
```

**배포 직후 할 것**:
1. 본인 admin 계정으로 prod 로그인 → `/admin` → 첫 invite 발급 → URL 복사
2. 시크릿 창에서 열어서 실제 OG 미리보기 확인 (Threads / Discord에 붙여보기)
3. Melissa 등 기존 유저에게 "새 필드 채워달라"고 DM — gender/age/school 없어도 앱 동작하지만 완성도 표시 안 뜸

**위험 포인트**:
- 기존 prod 유저 3명 (Melissa, dykim04 admin 등) — `show_personal_info` DEFAULT true라 프라이버시는 OK, 근데 gender null이라 PersonCard 상세의 "age · gender" 라인 생략됨 (조건부 렌더라 에러 X)
- **초대 gate 영향**: 기존 유저는 signIn callback의 "existing users" 분기로 grandfather됨 → 재로그인 OK. 근데 **새 Google 계정으로 가입하려는 기존 유저는 차단됨** — 다른 Gmail로 갈아타고 싶어하면 admin이 invite 발급해줘야 함.
- Cloudflare 캐시 — Hero 텍스트/이미지 변경 없으니 크게 문제 없을 것. 혹시 이슈 있으면 CF Dashboard → Purge Cache.

---

### 🚀 부트스트랩 (배포 성공 후) — 이번 주 중

#### 6. 첫 10명 초대 보내기 📮
- 개인 네트워크에서 다양성 있게 골라서 Threads DM
- 타겟 다양성: exchange student (Yonsei/SNU) 2~3명 / expat (Seoul Gangnam) 2~3명 / local Korean 2명 / Busan/Jeju 1~2명
- 각 invite에 note 남겨두기 ("Sarah from Yonsei") → `/admin/invites`에서 누가 뭘 클레임했는지 추적
- 10명 채워지면 내부 지표 체크 — 온보딩 이탈률, 누가 Connection 시도하는지

#### 7. 초대 카운터 공개 (선택) 📊
"Invite #47 of 100"을 admin이 발급할 때만 보이지 말고, landing hero에 공개 숫자로도 띄울지 고민.
- 장점: "19명 / 100명 남았어요" 희소성 강조, bootstrap 단계에 유리
- 단점: 안 찰 때 민망함. 데이터 있으면 쉽게 결정.

---

### 🔮 다음 라운드 (이번 주 말~다음 주) — **지금 말고**

#### 8. People 필터 확장 🎯
오늘 추가한 필드 살리기:
- **School** 필터 — 같은 학교 Student 한눈에
- **Gender** 필터 — 선호도 고려 (but 데이팅 프레이밍 주의)
- **Age range** — 20-25 / 26-30 / 31+
- **District** — Seoul 내 구 단위
**추정**: 0.5일. `PeopleClient.tsx` 필터 UI + 클라이언트 로직 확장. 서버 변경 X.

#### 9. 네트워크 트리거 ⭐
상세 페이지 하단에:
- "Others at Yonsei University (3)" — 같은 학교 Student
- "Others from Vietnam (5)" — 같은 국적
- 3~5명 mini card
**추정**: 1일. Backend `/users/{id}/related` + FE 섹션.

#### 10. 나머지 다크 페이지 라이트 이행
Phase 3 마무리 — `/host`, `/host/events/[id]/edit`, `/meetups`, `/meetups/[id]`, `/places`. **admin은 dark 유지** (기능성 우선, 선셋 Invites 탭만 예외적으로 light accent)
**추정**: 0.5~1일. 기계적.

#### 11. PR-C DM 🗨
Connection 성사 후 소셜 링크 뿐인 dead-end 해소. 10명 채운 후에 engagement 위해.
**추정**: 3~4일.

### 2. PW 재로테이션 🔒
transcript 노출 해소 — 배포 **전**에 하는 게 안전 (새 PW로 컨테이너 그대로 넘어감).
```bash
# 1) openssl rand -hex 32 → 메모 (대화에 노출 X)
# 2) psql로 \password chatda
# 3) /home/dykim/project/ChatDa/.env의 DB_PASSWORD 교체
# 4) .env.local / .env.production.local / backend/.env.local / backend/.env.production / backend/.env 중 DATABASE_URL 있는 것 전부 교체
# 5) docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate --no-deps app backend
```

### 3. Prod 배포 🚀
```bash
# 백업 먼저
mkdir -p ~/backups && PGPASSWORD=<현재PW> pg_dump -h localhost -p 5434 -U chatda chatda \
  > ~/backups/chatda-$(date +%Y%m%d-%H%M%S).sql

# DB migration (0018 → 0021 순차 적용)
npm run db:migrate:prod   # APPLY 타이핑

# 컨테이너 rebuild
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app backend

# 검증
curl -sI https://chatda.life | head -1
curl -s https://chatda.life/api/events  # []
```

**⚠️ 배포 전 체크**: `backend/.env.production`에 **`ENVIRONMENT=production`** 추가 필수. 안 하면 default("development")라 혹시라도 prod DB에 `@chatda.test` 데이터 있을 경우 노출됨. (prod에 시드 주입 안 할 예정이라 실질 영향 없지만 **2중 안전장치**로 반드시 설정.)

**⚠️ Landing Section 2**: prod엔 실유저 <4면 섹션 자체가 render 안 됨 — 사용자가 개인 네트워크로 5~10명 채우기 전까진 랜딩은 Hero만 보임. 정상 동작.

**위험 포인트**:
- 기존 prod 유저(Melissa 등 3명)는 **gender, school, age 없음** → 앱 레벨에서 required인데 렌더 시 어떻게 보일지 검토
  - 상세 페이지: "24 · Female" 라인이 조건부 렌더라 생략되는 건 OK
  - 그런데 **편집하려고 /onboarding?edit=1 들어가면 gender 필수 검증에 막힘** — 기존 유저가 불편할 수 있음
  - 완화: 기존 유저한테 "프로필 업데이트 필요" 배너 띄울지, 아니면 onboarding_complete=true 유저는 기존 값 유지 허용할지 결정 필요

### 3.5. 실제 프로필 부트스트랩 👥 (Section 2 alive 전제)
사용자가 개인 네트워크에서 **5~10명** 실명 가입 유도 — Landing Section 2 & /people 페이지 활성화의 유일한 정직한 경로.
- 모집 타겟 다양성 맞추면 Section 2 퀄리티 ↑ (서로 다른 status × nationality × location)
- 4명 채워지면 Section 2 자동 등장, 8명+ 모이면 featured 다양성 rotation 여유
- 가짜 프로필 prod 주입은 **제품 신뢰 자살** — 논의 끝 (session report L 항목 참조)

### 4. People 필터 확장 🎯 (신규 필드 살리기)
방금 추가한 필드 전부 필터 축으로 활용:
- **School** — 같은 학교 Student 한눈에
- **Gender** — 남/여/기타
- **Age range** — 20-25, 26-30 식
- **District** — Seoul 내 구 단위

**추정**: 0.5–1일. `PeopleClient.tsx` 필터 UI + 클라이언트 필터 로직 확장. 서버 변경 없음.

### 5. 네트워크 트리거 섹션 ⭐
상세 페이지 하단에:
- "Others at Yonsei University (3)" — 같은 학교
- "Others from Vietnam (5)" — 같은 국가
- 3~5명 프로필 미니 카드

**추정**: 1일. `backend/routers/users.py`에 GET `/users/{id}/related` 엔드포인트 + 상세 페이지 섹션.

### 6. 나머지 다크 페이지 라이트 이행
Phase 3 정리 — `/admin`, `/host`, `/host/events/[id]/edit`, `/meetups`, `/meetups/[id]`, `/places`.
로그인 페이지 제외. **추정**: 0.5–1일 (기계적 작업).

### 7. PR-C (DM) 🗨
v4-followup.md 섹션 5 그대로. **추정**: 3–4일.
- 전제: 실유저가 connection 후 이동할 곳이 "소셜 링크"뿐인 상태라 DM 없이는 dead-end
- 10명 초대 멤버 모을 거면 DM 있는 편이 engagement 훨씬 높음

### 8. 기존 유저 migration 대응 (3번 뒷수습)
- gender 필수 룰이 기존 유저에 영향 → 배포 후 Melissa에게 "프로필 업데이트" 요청
- 또는 가벼운 data migration: `UPDATE users SET gender = 'other' WHERE gender IS NULL` (default 채우기) → 배너로 "정확히 선택해주세요" 유도

---

## 🎯 열린 결정

### 오늘 해결된 것 ✓
- ~~Invite #N of 100 카운터 공개~~ → **초대 페이지 pill 자체 제거** (empty signal 역효과). admin 내부만 유지.
- ~~Threads 핸들~~ → 사용자가 env 직접 세팅 완료
- ~~OG 이미지~~ → JPG 1408×736 드롭 완료
- ~~NEXT_PUBLIC_APP_URL~~ → 세팅 확인됨

### 아직 열림 (prod 배포 전 결정 필요)
1. **커밋 단위** — 하나 큰 `feat(v4.2): invite-only pivot + multi-photo` vs 10+ feature별 쪼개기 (추천: **F invite system만 독립 분리**, 나머지 1개로 통합)
2. **기존 유저 gender null** — 자동 migration (`UPDATE ... SET gender = 'other'`) vs 재온보딩 강제 vs 그대로 두고 배너로 유도 (prod 유저 3명밖에 없어서 DM 한 번으로 해결 가능)
3. **`/admin` Invites 탭 light mode 일관화** — 지금 peach accent만 + dark 나머지 vs 전체 light 이행 (시간)
4. **초대 소진 후 confirm 메시지** — prod 10명 찬 후 "Capacity reached" 랜딩 보여줄지 vs 계속 조용히 초대 발급
5. **PR-C DM 우선순위** — 10명 채워지는 대로 착수 vs 50명+ 채워질 때까지 미루기

### 새로 생긴 결정 (이번 세션에서 등장)
6. **멤버 초대 발급 권한 확대 시점** — Phase 2(유저 10-30명) 도달 시 `users.can_invite` flag + 월 3장 쿼터로 열지, 아니면 Phase 3(30-100명)까지 admin-only 유지. 지금은 admin-only로 확정, **언제 풀지가 질문**
7. **사진 갤러리 상세 페이지 표시** — /people/[id]에 primary만 보임. 멀티 사진은 저장되지만 다른 유저는 못 봄. **언제 갤러리 UI 추가?** (현재는 저장만. /profile 본인은 전체 보임)
8. **UTM V2 attribution** — `invite_tokens.referred_via_user_id` 컬럼 + claim 시 쿠키 기록. **언제 구현?** (배포 + ref 쿠키 실제 쌓이고 나서 의미 있음)
9. **`ref_slug` readable URL** — 지금은 `?ref=<21자 nanoid>` 못생김. `users.ref_slug` 컬럼 추가 시점 (유저가 짜증 내기 시작하면)

---

## 📚 참고 문서
- [`v4-followup.md`](../2026-04-17/v4-followup.md) → PR-A ✓ / PR-B ✓ / PR-C pending
- [`light-theme-migration.md`](../2026-04-17/light-theme-migration.md) → Phase 3 backlog 일부 소진 (로그인 페이지 done, 나머지 host/meetups/places 남음)
- [`pr-b-qa-checklist.md`](../2026-04-17/pr-b-qa-checklist.md) → 초기 PR-B QA용, 이후 UI 변경으로 일부 outdated
- [`../../deploy/runbook.md`](../../deploy/runbook.md) §4 §5 — 배포/마이그레이션 명령 / §8 PW 로테이션
- [`../../deploy/security-followup.md`](../../deploy/security-followup.md) — 보안 backlog
- [`CLAUDE.md`](../../../CLAUDE.md) — 프로젝트 메타 (다음 커밋에 초대 시스템 반영 필요)
- [`public/og-invite.README.md`](../../../public/og-invite.README.md) — OG 이미지 드롭 가이드

---

## 🗺 내일 아침 지도 (깨어나서 바로 본다면)

**0. 커피 마시기** ☕

**1. 이거 먼저 열어** (30초):
   - `docs/tasks/2026-04-18/session-report.md` (이 문서) §📅 내일 할 일
   - `git status` — uncommitted 현황 감 잡기 (수정 45+ / 신규 10+ / migration 8개)

**2. 핵심 결정 2개** (3분):
   - **커밋 전략**: 통 하나(`feat(v4.2): invite-only + onboarding refactor + multi-photo`) vs **F invite system만 분리**? (내 추천: F만 분리)
   - **prod 배포 타이밍**: 오늘 안에? 주말? 월요일? (급한 이유 없음. 내가 개인 네트워크 초대 DM 준비되는 날로 맞추는 게 낫다)

**3. 실행 순서** (4단계):
   1. **admin 본인 onboarding 완료** (dev에서. `/onboarding` 채워서 `onboarding_complete=true`로 만들기)
   2. **dev 브라우저 E2E** 20개 체크리스트 (위 §🧪)
   3. **PW 로테이션** (transcript 노출 건 해소)
   4. **prod 배포** (migration 0018-0025 + docker rebuild + smoke test)
   5. **첫 3명 Threads DM**

**4. 절대 까먹지 말 것**:
   - **backend `/.env.production`에 `ENVIRONMENT=production` 한 줄** 반드시 추가. 안 하면 `@chatda.test` 시드 필터 안 됨 (prod엔 시드 없지만 2중 안전장치)
   - Migration `0018→0025` **8개** 순차 적용 — 0024(invite_number SERIAL) 하나라도 실패하면 invite 발급 500. 로그 확인
   - **prod 배포 후**: chatda.life `/login`에서 본인 admin으로 재로그인 → `/admin` Invites → 첫 초대 발급 → 개인 Threads/Discord 미리보기 OG 확인
   - 기존 prod 유저 3명(Melissa 등) — gender null이라 `/onboarding?edit=1` 들어가면 gender 필수로 막힘. **배포 직후 DM**: "프로필 업데이트 좀 해주세요 (gender 등 새 필드 추가됨)"
