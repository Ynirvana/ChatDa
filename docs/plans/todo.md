# ChatDa MVP — 실행 순서

> **2026-04-15 프로덕션 라이브 완료**. 이 문서는 초기 계획의 체크리스트 — 실제 구현 내역은 [`docs/deploy/2026-04-15-prod-deploy-session.md`](../deploy/2026-04-15-prod-deploy-session.md)를 참조.

## 결정사항 (2026-04-14 단순화)

- **카테고리 제거:** eats / nights 구분 없음. 모임은 "Meetups" 하나.
- **트랙 제거:** Student / Local / Traveler 선택 없음. 국적 + 소셜링크로 충분.
- **핵심 플로우:** 구글 로그인 → 프로필(이름·국적·소개·소셜링크) → 모임 목록 → 참가 신청 → 호스트 승인

---

## Round 1 — 기반 (Task 1~5)  ✅ 완료

- [x] Task 1: Project Scaffold (Next.js + PWA + Docker Compose)
- [x] Task 3: Design System (Button, Card, Nav, globals.css)
- [x] Task 2: Database Schema (users, socialLinks, events, rsvps)
- [x] Task 4: Google OAuth (NextAuth v5, trustHost: true)
- [x] Task 5: Onboarding — 이름·국적·소개·소셜링크

## Round 2 — 핵심 기능 (Task 6~8)  ✅ 완료

- [x] Task 6: Events List (`/meetups`) — Upcoming/Past 탭
- [x] Task 7: Event Detail + Attendee Profiles (비인증 viewer엔 attendees 빈 배열)
- [x] Task 8: RSVP — Host Approval Flow

## Round 3 — 마무리 (Task 9~12)  ✅ 완료

- [x] Task 9: My Profile Page
- [x] Task 10: Landing Page
- [x] Task 11: Host Panel (/host)
- [x] Task 12: Deploy — Docker Compose prod + Cloudflare Tunnel → https://chatda.life

---

## Round 3 이후 추가로 한 것

- ✅ Nav 아바타 드롭다운 (Profile / Admin / Log out)
- ✅ 온보딩 리다이렉트 (returning user → /meetups)
- ✅ Meetup 카드 hover + 참가자 아바타 미리보기
- ✅ 호스트를 attendee #1로 카운트
- ✅ OG 메타태그 (리치 링크 프리뷰) + 호스트 Copy-link
- ✅ Admin 모더레이션 UI (`/admin`, `ADMIN_EMAILS` 기반)
- ✅ 보안 헤더 (HSTS 등 5종) + body size 제한 + 입력 검증 (`Field(max_length)`, 이미지 ~4.5 MiB)
- ✅ DB 백업 스크립트 + 30일 retention
- ✅ Dev/Prod DB 분리 (`chatda_dev` 별도)

---

## 다음 라운드 (Backlog)

### 2026-04-16 이후 — v4 피벗 (People 탭 중심)

**Step 1 온보딩 — 2026-04-16/17 배포 완료:**
- [x] `users.location` 추가 + 광역 14개 LOCATIONS
- [x] 소셜 링크 필수 → 선택 (accordion, connect accepted 후 공개)
- [x] 온보딩 완료 후 `/people`로 리다이렉트
- [x] People 탭 Location 필터 + 카드/상세/프로필에 📍 표시
- [x] `db:migrate` dev/prod 스크립트 분리 + migrate-prod.sh confirmation prompt
- [x] USER_STATUSES 5개 재정의 (local/expat/visitor/visiting_soon/visited_before) + 기존 값 매핑
- [x] "What brings you here?" 10개 모티브 중 1~3개 필수
- [x] Nationality combobox (197개, 검색)
- [x] 안내 문구 "Your profile is how others find you in Korea"

**Step 2 프로필 확장 — 2026-04-17 배포 완료:**
- [x] 체류 기간 (status별 분기 — Local 숨김 / Expat=Since when / Visitor=arrived+departed / Visiting soon=강조 / Visited before=과거)
- [x] What I can offer / looking for — TagEditor 리팩터 (선택 위 + Add more 접이식)
- [x] 구사 언어 + 레벨 (Native/Fluent/Conversational/Learning)
- [x] 관심사 프리셋 20개 (최대 10)
- [x] 프로필 완성도 % 바 + 안내 문구
- [x] People 탭 필터 확장 (offer/language/motivation/social)
- [x] Threads 소셜 플랫폼 추가 (enum 0017)
- [x] People 카드 LinkedIn 스타일 리디자인 (커버+원형 아바타+mutual count+outline CTA)
- [x] 네이티브 select → 커스텀 FilterSelect 교체 (다크 팝업)
- [x] 랜딩 카피 v4 전부 반영
- [x] Admin self-protect (본인/타 admin 삭제 차단)

**다음 라운드:**
- [ ] 알림 시스템 (Nav 🔔 + unread 뱃지 + dropdown). Connect request/accept/reject, RSVP new/approved/rejected, comment reply 등.
- [ ] 이미지 S3/Cloudinary 이전 (현재 base64 in DB)
- [ ] 이벤트 취소/신청 취소, 반복 일정
- [ ] Gigs 탭 (v4 2단계)

### 운영 하드닝

[`docs/deploy/security-followup.md`](../deploy/security-followup.md) 참조. 핵심:
- DB 백업 cron 등록 (5분), UptimeRobot (10분), CF Bot Fight Mode (1분) — **지금 바로 가능**
- Sentry, OAuth dev/prod 분리, slowapi rate limiting, NEXTAUTH_SECRET 회전 — 사용자 유입 단계에 맞춰
