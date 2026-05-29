#!/bin/sh
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hotel_booking_${TIMESTAMP}.sql.gz"
KEEP_DAYS=${KEEP_DAYS:-7}

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."
docker exec hotel-booking-postgres pg_dump -U postgres hotel_booking_pro | gzip > "$BACKUP_FILE"
echo "[$(date)] Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

echo "[$(date)] Cleaning backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -name "hotel_booking_*.sql.gz" -mtime +${KEEP_DAYS} -delete

echo "[$(date)] Backup complete."
