# Approval Flow — Implementation Plan

**작성일**: 2026-04-20
**목표**: 초대 전용 게이트 → 승인제 가입으로 전환. 초대 링크는 유지(즉시 승인 경로). 초기 500명까지 퀄리티 필터로 활용.

---

## 배경 / 동기

- **기존**: Google 로그인 → invite cookie 없으면 즉시 reject → `/join`에서 Threads DM 유도. 가입 병목이 너무 크고, DM 운영 부담.
- **전환 후**: 누구나 가입 가능하되 온보딩 완료 후 admin 승인 대기. 초대 링크는 유지(신뢰하는 사람 즉시 통과용).
- 승인 사유/이력 보존 → 재신청 유저 판단 근거로 활용.

---

## 결정사항 (Final)

| # | 결정 |
|---|------|
| 1 | 플로우 A: Google 로그인 (무조건 허용) → Step 1 온보딩 강제 → 승인 대기 화면 |
| 2 | 이메일 알림 (Resend). approved / rejected 둘 다 발송 |
| 3 | 거절 시 사유 유저에게 노출, 재신청 가능 |
| 4 | 거절 데이터 보존 (`approval_history` 테이블) |
| 5 | Pending 유저의 `/people` peek: 첫 3장 사진만 (이름 블러), 4번째부턴 블러만 (카운트 표시 X), 클릭 → "we'll email you" 화면 |
| 6 | Pending 중 프로필 수정 **금지**. 안내 카피: "Approval rate goes up when profile is filled out thoughtfully." |
| 7 | 재신청 쿨다운 없음 |
| 8 | `/join` → "Apply Now → Google 로그인" CTA 페이지로 전환 |
| 9 | Pending 유저가 나중에 invite 링크 받으면 자동 승인 |
| 10 | Invite로 들어온 유저는 승인 플로우 스킵 (즉시 approved) |
| 11 | Admin 이메일(ADMIN_EMAILS)은 자동 approved |

---

## DB 스키마 변경

### `users` 테이블 — 컬럼 추가

```sql
ALTER TABLE users ADD COLUMN approval_status text;
UPDATE users SET approval_status = 'approved';  -- 기존 유저 전부 승인 처리 (invite-only로 들어온 trusted)
ALTER TABLE users ALTER COLUMN approval_status SET NOT NULL;
ALTER TABLE users ALTER COLUMN approval_status SET DEFAULT 'pending';

ALTER TABLE users ADD COLUMN approved_at timestamp;
ALTER TABLE users ADD COLUMN approved_by text;        -- admin 이메일
ALTER TABLE users ADD COLUMN rejection_reason text;
ALTER TABLE users ADD COLUMN rejected_at timestamp;
```

**값 유효 범위**: `'pending' | 'approved' | 'rejected'`

### `approval_history` 테이블 — 신규

```sql
CREATE TABLE approval_history (
  id serial PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,       -- 'submitted' | 'approved' | 'rejected' | 'resubmitted'
  reason text,                -- 거절 사유 (action='rejected'일 때만)
  actor_email text,           -- admin 이메일. self 제출 시 user 이메일
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX approval_history_user_id_idx ON approval_history(user_id);
```

---

## Auth 플로우

### 변경된 signIn 로직 (`lib/auth.ts`)

```
Google OAuth 성공
  ├─ banned_emails에 있음 → return false (차단)
  ├─ 기존 user → return true (그대로 로그인)
  └─ 신규 user
      ├─ admin email → insert user (approval_status='approved') + history
      ├─ invite cookie 있음 → insert user (approval_status='approved') + claim invite + history
      └─ 둘 다 없음 → insert user (approval_status='pending') + history('submitted')
                     → 온보딩으로 리다이렉트
```

### JWT/Session callback

- `jwt` — 첫 로그인 시 `approval_status`를 토큰에 저장
- `session` — 매 요청마다 DB에서 최신 `approval_status` 읽어 세션에 주입 (승인 즉시 반영 위해)

### Gate 로직 (`proxy.ts`)

| 경로 | 조건 |
|------|------|
| `/onboarding` | authed && `approval_status='pending'` && `!onboarding_complete` → 통과. 아니면 status에 맞게 리다이렉트 |
| `/pending-approval` | authed && `approval_status='pending'` && `onboarding_complete` → 통과 |
| `/rejected` | authed && `approval_status='rejected'` → 통과 |
| `/people` | approved → 풀 / pending → peek 모드(3장) / unauth → 기존 peek |
| `/people/[id]` | approved만. pending/unauth → 403 또는 pending-approval로 |
| `/profile`, `/host` | approved만 |
| 기타 보호 경로 | approved만 |

### 세션 JWT 호환성 (기존 유저)

- 배포 직후 기존 100여 명의 JWT엔 `approval_status` 필드 없음 → `undefined` 로 읽힘
- **처리**: 코드에서 `approval_status === undefined` 면 `approved`로 간주 (backfill된 DB값과 일치하는 fallback)
- JWT 갱신 주기(30일) 내 자연스럽게 fresh 토큰으로 교체됨

---

## 파일별 변경

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `db/schema.ts` | `users`에 approval 컬럼 추가, `approvalHistory` export |
| `lib/auth.ts` | signIn callback — 신규 유저 pending 기본값. jwt/session에 approval_status 반영 |
| `lib/invites.ts` | `claimInvite()` — claim 시 user의 approval_status='approved' 로 upgrade (기존 pending 유저도 대응 #9) |
| `proxy.ts` | approval_status 기반 gate 룰 추가 |
| `app/join/page.tsx` | "Apply Now → Google 로그인" 스타일로 리디자인 |
| `app/onboarding/page.tsx` | 완료 후 pending 유저 → `/pending-approval`로 redirect |
| `app/people/page.tsx` | Pending 유저용 peek 모드 렌더링 (첫 3장 + 블러) |
| `components/PersonCard.tsx` | `locked` prop — 이름 블러 + 클릭 막기 |
| `app/admin/AdminClient.tsx` | "Approvals" 탭 + pending 유저 리스트 + approve/reject UI |
| `app/api/onboarding/complete/route.ts` | 완료 시 `approval_history('submitted')` 추가 |
| `components/ui/Nav.tsx` | pending/rejected 유저는 제한된 nav |

### 신규 생성

| 파일 | 역할 |
|------|------|
| `app/pending-approval/page.tsx` | 승인 대기 화면. "We'll email you once approved" + 문의는 Threads 꼬리표 |
| `app/rejected/page.tsx` | 거절 사유 표시 + "Re-apply" 버튼 |
| `app/api/admin/approvals/route.ts` | GET — pending 유저 리스트 (프로필 풀 정보 포함) |
| `app/api/admin/approvals/[id]/route.ts` | POST approve / POST reject (reason 받음) |
| `app/api/reapply/route.ts` | POST — 본인 status를 rejected → pending 으로 돌리고 history에 'resubmitted' 추가 |
| `lib/email.ts` | Resend 클라이언트 래퍼 + sendApproved/sendRejected/sendSubmitted 헬퍼 |
| `emails/approved.tsx` | React Email 템플릿 |
| `emails/rejected.tsx` | React Email 템플릿 (reason 포함) |
| `emails/submitted.tsx` | React Email 템플릿 (접수 확인, 선택) |
| `drizzle/0026_*.sql` | 스키마 마이그레이션 |

### Backend (FastAPI)

| 파일 | 변경 |
|------|------|
| `backend/routers/admin.py` | approvals list/approve/reject 엔드포인트 (Next.js API route로만 갈지 FastAPI 거칠지는 기존 패턴 따름) |
| `backend/routers/users.py` | pending 유저 대상 /users/me PATCH 차단 (결정 #6) |

---

## Phased Implementation

### Phase 1 — Core approval system (이메일 제외) · 목표 1~2일

- [ ] 1.1 `db/schema.ts` 에 approval 컬럼 + `approvalHistory` 추가
- [ ] 1.2 `npm run db:generate` → drizzle/0026 생성 + SQL 검토
- [ ] 1.3 `npm run db:migrate` (dev) 적용
- [ ] 1.4 `lib/auth.ts` signIn 개편 — non-invite도 허용, pending 기본값
- [ ] 1.5 JWT/session에 approval_status 싣기
- [ ] 1.6 `proxy.ts` gate 로직
- [ ] 1.7 `/pending-approval` 페이지 (정적 텍스트 + 로그아웃 링크)
- [ ] 1.8 `/rejected` 페이지 (사유 표시 + re-apply 버튼)
- [ ] 1.9 `app/onboarding/complete` — pending 유저 완료 시 history insert + redirect
- [ ] 1.10 `app/api/admin/approvals` GET/POST 엔드포인트
- [ ] 1.11 Admin UI "Approvals" 탭
- [ ] 1.12 `/people` peek 모드 — pending 유저 첫 3장 블러 카드
- [ ] 1.13 `PersonCard` locked 변종 + 클릭 방지 + "email 통지 약속" 토스트/모달
- [ ] 1.14 `/join` "Apply Now" CTA 전환
- [ ] 1.15 `/api/reapply` — rejected → pending 복귀
- [ ] 1.16 `claimInvite()` — 기존 pending 유저 invite claim 시 approved 로 승격 (#9)
- [ ] 1.17 Pending 유저 `/api/users/me` PATCH 차단 (#6)
- [ ] 1.18 수동 테스트 (아래 시나리오 섹션)

### Phase 2 — Email notifications · 목표 0.5~1일

- [ ] 2.1 Resend 계정 생성 + 도메인 (`chatda.life`) 검증
- [ ] 2.2 Cloudflare DNS에 SPF/DKIM 레코드 추가
- [ ] 2.3 `.env.local` + `.env.production.local`에 `RESEND_API_KEY` 추가
- [ ] 2.4 `lib/email.ts` — 헬퍼 함수 작성
- [ ] 2.5 React Email 패키지 설치 + 템플릿 3종 작성 (approved/rejected/submitted)
- [ ] 2.6 트리거 연결: 온보딩 완료 시 submitted, admin approve 시 approved, admin reject 시 rejected
- [ ] 2.7 Resend dev 모드로 본인 계정에 테스트 발송

### Phase 3 — Polish · 목표 0.5일

- [ ] 3.1 Admin UI에 재신청 유저 표시 ("Re-applied · Previous reason: X")
- [ ] 3.2 Admin 대시보드 카운트: pending / approved / rejected 수치
- [ ] 3.3 Admin "Rejected" 탭 (과거 결정 번복 가능)
- [ ] 3.4 `docs/status/` 업데이트 (승인 플로우 반영)

---

## 수동 테스트 시나리오

Phase 1 끝나면 dev에서 다음 다 돌려봄:

1. **초대 없이 신규 가입** → `/onboarding` 진입 → 완료 → `/pending-approval` 표시 확인
2. **Pending 상태로 `/people` 접근** → 3장 블러 카드만 보임, 클릭 시 email 약속 화면
3. **Pending 상태로 `/profile` 직접 URL 접근** → `/pending-approval`로 리다이렉트
4. **Pending 상태로 `/api/users/me` PATCH** → 403 또는 에러
5. **Admin이 `/admin/approvals`에서 approve** → 유저 status='approved', approved_at/by 세팅, history insert
6. **Approved 유저 재방문** → `/people` 풀 모드 접근
7. **Admin이 reject (reason 입력)** → history insert, /rejected 표시
8. **Rejected 유저 re-apply 클릭** → status='pending' 복귀, history에 resubmitted 기록
9. **Admin이 pending 유저 목록에서 재신청자 봄** → 이전 거절 사유 context 표시
10. **초대 링크 claim** → 바로 approved, 승인 플로우 스킵
11. **Admin 이메일로 로그인** → 자동 approved
12. **기존 seed 유저** (backfill로 approved) → 기능 그대로 동작

---

## Deployment to prod

### 순서 (#5 runbook 기준)

1. Phase 1 코드 완성 + dev 검증 끝
2. `scripts/backup-db.sh` (prod 백업)
3. `npm run db:migrate:prod` — 0018~0026까지 다 적용됨 (현재 prod는 0017)
4. 컨테이너 rebuild: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
5. Admin 계정으로 로그인 → 기능 smoke test
6. Resend 도메인 검증 완료 후 Phase 2 배포
7. `docs/deploy/runbook.md`에 승인 플로우 운영 절차 추가

### Env 변수 추가 필요

- `RESEND_API_KEY` — Resend 대시보드 발급
- `ADMIN_NOTIFICATION_EMAIL` (선택) — 새 pending 디지스트용. Phase 3 이상

---

## Open Risks / Watch-outs

1. **Spam/bot 가입**: invite gate 제거 후 누구나 Google 계정만 있으면 신청 가능. 수동 리뷰가 사실상 필터. 500명 넘으면 Cloudflare Turnstile 등 고려.
2. **Resend 도메인 검증 지연**: DNS 전파 최대 몇 시간. Phase 2 timing에 버퍼.
3. **JWT 기존 필드 누락**: 기존 유저 JWT엔 approval_status 없음. 코드에서 `undefined → approved` fallback 필수 (미처리 시 기존 유저 전부 거절 처리됨 → 큰 사고).
4. **Prod 마이그레이션 드리프트**: Prod는 0017, 개발 현재 0025, 이 작업으로 0026. 한 번에 9개 마이그레이션 올리는 셈. 백업 필수.
5. **이메일 전달 실패**: 주소 typo, SPAM 폴더 행 등. `/pending-approval` 화면에 "이메일 안 왔나요? 스팸함 확인하거나 접근 재시도" 안내.
6. **Rejected 유저 데이터 프라이버시**: 향후 GDPR-ish 요청 대응 필요. Phase 2 이후로 미룸.
7. **기존 `/api/admin/invites` 패턴 유지**: invite 시스템은 살아있으니 Admin UI에 두 탭 병존 (Invites / Approvals).

---

## Definition of Done

- [ ] 수동 테스트 12가지 전부 통과
- [ ] Dev DB 마이그레이션 적용 + 기존 seed 유저 전부 approved로 backfill 확인
- [ ] Email 3종 실제 발송 성공 (본인 계정 테스트)
- [ ] Admin UI로 approve/reject 원샷 가능 (reason 입력 필수)
- [ ] Prod 배포 후 admin 계정으로 전체 플로우 검증
- [ ] `docs/status/2026-04-20-status.md` 업데이트 (현재 상태 반영)
