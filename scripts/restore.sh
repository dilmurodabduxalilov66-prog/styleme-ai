#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/styleme"

if [ -z "$1" ]; then
  echo "Usage: $0 <DATE_STRING>"
  echo "Example: $0 2026-06-21_15-00-00"
  exit 1
fi

DATE=$1

echo "Starting automated restore for StyleMe AI: $DATE"

# 1. PostgreSQL Restore
if [ -f "$BACKUP_DIR/postgres_$DATE.dump" ]; then
  echo "Restoring PostgreSQL..."
  docker exec -i styleme-postgres pg_restore -U styleme_user -d styleme_db -c < "$BACKUP_DIR/postgres_$DATE.dump"
else
  echo "PostgreSQL backup not found!"
fi

# 2. MongoDB Restore
if [ -f "$BACKUP_DIR/mongo_$DATE.archive" ]; then
  echo "Restoring MongoDB..."
  docker exec -i styleme-mongodb mongorestore --archive --drop < "$BACKUP_DIR/mongo_$DATE.archive"
else
  echo "MongoDB backup not found!"
fi

# 3. Redis Restore (Requires stopping redis container temporarily)
if [ -f "$BACKUP_DIR/redis_$DATE.rdb" ]; then
  echo "Restoring Redis..."
  docker stop styleme-redis
  cp "$BACKUP_DIR/redis_$DATE.rdb" /var/lib/docker/volumes/maxsus_redisdata/_data/dump.rdb
  cp "$BACKUP_DIR/redis_$DATE.aof" /var/lib/docker/volumes/maxsus_redisdata/_data/appendonly.aof
  docker start styleme-redis
else
  echo "Redis backup not found!"
fi

echo "Restore completed!"
