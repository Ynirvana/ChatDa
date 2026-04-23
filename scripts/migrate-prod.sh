#!/usr/bin/env bash
# Prod DB 마이그레이션 전용 — 의도 확인 프롬프트 + 명확한 로그
set -euo pipefail

if [[ ! -f .env.production.local ]]; then
  echo "✗ .env.production.local not found. Cannot load DATABASE_URL." >&2
  exit 1
fi

# .env.production.local에서 DATABASE_URL 로드 (시크릿은 stdout 출력 안 함)
set -a
# shellcheck disable=SC1091
. .env.production.local
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "✗ DATABASE_URL not set in .env.production.local" >&2
  exit 1
fi

# 비밀번호 마스킹한 표시용 URL (사용자 확인용)
SAFE_URL=$(echo "$DATABASE_URL" | sed -E 's#://([^:]+):[^@]+@#://\1:***@#')

cat <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  PROD DB migration (database: chatda)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target:   $SAFE_URL
Host:     $(hostname)
When:     $(date --iso-8601=seconds)

This will apply all pending drizzle migrations to the
PRODUCTION database. Check that:
  1. You have a recent backup (scripts/backup-db.sh)
  2. You already tested the migration on chatda_dev
  3. No destructive column changes without a plan

EOF

read -r -p "Type 'APPLY' to continue (anything else aborts): " CONFIRM
if [[ "$CONFIRM" != "APPLY" ]]; then
  echo "✗ Aborted. No changes made."
  exit 1
fi

echo ""
echo "→ Running drizzle migrate against PROD…"
npx drizzle-kit migrate
echo "✓ Prod migration complete."
