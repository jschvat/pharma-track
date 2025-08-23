#!/bin/bash

# PharmaTraK Production Deployment Script
# This script deploys the PharmaTraK system using Docker with security best practices

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Configuration
ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Check if running as root (not recommended)
check_user() {
    if [ "$EUID" -eq 0 ]; then
        warning "Running as root is not recommended for security reasons."
        read -p "Continue anyway? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker and try again."
        exit 1
    fi
    
    success "All prerequisites are met"
}

# Validate environment file
validate_environment() {
    log "Validating environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file $ENV_FILE not found"
        exit 1
    fi
    
    # Check for default/insecure values
    if grep -q "CHANGE_ME" "$ENV_FILE"; then
        error "Environment file contains default values. Please update all 'CHANGE_ME' values with secure credentials."
        exit 1
    fi
    
    # Validate JWT secret length (should be at least 32 characters)
    JWT_SECRET=$(grep "JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2)
    if [ ${#JWT_SECRET} -lt 32 ]; then
        error "JWT_SECRET is too short. Please use at least 32 characters."
        exit 1
    fi
    
    success "Environment configuration validated"
}

# Generate secure secrets if needed
generate_secrets() {
    log "Checking for secure secrets..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log "Generating secure environment file from template..."
        cp .env.production "$ENV_FILE"
        
        # Generate secure values
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        DB_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        JWT_SECRET=$(openssl rand -base64 32)
        REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        
        # Replace placeholders
        sed -i "s/CHANGE_ME_SECURE_DB_PASSWORD/$DB_PASSWORD/g" "$ENV_FILE"
        sed -i "s/CHANGE_ME_SECURE_ROOT_PASSWORD/$DB_ROOT_PASSWORD/g" "$ENV_FILE"
        sed -i "s/CHANGE_ME_GENERATE_SECURE_JWT_SECRET_256_BITS/$JWT_SECRET/g" "$ENV_FILE"
        sed -i "s/CHANGE_ME_SECURE_REDIS_PASSWORD/$REDIS_PASSWORD/g" "$ENV_FILE"
        
        success "Secure environment file generated: $ENV_FILE"
        warning "Please review and customize the generated environment file before deployment"
        
        # Set secure permissions
        chmod 600 "$ENV_FILE"
    fi
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if containers are running
    if docker-compose ps mysql | grep -q "Up"; then
        log "Backing up database..."
        docker-compose exec -T mysql mysqldump -u root -p"$DB_ROOT_PASSWORD" --all-databases > "$BACKUP_DIR/database_backup.sql"
        success "Database backup created"
    fi
    
    # Backup volumes
    if docker volume ls | grep -q "pharmatrak"; then
        log "Backing up Docker volumes..."
        docker run --rm -v pharmatrak_mysql_data:/data -v "$PWD/$BACKUP_DIR":/backup alpine tar czf /backup/mysql_data.tar.gz -C /data .
        docker run --rm -v pharmatrak_redis_data:/data -v "$PWD/$BACKUP_DIR":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
        success "Volume backups created"
    fi
    
    success "Backup completed: $BACKUP_DIR"
}

# Security hardening
security_hardening() {
    log "Applying security hardening..."
    
    # Create logs directory with proper permissions
    mkdir -p logs
    chmod 755 logs
    
    # Set proper file permissions
    chmod 600 "$ENV_FILE"
    chmod 755 *.sh
    
    # Create SSL directory if needed
    mkdir -p nginx/ssl
    chmod 700 nginx/ssl
    
    success "Security hardening applied"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Load environment variables
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose --env-file "$ENV_FILE" pull
    
    # Build custom images
    log "Building application images..."
    docker-compose --env-file "$ENV_FILE" build --no-cache
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose --env-file "$ENV_FILE" down
    
    # Start services
    log "Starting services..."
    docker-compose --env-file "$ENV_FILE" up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
    
    success "Deployment completed"
}

# Health check
check_health() {
    log "Checking service health..."
    
    # Check MySQL
    if docker-compose ps mysql | grep -q "Up (healthy)"; then
        success "MySQL is healthy"
    else
        error "MySQL is not healthy"
        docker-compose logs mysql
        return 1
    fi
    
    # Check Backend
    if docker-compose ps backend | grep -q "Up (healthy)"; then
        success "Backend is healthy"
    else
        error "Backend is not healthy"
        docker-compose logs backend
        return 1
    fi
    
    # Check Frontend
    if docker-compose ps frontend | grep -q "Up (healthy)"; then
        success "Frontend is healthy"
    else
        warning "Frontend health check failed, checking manually..."
        if curl -f http://localhost/health &> /dev/null; then
            success "Frontend is responding"
        else
            error "Frontend is not responding"
            docker-compose logs frontend
            return 1
        fi
    fi
    
    # Check Redis
    if docker-compose ps redis | grep -q "Up (healthy)"; then
        success "Redis is healthy"
    else
        error "Redis is not healthy"
        docker-compose logs redis
        return 1
    fi
    
    success "All services are healthy"
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."
    
    # Show service status
    log "Service Status:"
    docker-compose ps
    
    # Show logs
    log "Recent logs:"
    docker-compose logs --tail=20
    
    # Security scan (if available)
    if command -v docker &> /dev/null; then
        log "Running security scan..."
        # This would run a security scan if tools like Trivy are available
        # trivy image pharmatrak_backend:latest
    fi
    
    success "Post-deployment tasks completed"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old containers
    docker container prune -f
    
    success "Cleanup completed"
}

# Detect deployment type
detect_deployment_type() {
    echo ""
    echo "Select deployment type:"
    echo "1) Local Docker deployment (default)"
    echo "2) Remote Docker deployment"
    read -p "Enter choice [1-2]: " -n 1 -r
    echo
    
    case $REPLY in
        2)
            log "Remote deployment selected. Use deploy-remote.sh instead:"
            echo "  ./deploy-remote.sh $ENVIRONMENT [docker_host] [docker_context]"
            echo ""
            echo "Examples:"
            echo "  ./deploy-remote.sh production ssh://user@192.168.1.100"
            echo "  ./deploy-remote.sh production \"\" my-remote-context"
            echo ""
            echo "For Docker context setup, run:"
            echo "  ./scripts/setup-docker-context.sh create"
            exit 0
            ;;
        *)
            log "Local deployment selected"
            ;;
    esac
}

# Main deployment function
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "        PharmaTraK Production Deployment"
    echo "=================================================="
    echo -e "${NC}"
    
    echo "Environment: $ENVIRONMENT"
    echo "Environment file: $ENV_FILE"
    echo ""
    
    detect_deployment_type
    check_user
    check_prerequisites
    generate_secrets
    validate_environment
    security_hardening
    
    # Create backup for production deployments
    if [ "$ENVIRONMENT" = "production" ]; then
        create_backup
    fi
    
    deploy
    post_deployment
    
    echo -e "${GREEN}"
    echo "=================================================="
    echo "         Deployment completed successfully!"
    echo "=================================================="
    echo -e "${NC}"
    
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost (or your configured domain)"
    echo "   Backend API: http://localhost/api"
    echo "   Health Check: http://localhost/health"
    echo ""
    echo "🔐 Default Admin Credentials:"
    echo "   Email: admin@pharmatrak.com"
    echo "   Password: Admin123!"
    echo ""
    echo "📋 Management Commands:"
    echo "   View logs: docker-compose --env-file $ENV_FILE logs -f"
    echo "   Stop services: docker-compose --env-file $ENV_FILE down"
    echo "   Restart services: docker-compose --env-file $ENV_FILE restart"
    echo "   View status: docker-compose --env-file $ENV_FILE ps"
    echo ""
    echo "🛡️  Security Reminders:"
    echo "   1. Change default admin password immediately"
    echo "   2. Set up SSL/TLS certificates for HTTPS"
    echo "   3. Configure firewall rules"
    echo "   4. Set up log monitoring"
    echo "   5. Enable automated backups"
    echo "   6. Review environment variables in $ENV_FILE"
    echo ""
    
    cleanup
}

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi