#!/bin/bash

# PharmaTraK Remote Docker Deployment Script
# This script deploys PharmaTraK to a remote Docker host

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
DOCKER_HOST=${2:-""}
DOCKER_CONTEXT=${3:-""}
ENV_FILE=".env.${ENVIRONMENT}"
REMOTE_PATH="/opt/pharmatrak"

# Usage information
usage() {
    echo "Usage: $0 [environment] [docker_host] [docker_context]"
    echo ""
    echo "Arguments:"
    echo "  environment   - Deployment environment (default: production)"
    echo "  docker_host   - Remote Docker host (e.g., ssh://user@server or tcp://server:2376)"
    echo "  docker_context- Docker context name (alternative to docker_host)"
    echo ""
    echo "Examples:"
    echo "  $0 production ssh://user@192.168.1.100"
    echo "  $0 production tcp://192.168.1.100:2376"
    echo "  $0 production \"\" remote-server-context"
    echo "  $0 staging ssh://user@staging.example.com"
    echo ""
    echo "Docker Context Setup (recommended):"
    echo "  docker context create remote-server --docker host=ssh://user@server"
    echo "  $0 production \"\" remote-server"
}

# Show usage if help requested
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    usage
    exit 0
fi

# Validate remote connection parameters
validate_remote_config() {
    if [[ -z "$DOCKER_HOST" ]] && [[ -z "$DOCKER_CONTEXT" ]]; then
        error "Either DOCKER_HOST or DOCKER_CONTEXT must be specified for remote deployment"
        echo ""
        usage
        exit 1
    fi
    
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        log "Using Docker context: $DOCKER_CONTEXT"
        if ! docker context inspect "$DOCKER_CONTEXT" &>/dev/null; then
            error "Docker context '$DOCKER_CONTEXT' does not exist"
            echo "Available contexts:"
            docker context ls
            exit 1
        fi
    elif [[ -n "$DOCKER_HOST" ]]; then
        log "Using Docker host: $DOCKER_HOST"
        export DOCKER_HOST
    fi
}

# Test remote Docker connection
test_remote_connection() {
    log "Testing remote Docker connection..."
    
    local docker_cmd="docker"
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        docker_cmd="docker --context $DOCKER_CONTEXT"
    fi
    
    if ! $docker_cmd version &>/dev/null; then
        error "Cannot connect to remote Docker. Please check your connection settings."
        exit 1
    fi
    
    local remote_info=$($docker_cmd version --format '{{.Server.Version}}' 2>/dev/null)
    success "Connected to remote Docker (version: $remote_info)"
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
    
    success "Environment configuration validated"
}

# Prepare deployment files
prepare_deployment() {
    log "Preparing deployment files..."
    
    # Create temporary deployment directory
    local temp_dir="/tmp/pharmatrak-deploy-$(date +%s)"
    mkdir -p "$temp_dir"
    
    # Copy necessary files
    cp -r . "$temp_dir/"
    
    # Set deployment context
    export DEPLOYMENT_DIR="$temp_dir"
    
    success "Deployment files prepared in $temp_dir"
}

# Build images on remote host
build_images() {
    log "Building Docker images on remote host..."
    
    local docker_compose_cmd="docker-compose"
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        docker_compose_cmd="docker --context $DOCKER_CONTEXT compose"
    fi
    
    # Build images
    $docker_compose_cmd --env-file "$ENV_FILE" build --no-cache
    
    success "Docker images built successfully"
}

# Deploy to remote host
deploy_remote() {
    log "Deploying to remote Docker host..."
    
    local docker_compose_cmd="docker-compose"
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        docker_compose_cmd="docker --context $DOCKER_CONTEXT compose"
    fi
    
    # Load environment variables
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    
    # Pull base images
    log "Pulling base Docker images..."
    $docker_compose_cmd --env-file "$ENV_FILE" pull mysql redis
    
    # Build custom images
    build_images
    
    # Stop existing containers
    log "Stopping existing containers..."
    $docker_compose_cmd --env-file "$ENV_FILE" down || true
    
    # Start services
    log "Starting services..."
    $docker_compose_cmd --env-file "$ENV_FILE" up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_remote_health
    
    success "Remote deployment completed"
}

# Check remote service health
check_remote_health() {
    log "Checking remote service health..."
    
    local docker_compose_cmd="docker-compose"
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        docker_compose_cmd="docker --context $DOCKER_CONTEXT compose"
    fi
    
    # Check MySQL
    if $docker_compose_cmd ps mysql | grep -q "Up (healthy)"; then
        success "MySQL is healthy"
    else
        error "MySQL is not healthy"
        $docker_compose_cmd logs mysql
        return 1
    fi
    
    # Check Backend
    if $docker_compose_cmd ps backend | grep -q "Up (healthy)"; then
        success "Backend is healthy"
    else
        error "Backend is not healthy"
        $docker_compose_cmd logs backend
        return 1
    fi
    
    # Check Frontend
    if $docker_compose_cmd ps frontend | grep -q "Up (healthy)"; then
        success "Frontend is healthy"
    else
        warning "Frontend health check may need manual verification"
    fi
    
    # Check Redis
    if $docker_compose_cmd ps redis | grep -q "Up (healthy)"; then
        success "Redis is healthy"
    else
        error "Redis is not healthy"
        $docker_compose_cmd logs redis
        return 1
    fi
    
    success "All remote services are healthy"
}

# Show remote service status
show_remote_status() {
    log "Remote service status:"
    
    local docker_compose_cmd="docker-compose"
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        docker_compose_cmd="docker --context $DOCKER_CONTEXT compose"
    fi
    
    $docker_compose_cmd --env-file "$ENV_FILE" ps
    
    echo ""
    log "Recent logs:"
    $docker_compose_cmd --env-file "$ENV_FILE" logs --tail=10
}

# Create Docker Swarm stack (optional)
deploy_swarm() {
    log "Deploying as Docker Swarm stack..."
    
    local docker_cmd="docker"
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        docker_cmd="docker --context $DOCKER_CONTEXT"
    fi
    
    # Check if swarm is initialized
    if ! $docker_cmd node ls &>/dev/null; then
        log "Initializing Docker Swarm..."
        $docker_cmd swarm init
    fi
    
    # Convert compose file to stack format
    local stack_file="docker-stack.yml"
    if [ -f "$stack_file" ]; then
        $docker_cmd stack deploy --compose-file "$stack_file" pharmatrak
        success "Docker Swarm stack deployed"
    else
        warning "Docker stack file not found. Using regular compose deployment."
        deploy_remote
    fi
}

# Cleanup function
cleanup() {
    if [[ -n "$DEPLOYMENT_DIR" ]] && [[ -d "$DEPLOYMENT_DIR" ]]; then
        log "Cleaning up temporary files..."
        rm -rf "$DEPLOYMENT_DIR"
    fi
}

# Handle script interruption
trap cleanup INT TERM EXIT

# Main deployment function
main() {
    echo -e "${BLUE}"
    echo "==================================================="
    echo "        PharmaTraK Remote Docker Deployment"
    echo "==================================================="
    echo -e "${NC}"
    
    echo "Environment: $ENVIRONMENT"
    echo "Environment file: $ENV_FILE"
    if [[ -n "$DOCKER_HOST" ]]; then
        echo "Docker Host: $DOCKER_HOST"
    fi
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        echo "Docker Context: $DOCKER_CONTEXT"
    fi
    echo ""
    
    validate_remote_config
    check_prerequisites
    test_remote_connection
    validate_environment
    prepare_deployment
    
    # Ask for deployment type
    echo "Select deployment type:"
    echo "1) Docker Compose (recommended)"
    echo "2) Docker Swarm Stack"
    read -p "Enter choice [1-2]: " -n 1 -r
    echo
    
    case $REPLY in
        1)
            deploy_remote
            ;;
        2)
            deploy_swarm
            ;;
        *)
            deploy_remote
            ;;
    esac
    
    show_remote_status
    
    echo -e "${GREEN}"
    echo "==================================================="
    echo "      Remote deployment completed successfully!"
    echo "==================================================="
    echo -e "${NC}"
    
    echo ""
    echo "🌐 Application should be accessible on remote host"
    echo "🔐 Default Admin Credentials:"
    echo "   Email: admin@pharmatrak.com"
    echo "   Password: Admin123!"
    echo ""
    echo "📋 Remote Management Commands:"
    if [[ -n "$DOCKER_CONTEXT" ]]; then
        echo "   View logs: docker --context $DOCKER_CONTEXT compose --env-file $ENV_FILE logs -f"
        echo "   Stop services: docker --context $DOCKER_CONTEXT compose --env-file $ENV_FILE down"
        echo "   Restart: docker --context $DOCKER_CONTEXT compose --env-file $ENV_FILE restart"
        echo "   Status: docker --context $DOCKER_CONTEXT compose --env-file $ENV_FILE ps"
    else
        echo "   Set DOCKER_HOST=$DOCKER_HOST and use regular docker-compose commands"
    fi
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi