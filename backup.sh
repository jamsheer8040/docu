#!/bin/bash
# doc-mgr Database Backup Script

# Set the directory where you want to save backups (creates it if it doesn't exist)
BACKUP_DIR="./db_backups"
mkdir -p "$BACKUP_DIR"

# Generate a timestamp for the filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/docclear_db_$TIMESTAMP.sql"

echo "Starting database backup..."

# Execute the mysqldump command inside the running database container
docker-compose exec -T db mysqldump -u root -ppassword docclear_db > "$BACKUP_FILE"

# Check if the backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup successfully created at: $BACKUP_FILE"
    
    # Optional: Delete backups older than 30 days to save disk space
    find "$BACKUP_DIR" -type f -name "*.sql" -mtime +30 -delete
    echo "Old backups cleaned up."
else
    echo "❌ Backup failed!"
fi
