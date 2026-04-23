# 2026-04-17 세션 리포트

> 저녁 먹고 돌아와서 볼 문서. "어디까지 했고, 뭐부터 다시 시작할지" 한눈에.

---

## 🏁 오늘 마무리된 것

### 1. PR-A: GA4 Analytics 통합 (commit `bfcae41`)
- `lib/analytics.ts` + `AnalyticsRouteTracker` 신규
- `app/layout.tsx` GA Script 주입 (afterInteractive)
- 5개 커스텀 이벤트: `page_view`, `onboarding_complete`, `people_filter_apply`, `people_card_click`, `connect_request_send`
- **Prod 배포 완료** — chatda.life에서 GA Realtime 수신 확인됨 (`G-VPSYV91YWY`)
- Dev 검증 완료 (DebugView로 5개 이벤트 발사 확인)

### 2. v4 Step 1/2 일괄 커밋 (commit `d64f90b`)
- 이전 세션에서 uncommitted 상태로 prod 돌던 56개 파일 한번에 정리
- Nationality combobox, FilterSelect, StayDates/Languages/Interests/Tag 에디터, ProfileCompleteness, 마이그레이션 0014-0017 등
- git history 깔끔해짐

### 3. Light Theme 전면 전환 (commit `56a8d6b`)
- Airbnb식 선셋 크림 팔레트 (`#FDF9F5 → #FFDDC7`) 도입
- **Phase 1** 랜딩 → **Phase 2a** PersonCard + /people → **Phase 2b** /profile + /onboarding + 8개 에디터 서브컴포넌트
- 재사용 토큰: Card/Nav/FilterSelect/NationalityCombobox에 `light` prop
- Nav 기본값 `light=true`로 뒤집음, 다크 유지 페이지 (admin, host, meetups, login) 6곳 명시적 `light={false}`
- `/login` "Seoul" → "Korea" 카피 수정 (부산 유저 거리감 제거)
- ui-ux-pro-max 스킬로 AA contrast / line-height 1.5 / cursor-pointer / focus 체크
- Prod 아직 배포 안 됨 — dev localhost:3000에서 검증 완료

### 4. docs/tasks 구조 재편
- `docs/tasks/2026-04-17/` 디렉토리로 오늘 작업 문서 그룹화
- `v4-followup.md`, `light-theme-migration.md`, `session-report.md`(이 문서)
- **아직 uncommitted** — rename + README 수정

---

## 📍 현재 상태

### Git
```
56a8d6b feat(ui): light theme migration              ← 최신 commit
bfcae41 feat(analytics): GA4 integration
d64f90b feat(v4): Step 1/2 pivot to People-first
a8dffb2 (origin/main)                                ← 원격 main
```
**origin/main보다 3 commits 앞섬**. 아직 push 안 됨.

### Prod (chatda.life)
- ✅ GA4 돌고 있음 (측정 ID `G-VPSYV91YWY`)
- ✅ v4 Step 1/2 동작 중 (이미 전에 배포됨, 이번 commit은 소급 정리)
- ❌ **Light theme 아직 안 감** — 유저한테는 다크 버전 그대로 보임

### Dev (localhost:3000)
- ✅ Light theme 전부 반영됨
- ✅ 모든 typecheck 통과
- 서버 돌고 있을 수도 — 복귀 후 새로고침

### uncommitted
- `docs/tasks/README.md` (M)
- `docs/tasks/2026-04-17-*.md` → `docs/tasks/2026-04-17/*.md` (R rename)
- `docs/tasks/2026-04-17/session-report.md` (새 파일, 이것)

---

## ▶️ 복귀하면 바로 할 것 (우선순위 순)

### 1. 지금 uncommitted 한 번에 커밋 + push
```bash
cd /home/dykim/project/ChatDa
git add -A
git commit -m "docs(tasks): group 2026-04-17 into dated subdirectory + session report"
git push origin main
```
→ origin/main 4 commits 앞에서 sync됨.

### 2. Light theme prod 배포
```bash
cd /home/dykim/project/ChatDa
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app
```
env 변경 없어서 rebuild만. 60~90초. 끝나면 chatda.life 시크릿창에서 확인:
- 랜딩 크림 배경 ✓
- /people 라이트 카드 ✓
- /login 다크 유지 ✓

---

## 📋 다음 라운드 백로그

순서는 네가 정하면 됨. 대강 **PR-B 계열 먼저 → DM 나중**이 원래 계획이었음.

### PR-B (원래 계획, `docs/tasks/2026-04-17/v4-followup.md`)

스펙 다 확정된 상태. 바로 착수 가능.

