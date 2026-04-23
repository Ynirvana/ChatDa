# docs/tasks/

진행 중 / 예정 작업 계획 문서 모음. 완료된 백로그 체크리스트는 [`docs/plans/todo.md`](../plans/todo.md), 배포 후 세션 기록은 [`docs/deploy/`](../deploy/) 참조.

## 현재 계획

### 2026-04-18 (최신)
- **[세션 리포트 — PR-B 완료 + 온보딩 재구성 + 신규 필드](./2026-04-18/session-report.md)** ← 여기서 시작
- 핵심 상태: 오늘 작업 **전부 uncommitted + dev only**. Prod는 4/17 light theme까지만.

### 2026-04-17 (과거)
- [v4 후속 계획 — PR-A ✓ / PR-B ✓ / PR-C pending](./2026-04-17/v4-followup.md)
- [Light Theme Migration — Phase 1-2 ✓, Phase 3 일부 소진](./2026-04-17/light-theme-migration.md)
- [세션 리포트 (outdated, 4/17 저녁 시점)](./2026-04-17/session-report.md) — 2026-04-18 리포트로 대체됨
- [PR-B QA 체크리스트](./2026-04-17/pr-b-qa-checklist.md) — 이후 UI 변경으로 일부 outdated

## 규칙
- **디렉토리**: `YYYY-MM-DD/` 날짜별 디렉토리 하나
- **파일명**: 디렉토리 안에서는 짧은 제목만 (`v4-followup.md` 식)
- 각 계획은 **스코프 / 파일 변경 / DB 영향 / 리스크 / 추정 / 열린 질문**을 포함
- 세션 리포트는 **하루 단위로 누적**. 이전 리포트는 삭제하지 않고 "과거" 섹션에 링크만 유지
- 작업이 완료되면 계획 문서는 이 인덱스에서 빼고 `docs/plans/todo.md`의 "완료" 섹션 또는 `docs/deploy/` 세션 기록으로 이동
