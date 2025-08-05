#!/bin/bash

# Database Backup Script
# Creates a backup of the MySQL database

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CONTAINER_NAME="pharmatrak-mysql"
DB_NAME="pharmatrak"
DB_ROOT_PASSWORD="root_password"
BACKUP_DIR="../backups"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Check if Docker container is running
check_container() {
    if ! docker ps --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        error "MySQL container '$CONTAINER_NAME' is not running"
        echo "Start it with: docker start $CONTAINER_NAME"
        exit 1
    fi
}

# Create backup
create_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/pharmatrak_backup_$timestamp.sql"
    
    log "Creating database backup..."
    log "Backup file: $backup_file"
    
    docker exec $CONTAINER_NAME mysqldump \
        -u root \
        -p$DB_ROOT_PASSWORD \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-database \
        --databases $DB_NAME > "$backup_file"
    
    # Compress backup
    log "Compressing backup..."
    gzip "$backup_file"
    backup_file="$backup_file.gz"
    
    # Get file size
    local file_size=$(du -h "$backup_file" | cut -f1)
    
    success "Backup created successfully"
    echo "File: $backup_file"
    echo "Size: $file_size"
}

# List existing backups
list_backups() {
    log "Existing backups:"
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR)" ]; then
        ls -lah "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
    else
        echo "No backups found"
    fi
}

# Clean old backups (keep last 10)
clean_old_backups() {
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(ls "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
        if [ "$backup_count" -gt 10 ]; then
            log "Cleaning old backups (keeping last 10)..."
            ls -t "$BACKUP_DIR"/*.sql.gz | tail -n +11 | xargs rm -f
            success "Old backups cleaned"
        fi
    fi
}

main() {
    echo -e "${BLUE}"
    echo "======================================"
    echo "      Database Backup Script"
    echo "======================================"
    echo -e "${NC}"
    
    check_container
    create_backup_dir
    create_backup
    clean_old_backups
    echo ""
    list_backups
    
    success "Backup process completed!"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi