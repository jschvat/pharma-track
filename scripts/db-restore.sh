#!/bin/bash

# Database Restore Script
# Restores database from backup file

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

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker container is running
check_container() {
    if ! docker ps --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        error "MySQL container '$CONTAINER_NAME' is not running"
        echo "Start it with: docker start $CONTAINER_NAME"
        exit 1
    fi
}

# List available backups
list_backups() {
    log "Available backups:"
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        local i=1
        for backup in "$BACKUP_DIR"/*.sql.gz; do
            if [ -f "$backup" ]; then
                local basename=$(basename "$backup")
                local size=$(du -h "$backup" | cut -f1)
                local date=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
                echo "$i) $basename ($size) - $date"
                ((i++))
            fi
        done
        return 0
    else
        echo "No backups found in $BACKUP_DIR"
        return 1
    fi
}

# Select backup file
select_backup() {
    list_backups || exit 1
    
    echo ""
    read -p "Enter backup number to restore (or 'q' to quit): " choice
    
    if [ "$choice" = "q" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    if ! [[ "$choice" =~ ^[0-9]+$ ]]; then
        error "Invalid selection"
        exit 1
    fi
    
    local backup_files=("$BACKUP_DIR"/*.sql.gz)
    local selected_backup="${backup_files[$((choice-1))]}"
    
    if [ ! -f "$selected_backup" ]; then
        error "Invalid backup selection"
        exit 1
    fi
    
    echo "$selected_backup"
}

# Restore database
restore_database() {
    local backup_file="$1"
    
    echo -e "${YELLOW}"
    echo "WARNING: This will replace all current database data!"
    echo "Backup file: $(basename "$backup_file")"
    echo -e "${NC}"
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
    
    log "Restoring database from backup..."
    
    # Decompress and restore
    if [[ "$backup_file" == *.gz ]]; then
        log "Decompressing and restoring backup..."
        gunzip -c "$backup_file" | docker exec -i $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD
    else
        log "Restoring uncompressed backup..."
        docker exec -i $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD < "$backup_file"
    fi
    
    success "Database restored successfully"
}

# Verify restore
verify_restore() {
    log "Verifying restore..."
    
    local table_count=$(docker exec $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD -e "USE $DB_NAME; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" 2>/dev/null | tail -n 1)
    
    log "Database tables count: $table_count"
    
    if [ "$table_count" -gt 0 ]; then
        success "Restore verification passed"
        
        log "Available tables:"
        docker exec $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | tail -n +2
    else
        warning "No tables found in database"
    fi
}

main() {
    echo -e "${BLUE}"
    echo "======================================"
    echo "      Database Restore Script"
    echo "======================================"
    echo -e "${NC}"
    
    check_container
    
    local backup_file
    if [ $# -eq 1 ]; then
        backup_file="$1"
        if [ ! -f "$backup_file" ]; then
            error "Backup file not found: $backup_file"
            exit 1
        fi
    else
        backup_file=$(select_backup)
    fi
    
    restore_database "$backup_file"
    verify_restore
    
    success "Restore process completed!"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi