#!/bin/bash

# PharmaTrack Backend Setup Script
# This script sets up the complete development environment including:
# - Node.js dependencies
# - MySQL database in Docker
# - Database schema and migrations
# - Environment configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="pharmatrak"
DB_USER="pharmatrak_user"
DB_PASSWORD="pharmatrak_password"
DB_ROOT_PASSWORD="root_password"
DB_PORT="3306"
CONTAINER_NAME="pharmatrak-mysql"

# Logging function
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command_exists node; then
        error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
    
    if ! command_exists npm; then
        error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    if ! command_exists docker; then
        error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running. Please start Docker and try again."
        exit 1
    fi
    
    success "All prerequisites are met"
}

# Install Node.js dependencies
install_dependencies() {
    log "Installing Node.js dependencies..."
    
    if [ ! -f "package.json" ]; then
        error "package.json not found. Make sure you're in the project root directory."
        exit 1
    fi
    
    npm install
    success "Node.js dependencies installed"
}

# Setup environment file
setup_environment() {
    log "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            
            # Update .env with our database configuration
            sed -i "s/DB_HOST=localhost/DB_HOST=localhost/" .env
            sed -i "s/DB_USER=root/DB_USER=$DB_USER/" .env
            sed -i "s/DB_PASSWORD=/DB_PASSWORD=$DB_PASSWORD/" .env
            sed -i "s/DB_NAME=pharmatrak/DB_NAME=$DB_NAME/" .env
            sed -i "s/PORT=3000/PORT=3000/" .env
            
            # Generate a random JWT secret
            JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your_jwt_secret_key_$(date +%s)")
            sed -i "s/JWT_SECRET=your_jwt_secret_key_here/JWT_SECRET=$JWT_SECRET/" .env
            
            success "Environment file created and configured"
        else
            error ".env.example file not found"
            exit 1
        fi
    else
        warning ".env file already exists, skipping environment setup"
    fi
}

# Setup MySQL Docker container
setup_mysql_docker() {
    log "Setting up MySQL Docker container..."
    
    # Check if container already exists
    if docker ps -a --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        warning "Container '$CONTAINER_NAME' already exists"
        
        # Check if it's running
        if docker ps --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
            log "Container is already running"
        else
            log "Starting existing container..."
            docker start $CONTAINER_NAME
        fi
    else
        log "Creating new MySQL container..."
        docker run -d \
            --name $CONTAINER_NAME \
            -e MYSQL_ROOT_PASSWORD=$DB_ROOT_PASSWORD \
            -e MYSQL_DATABASE=$DB_NAME \
            -e MYSQL_USER=$DB_USER \
            -e MYSQL_PASSWORD=$DB_PASSWORD \
            -p $DB_PORT:3306 \
            --restart unless-stopped \
            mysql:8.0 \
            --default-authentication-plugin=mysql_native_password \
            --character-set-server=utf8mb4 \
            --collation-server=utf8mb4_unicode_ci
    fi
    
    # Wait for MySQL to be ready
    log "Waiting for MySQL to be ready..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $CONTAINER_NAME mysqladmin ping -h"127.0.0.1" -u root -p$DB_ROOT_PASSWORD --silent >/dev/null 2>&1; then
            success "MySQL is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "MySQL failed to start after $max_attempts attempts"
            exit 1
        fi
        
        log "Attempt $attempt/$max_attempts - waiting for MySQL..."
        sleep 5
        ((attempt++))
    done
}

