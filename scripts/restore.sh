#!/bin/sh
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore.sh <backup_file.sql.gz>"
  echo "Available backups:"
  ls -lh /backups/hotel_booking_*.sql.gz 2>/dev/null || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restoring from: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database. Press Ctrl+C to cancel."
sleep 5

gunzip -c "$BACKUP_FILE" | docker exec -i hotel-booking-postgres psql -U postgres hotel_booking_pro

echo "[$(date)] Restore complete."
