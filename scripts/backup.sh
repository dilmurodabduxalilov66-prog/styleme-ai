#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/styleme"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
RETENTION_DAYS=30

# Database credentials (should ideally be read from .env in prod, hardcoded here for blueprint match)
PG_USER="styleme_user"
PG_DB="styleme_db"
MONGO_USER="admin"
MONGO_PASS="MongoS3cure!"

echo "Starting automated backup for StyleMe AI: $DATE"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# 1. PostgreSQL Backup
echo "Backing up PostgreSQL..."
docker exec styleme-postgres pg_dump -U $PG_USER -F c $PG_DB > "$BACKUP_DIR/postgres_$DATE.dump"

# 2. MongoDB Backup
echo "Backing up MongoDB..."
docker exec styleme-mongodb mongodump --archive > "$BACKUP_DIR/mongo_$DATE.archive"

# 3. Redis Backup
echo "Backing up Redis (AOF & RDB)..."
docker exec styleme-redis redis-cli BGREWRITEAOF
sleep 2 # Wait for rewrite
docker exec styleme-redis redis-cli BGSAVE
sleep 2 # Wait for save
docker cp styleme-redis:/data/appendonly.aof "$BACKUP_DIR/redis_$DATE.aof"
docker cp styleme-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"
echo "Backing up Redis..."
# Force Redis to save current dataset to disk
docker exec styleme-redis redis-cli SAVE
# Copy the dump file from the container
docker cp styleme-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# 4. Enforce 30-day Retention Policy
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type f -name "*.archive" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type f -name "*.rdb" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully!"