# Run complete database setup
setup_database() {
    log "Setting up complete database with all migrations..."
    
    # Use the comprehensive database setup script
    if [ -f "scripts/setup_complete_database.js" ]; then
        log "Running complete database setup script..."
        
        # Set environment variables for the script
        export DB_HOST=localhost
        export DB_USER=$DB_USER  
        export DB_PASSWORD=$DB_PASSWORD
        export DB_NAME=$DB_NAME
        
        # Wait a bit more for database to be fully ready
        sleep 3
        
        node scripts/setup_complete_database.js
        success "Complete database setup completed"
    else
        # Fallback to manual setup
        warning "Complete setup script not found, using fallback method"
        
        # Execute main schema
        if [ -f "database/schema.sql" ]; then
            log "Creating main database schema..."
            docker exec -i $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME < database/schema.sql
            success "Main schema created"
        else
            error "database/schema.sql not found"
            exit 1
        fi
        
        # Execute drug schema if it exists
        if [ -f "database/drug_schema.sql" ]; then
            log "Creating drug/inventory schema..."
            docker exec -i $CONTAINER_NAME mysql -u root -p$DB_ROOT_PASSWORD $DB_NAME < database/drug_schema.sql
            success "Drug schema created"
        else
            warning "database/drug_schema.sql not found, skipping drug schema"
        fi
    fi
}

# Setup frontend
setup_frontend() {
    log "Setting up React frontend..."
    
    if [ -d "frontend" ]; then
        cd frontend
        
        if [ -f "package.json" ]; then
            log "Installing frontend dependencies..."
            npm install
            success "Frontend dependencies installed"
        else
            error "Frontend package.json not found"
            cd ..
            return 1
        fi
        
        cd ..
        success "Frontend setup completed"
    else
        warning "Frontend directory not found, skipping frontend setup"
    fi
}

# Create default admin user
create_admin_user() {
    log "Creating default admin user..."
    
    if [ -f "scripts/createAdmin.js" ]; then
        log "Running admin user creation script..."
        
        # Set environment variables for the script
        export DB_HOST=localhost
        export DB_USER=$DB_USER  
        export DB_PASSWORD=$DB_PASSWORD
        export DB_NAME=$DB_NAME
        
        # Wait a bit more for database to be fully ready
        sleep 2
        
        node scripts/createAdmin.js
        success "Default admin user created"
    else
        warning "Admin creation script not found, skipping admin user creation"
    fi
}

# Verify setup
verify_setup() {
    log "Verifying setup..."
    
    # Check database connection
    log "Testing database connection..."
    if docker exec $CONTAINER_NAME mysql -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" >/dev/null 2>&1; then
        success "Database connection successful"
        
        # Show tables
        log "Database tables:"
        docker exec $CONTAINER_NAME mysql -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | tail -n +2
    else
        error "Database connection failed"
        exit 1
    fi
    
    # Check if all required files exist
    required_files=("server.js" "package.json" ".env" "config/database.js")
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            success "✓ $file exists"
        else
            error "✗ $file missing"
        fi
    done
}

# Cleanup function for interrupted setup
cleanup() {
    error "Setup interrupted"
    log "To clean up, run: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
    exit 1
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "        PharmaTrack Backend Setup Script"
    echo "=================================================="
    echo -e "${NC}"
    
    # Handle interrupt signals
    trap cleanup INT TERM
    
    check_prerequisites
    install_dependencies
    setup_environment
    setup_mysql_docker
    setup_database
    create_admin_user
    setup_frontend
    verify_setup
    
    echo -e "${GREEN}"
    echo "=================================================="
    echo "           Setup completed successfully!"
    echo "=================================================="
    echo -e "${NC}"
    
    echo ""
    echo "🚀 Next steps:"
    echo "1. Start backend: npm run dev"
    echo "2. Start frontend: npm run frontend (in new terminal)"
    echo "3. Access the web app at: http://localhost:3001"
    echo "4. API endpoint: http://localhost:3001/api"
    echo ""
    echo "🔐 Test Login Credentials:"
    echo "Email: admin@pharmatrak.com"
    echo "Password: Admin123!"
    echo ""
    echo "Database Information:"
    echo "- Host: localhost"
    echo "- Port: $DB_PORT"
    echo "- Database: $DB_NAME"
    echo "- User: $DB_USER"
    echo "- Password: $DB_PASSWORD"
    echo ""
    echo "Docker Commands:"
    echo "- View logs: docker logs $CONTAINER_NAME"
    echo "- Stop database: docker stop $CONTAINER_NAME"
    echo "- Start database: docker start $CONTAINER_NAME"
    echo "- Remove database: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
    echo ""
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi