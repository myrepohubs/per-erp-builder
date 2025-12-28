#!/bin/bash
cd ~/supabase-self-hosted/docker
BACKUP_DIR=./backups
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$BACKUP_DIR/supabase_backup_$TIMESTAMP.sql
docker compose exec db pg_dump -U postgres postgres > $BACKUP_FILE
echo "Backup created: $BACKUP_FILE"