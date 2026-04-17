#!/usr/bin/env bash
# Prod DB 마이그레이션 전용 — 의도 확인 프롬프트 + 명확한 로그
set -euo pipefail

PROD_URL="postgresql://chatda:chatda@localhost:5434/chatda"

cat <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  PROD DB migration (database: chatda)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target:   $PROD_URL
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
DATABASE_URL="$PROD_URL" npx drizzle-kit migrate
echo "✓ Prod migration complete."
