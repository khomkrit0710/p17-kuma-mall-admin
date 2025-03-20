#!/bin/bash

# Database credentials
BACKUP_DIR="../backups"      # Directory for storing backups

echo "Move to root directory of repository"
cd ..  # Move to the project root

#Load file from .env
echo "load file from .env"
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep -E '^[A-Za-z_]+=' | xargs)
    echo "Loaded environment variables from .env"

    echo "go to scripts Directory"
    cd "$(dirname "$0")"
    cd "./scripts"

    CURRENT_DIR=$(pwd)
    echo "Current Directory : $CURRENT_DIR"
else
    echo "Warning: .env file not found!"
    exit 1
fi

#delay for 1 second
sleep 1

#Echo properties of .env except password
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_CONTAINER"

sleep 1

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Timestamp for the backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "🔄 Backing up database to $BACKUP_FILE..."
docker exec -e PGPASSWORD=$DB_PASSWORD $DB_CONTAINER \
    pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Backup failed!"
    exit 1
fi

echo "✅ Backup completed."

sleep 2

read -p "Do you want to continue? This process can't be undone (y/n): " answer
if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    echo "Begin to continue process"
else
    echo "You abort the reset database process but there is new backups"
    exit 1
fi

# Terminate active connections
echo "Terminate active connections"
docker exec -e PGPASSWORD=$DB_PASSWORD $DB_CONTAINER \
    psql -U $DB_USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME';"

# Drop the existing database
echo "⚠️ Dropping database $DB_NAME..."
docker exec -e PGPASSWORD=$DB_PASSWORD $DB_CONTAINER \
    psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

sleep 2

# Recreate the database
echo "🆕 Creating a new database $DB_NAME..."
docker exec -e PGPASSWORD=$DB_PASSWORD $DB_CONTAINER \
    psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

echo "✅ Database reset completed."

sleep 2

# Move to the root directory of the repo
echo "Go to the root of directory"
cd ..

CURRENT_DIR=$(pwd)
echo "Current Directory : $CURRENT_DIR"

# Check if the 'prisma' directory exists
echo "checking if there's prisma folder in this repo"
if [ -d "prisma" ]; then
    echo "Prisma directory found. Running migrations..."
    
    # Run Prisma migrations
    npx prisma migrate deploy
else
    echo "Error: 'prisma' directory not found! Are you in the correct project root?"
    exit 1
fi

# Run migrations
echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Database is ready."