- [ ] **체류기간 표시 강화** — `lib/stay-duration.ts` 순수 함수, Expat은 month picker (`<input type="month">`), 나머지 status는 date picker 유지. PersonCard + /people/[id] + /profile 3군데 표기.
- [ ] **커스텀 모티브** — 11번째 "Other" 옵션, `users.looking_for_custom: text` 별도 컬럼 (migration 0018), 상한 3 유지. OnboardingForm + People 필터 조정.
- [ ] **커스텀 태그** — TagEditor에 +Custom inline input, `userTags.tag`는 이미 text라 스키마 변경 없음, **hard cap 3** (can_do/looking_for 각각), grandfathering (편집 시 수렴).
- [ ] **랜딩 Upcoming 섹션 제거** — `app/page.tsx`에서 v3 잔재 featured meetup 빼기. 이미 light 전환할 때 같이 정리됨 — 확인 필요.

추정: **2.5일**.

### PR-C (DM v0)

- [ ] Migration 0019: `conversations`, `messages`, `conversation_reads`
- [ ] FastAPI `backend/routers/messages.py` 6개 엔드포인트
- [ ] `/messages` 인박스 + `/messages/[id]` 대화창
- [ ] Nav ✉️ 뱃지 + 폴링 계층 (10s/30s/60s)
- [ ] Connect-accepted 관계만 DM 가능
- [ ] body 2000자 제한

추정: **3~4일**.

### Phase 3 (라이트 테마 마감, `light-theme-migration.md`)

다크 유지 정책이라 작지만 놓치기 쉬운 것들.

- [ ] **비로그인 상세 페이지 tease** — `/people/[id]` 로그아웃 시 "Sign up to connect" 아래 허전. 흐릿한 placeholder 카드 3~4개 or "🔒 5 more sections after signup" 스타일 tease. (네가 Marco/Sarah 상세 볼 때 두 번이나 지적한 이슈)
- [ ] **모바일 터치 타겟 44x44** — PersonCard Connect 버튼 ~40px로 미달. 카드 그리드 재설계 필요.
- [ ] **FilterSelect 드롭다운 항목 min-height** — 동일 맥락.
- [ ] **Nav Join 버튼 hover 스케일 금지** — 스킬 가이드라인. 현재 shadow만 있고 확인 OK 같은데 더블체크.

추정: **1~2일**.

### 나머지 backlog (원래 `docs/plans/todo.md`에서 계승)

- [ ] 알림 시스템 (Nav 🔔 + unread 뱃지 + dropdown). Connect request/accept/reject, RSVP new/approved/rejected, comment reply.
- [ ] 이미지 S3/Cloudinary 이전 (현재 base64 in DB)
- [ ] 이벤트 취소/신청 취소, 반복 일정 (Meetups 되살릴 때)
- [ ] Gigs 탭 (v4 2단계)
- [ ] 프로덕션 하드닝 — DB 백업 cron, UptimeRobot, CF Bot Fight, Sentry

### 본격 유저 유입 단계 (네가 메모 마지막에 말한)

- [ ] **10명 초대 멤버** 온보딩 — 디자인 이제 "팔리는 수준"이라는 판단.
- [ ] 첫 번째 밋업 주최 — 부트스트랩 모드로 밋업 → 프로필 등록 → 탐색 유도.
- [ ] GA 1주일 관찰 후 funnel 판단 (landing → /people 클릭률, Connect CTR 등).

---

## 🎯 열린 결정 사항 (저녁 먹으면서 생각해볼 것)

1. **Prod 배포 지금 할래, 아침에 할래?**
   - 지금: 새 유저 오늘 밤부터 Airbnb 톤 체험
   - 아침: 깨어있는 상태로 문제 터지면 즉시 대응 가능
2. **PR-B 언제 시작?** — 광고/초대 시작 전에 기능 다 박고 싶은지, 지금 UI로 유저 받기 시작하면서 병행인지
3. **DM 우선순위** — 10명 초대 때 필수? 아니면 초반엔 소셜링크로 충분?
4. **관찰 윈도우** — GA 최소 며칠 돌려보고 기능 추가 판단할지

---

## 🧠 기억용 맥락

- **제품 방향 v4**: 한국판 외국인 The Facebook. People 탭이 핵심, Meetups는 부트스트랩 수단.
- **감정 기조**: "설렘 + 따뜻함 + 여행의 들뜬 느낌" — 오늘 light theme으로 정체성 확보.
- **기획서**: `docs/ChatDa.md` (v4), `docs/ChatDa-v3-archive.md` (이전본).
- **Deploy runbook**: `docs/deploy/runbook.md` §4 (코드 업데이트), §5 (DB 마이그레이션), §9 (롤백).
- **스킬 활용**: `ui-ux-pro-max`를 디자인 작업 전 항상 먼저 쿼리 — 오늘 중간에 놓쳤다가 PersonCard 2차 수정 파생됨. 다음부턴 루틴화.
