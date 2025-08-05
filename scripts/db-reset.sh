#!/bin/bash

# Database Reset Script
# Drops and recreates the database with fresh schema

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

# Reset database
reset_database() {
    log "Resetting database..."
    
    # Drop database
    log "Dropping existing database..."
    docker exec $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD -e "DROP DATABASE IF EXISTS $DB_NAME;"
    
    # Create database
    log "Creating fresh database..."
    docker exec $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    success "Database reset completed"
}

# Apply schemas
apply_schemas() {
    log "Applying database schemas..."
    
    # Main schema
    if [ -f "../database/schema.sql" ]; then
        log "Applying main schema..."
        docker exec -i $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME < ../database/schema.sql
        success "Main schema applied"
    else
        error "Main schema file not found"
        exit 1
    fi
    
    # Drug schema
    if [ -f "../database/drug_schema.sql" ]; then
        log "Applying drug schema..."
        docker exec -i $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME < ../database/drug_schema.sql
        success "Drug schema applied"
    else
        warning "Drug schema file not found, skipping"
    fi
}

# Show tables
show_tables() {
    log "Database tables:"
    docker exec $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | tail -n +2
}

main() {
    echo -e "${YELLOW}"
    echo "WARNING: This will completely reset the database!"
    echo "All data will be lost permanently."
    echo -e "${NC}"
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Database reset cancelled"
        exit 0
    fi
    
    check_container
    reset_database
    apply_schemas
    show_tables
    
    success "Database reset completed successfully!"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi