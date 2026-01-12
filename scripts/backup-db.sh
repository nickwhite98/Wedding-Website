#!/bin/bash

# Database Backup Script
# Creates backups of the SQLite database and uploads to S3 (optional)
# Usage: bash backup-db.sh

set -e

BACKUP_DIR="/var/backups/wedding"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="wedding-db-$DATE.db"

echo "Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Copy database from Docker volume
docker cp wedding-backend:/app/data/prod.db $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

echo "Backup created: $BACKUP_DIR/$BACKUP_FILE.gz"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "wedding-db-*.db.gz" -mtime +30 -delete

echo "Old backups cleaned up"

# Optional: Upload to S3 (uncomment and configure if needed)
# if [ -n "$S3_BUCKET" ]; then
#     aws s3 cp $BACKUP_DIR/$BACKUP_FILE.gz s3://$S3_BUCKET/backups/
#     echo "Backup uploaded to S3"
# fi

echo "✅ Backup complete!"
