# PR-B QA Checklist — 2026-04-17

> ⚠️ **Outdated as of 2026-04-18.** 이후 스코프 크게 확장 (온보딩 재구성 / Status 단순화 / School / Gender / Age / District / 라벨 변경).
> 전체 범위는 [`../2026-04-18/session-report.md`](../2026-04-18/session-report.md)에서 확인.
> 이 체크리스트는 **초기 PR-B 기본 기능만** 검증하는 용도로만 의미 있음.

PR-B 스코프: 체류기간 표시 강화 + 커스텀 모티브 + 커스텀 태그 + 랜딩 카피 수정 + country_of_residence 컬럼.

Dev 서버: Next `http://localhost:3000` / Backend `http://localhost:8001`.

## 랜딩 (`/`)
- [ ] 뱃지에 **"Korea's international community"** (기존 "cross-cultural network" 아님)
- [ ] 하단 태그라인 **"Exchange students · Expats · Creators · Digital nomads — all in Korea"**
- [ ] H1 "See who else is here in Korea." 유지
- [ ] CTA "Browse Profiles →" 유지

## 온보딩 편집 (`/onboarding?edit=1`)
- [ ] "What brings you here?" 섹션에 프리셋 10개 + **11번째 ✨ Other… 칩**
- [ ] Other 칩 클릭 → inline text input 등장 (max 30자, placeholder "What else? (max 30 chars)")
- [ ] "한강 가이드" 같은 커스텀 입력 후 저장 → 프로필에 저장됨
- [ ] 프리셋 3개 선택 시 Other 칩이 **disabled** (상한 3 = 프리셋 + 커스텀 합산)
- [ ] 프리셋 2개 + 커스텀 1개 저장되는지
- [ ] 카운터 "3/3 selected — max reached" 표시

## 프로필 (`/profile`)
- [ ] Status = **Living in Korea**(expat)로 바꾸면 Stay 섹션이 `<input type="month">`로 전환 (year/month만)
- [ ] month picker로 `2024-01` 저장 후 "Others see" 박스에 **"🗓️ 2y 3mo in Korea"** + "Since Jan 2024"
- [ ] Status = **Visiting**으로 바꾸면 arrived/departed 두 date picker
- [ ] Visitor에 arrived=오늘-3일, departed=오늘+4일 → "Day 4 of 8" 같은 포맷
- [ ] My Tags 섹션 — `can_do` 카운터 **"0/3"** 노출
- [ ] can_do에 프리셋 3개 찍으면 + 버튼들 사라지고 **"Max reached — remove one to add another"** 표시
- [ ] **+Custom** 버튼 클릭 → inline input (max 24자) → "Photography Studio 대여" 추가 → dashed border로 구분됨
- [ ] looking_for 카테고리도 동일한 상한 3 동작
- [ ] Save Tags 버튼 클릭 → 성공 시 에러 없이 저장됨

## People 탭 (`/people`)
- [ ] 카드 마다 **🗓️ 체류 라인** 노출 (status별 포맷)
  - Expat: "2y 3mo in Korea"
  - Visitor (진행 중): "Day 4 of 7"
  - Visiting soon: "Arriving in 12 days" (주황)
  - Visited before: "Visited 3mo ago (10 days)" (회색)
- [ ] 모티브 pill 최대 2개 + "+N" 노출
- [ ] **커스텀 모티브 pill**은 dashed border로 프리셋과 구분
- [ ] 필터 "What brings them" 드롭다운에는 프리셋 10개만 (Other 없음)

## People 상세 (`/people/[id]`)
- [ ] 상단 체류 블록 **primary (굵게) + secondary (작게 2줄)**
- [ ] 신규 **"What brings them here"** Card 렌더 — 프리셋 + 커스텀(dashed) 같이
- [ ] 기존 Languages / Interests / Tags 섹션 정상 동작

## 네트워크/DB 검증 (선택)
- [ ] Dev DB에 `country_of_residence = 'KR'` 기본값으로 박혀있는지 (`psql chatda_dev -c "SELECT id, country_of_residence FROM users LIMIT 3;"`)
- [ ] `looking_for_custom` 컬럼 존재 확인
- [ ] 백엔드 `/users/me` 응답에 두 필드 포함

## 실패 케이스
- [ ] 태그 4개 강제 POST (curl)로 백엔드에 `400 "Max 3 tags per category"` 오는지
- [ ] 커스텀 모티브 31자 강제 POST 시 `400` 오는지

## 통과 기준
체크박스 전부 ✓ 되면 prod 배포 진행.
문제 있으면 이 문서에 "✗ {항목}: {증상}" 형태로 메모하고 해결.
