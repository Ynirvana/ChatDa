# Light Theme Migration — 2026-04-17

> 다크 클럽톤 → Airbnb식 선셋 크림 팔레트 전환.
> 감정 목표: 설렘 + 따뜻함 + 여행의 들뜬 느낌.
> 진행: Phase 1 (랜딩) → Phase 2a (PersonCard) → Phase 2b (/people + /profile + /onboarding) → Phase 3 (backlog).

## 확정된 팔레트 (globals.css `@theme inline`에 토큰 추가)

```
--color-light-bg:           #FDF9F5   /* 웜 오프화이트 */
--color-light-warm:         #FFF4EC   /* 피치 틴트 */
--color-light-warmer:       #FFEDE0   /* 더 진한 피치 */
--color-light-surface:      #FFFFFF   /* 카드 */
--color-light-text:         #2D1810   /* 딥 브라운 */
--color-light-text-muted:   rgba(45, 24, 16, .62)
--color-light-text-subtle:  rgba(45, 24, 16, .42)
--color-light-border:       rgba(45, 24, 16, .08)
--color-coral:              #FF6B5B   /* 선셋 코랄 */

.page-bg-light 배경: linear-gradient(180deg, #FDF9F5, #FFF4EC, #FFE8D9, #FFDDC7)
액센트 그라디언트: #FF6B5B → #E84393 (핑크/코랄 선셋)
```

## 적용 완료 (Phase 1 + 2)

### 공용 컴포넌트 (light prop 재사용 토큰)
- `components/ui/Card.tsx` — `light?: boolean` 추가
- `components/FilterSelect.tsx` — `light` (default true)
- `components/NationalityCombobox.tsx` — `light` (default true)
- `components/ui/Nav.tsx` — `light` (default true — 2026-04-17 뒤집음), Join 버튼 light에서 accent variant + shadow

### 페이지
- `app/page.tsx` — 랜딩 (Phase 1)
- `app/people/page.tsx` — 리스트 wrapper
- `app/people/[id]/page.tsx` — 프로필 상세
- `app/profile/page.tsx` — 본인 프로필 편집
- `app/onboarding/OnboardingForm.tsx` — 6필드 온보딩 폼
- `app/login/page.tsx` — **다크 유지** (전략적, 웰컴 임팩트) + "Seoul"→"Korea" 카피 수정

### 편집 서브컴포넌트
- `components/PersonCard.tsx` — LinkedIn식 카드
- `components/TagEditor.tsx` — can_do/looking_for
- `components/LanguagesEditor.tsx` — 언어 + 레벨
- `components/InterestsEditor.tsx` — 20 프리셋
- `components/StayDatesEditor.tsx` — 체류 기간
- `components/LookingForPicker.tsx` — 10 모티브 칩
- `components/ProfileCompleteness.tsx` — 진척률 바
- `components/ConnectionRequests.tsx` — Pending 리스트

### 기타
- `app/globals.css` — `.page-bg-light` 클래스, `input.input-light::placeholder` / `select.input-light option` 룰
- `components/ui/Button.tsx` — `accent` variant 업데이트 (#FF6B35 → #FF6B5B + 그림자)

### 다크 유지 (명시적 `light={false}`)
- `/login` — Nav 없음, 풀스크린 다크 (웰컴 임팩트)
- `/admin` — admin tool, 다크 유지
- `/host`, `/host/events/[id]/edit` — Meetups 호스팅 (v4 부트스트랩 보조)
- `/meetups`, `/meetups/[id]` — v4 부트스트랩 보조, Nav에서는 제거됨

## Skill 가이드라인 (ui-ux-pro-max) 체크

적용한 것:
- [x] Contrast 4.5:1 AA (본문 opacity ≥ .6)
- [x] Line-height 1.5+ (본문)
- [x] Cursor pointer 모든 클릭 요소
- [x] Hover feedback (color/shadow, not scale)
- [x] Focus 대체 (outline:none 후 border color 변경)

미달 / 백로그:
- [ ] Touch target 44x44px — PersonCard Connect 버튼 ~40px (카드 그리드 제약). 모바일 접근성 라운드에서 재설계 필요

## Phase 3 Backlog (별도 라운드)

### 비로그인 상세 페이지 tease
`/people/[id]`를 로그아웃 상태로 보면 "Sign up to connect" 아래가 허전. 가입 전환 손실.
- [ ] "🔒 Bio, Languages, Interests, Tags — unlock after sign up" tease 카드
- [ ] 흐릿한 placeholder 카드 3-4개 (blur filter)
- [ ] 또는 "5 more sections locked" + 통계 (e.g. "234 people here")

### Nav Join 버튼 개선
Phase 2에서 `light=true`일 때 `accent` variant + shadow로 처리함. 추가:
- [ ] 호버 시 scale 없이 shadow 강화
- [ ] 모바일 터치 타겟 확인

### 모바일 접근성 라운드
- [ ] PersonCard Connect 버튼 44x44 확보 (카드 폭 재설계 또는 버튼 레이아웃 변경)
- [ ] FilterSelect 드롭다운 항목 `min-height: 44px` 보강
- [ ] `/people` 모바일 그리드 — 현재 `minmax(200px, 1fr)`로 2열. 320px 스크린에서 카드 1개만 보임. 재검토 필요

### 다크 페이지 Phase 2로 편입 (결정 보류)
v4 부트스트랩 정책상 유지되는 다크 페이지들:
- /meetups, /meetups/[id] — Meetups 되살리면 라이트로 flip
- /host, /host/events/[id]/edit — 동일
- /admin — admin tool 성격상 다크 가능. 유지 or flip 결정 필요
- /login — 전략적 다크 유지 (웰컴 임팩트). FIX.
