#!/usr/bin/env bash
# ChatDa prod DB (chatda) 야간 자동 백업.
#
# 사용:
#   crontab -e 에 다음 한 줄 추가 (매일 04:00 KST):
#     0 4 * * * /home/dykim/project/ChatDa/scripts/backup-db.sh
#
# 복원:
#   gunzip -c ~/chatda-backups/chatda-2026-04-15.sql.gz | \
#     docker exec -i chatda-db-1 psql -U chatda chatda

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/home/dykim/chatda-backups}"
DB_CONTAINER="${DB_CONTAINER:-chatda-db-1}"
DB_NAME="${DB_NAME:-chatda}"
DB_USER="${DB_USER:-chatda}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%F-%H%M)"
OUT="$BACKUP_DIR/${DB_NAME}-${STAMP}.sql.gz"

# pg_dump → gzip → 파일
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" \
  | gzip -9 \
  > "$OUT"

# 백업 검증 (gzip 무결성)
gzip -t "$OUT"

# 용량 로그
SIZE="$(du -h "$OUT" | cut -f1)"
echo "[$(date -Iseconds)] backup ok: $OUT ($SIZE)" >> "$BACKUP_DIR/backup.log"

# 오래된 백업 정리
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

# 알림 (선택 — 주석 해제해서 사용)
# curl -fsS -X POST "$SLACK_WEBHOOK_URL" \
#   -H 'Content-Type: application/json' \
#   -d "{\"text\":\"ChatDa DB backup ok: $OUT ($SIZE)\"}"
