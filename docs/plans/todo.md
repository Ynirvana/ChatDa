# ChatDa MVP — 실행 순서

## 결정사항 (2026-04-14 단순화)

- **카테고리 제거:** eats / nights 구분 없음. 모임은 "Meetups" 하나.
- **트랙 제거:** Student / Local / Traveler 선택 없음. 국적 + 소셜링크로 충분.
- **핵심 플로우:** 구글 로그인 → 프로필(이름·국적·소개·소셜링크) → 모임 목록 → 참가 신청 → 호스트 승인

---

## Round 1 — 기반 (Task 1~5)

- [x] Task 1: Project Scaffold (Next.js + PWA + Docker Compose)
- [x] Task 3: Design System (Button, Card, Nav, globals.css)
- [ ] Task 2: Database Schema (users, socialLinks, events, rsvps — format/track 제거)
- [ ] Task 4: Google OAuth (NextAuth v5)
- [ ] Task 5: Onboarding — 이름·국적·소개·소셜링크 (track 없음)

**완료 기준:** 로그인 + 프로필 생성 가능

---

## Round 2 — 핵심 기능 (Task 6~8)

- [ ] Task 6: Events List (`/meetups`)
- [ ] Task 7: Event Detail + Attendee Profiles
- [ ] Task 8: RSVP — Host Approval Flow

**완료 기준:** 이벤트 보고 참가 신청까지 — 첫 테스트 가능한 MVP

---

## Round 3 — 마무리 (Task 9~12)

- [ ] Task 9: My Profile Page
- [ ] Task 10: Landing Page (풀 버전)
- [ ] Task 11: Host Panel
- [ ] Task 12: Deploy

**완료 기준:** 배포
