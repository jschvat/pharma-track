#!/bin/bash

# Docker Management Script
# Manages the MySQL Docker container

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CONTAINER_NAME="pharmatrak-mysql"

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

# Show container status
show_status() {
    echo -e "${BLUE}Container Status:${NC}"
    
    if docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -q "$CONTAINER_NAME"; then
        docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | head -n 1
        docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep "$CONTAINER_NAME"
    else
        echo "Container '$CONTAINER_NAME' does not exist"
    fi
    echo ""
}

# Start container
start_container() {
    log "Starting MySQL container..."
    
    if docker ps --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        warning "Container is already running"
    elif docker ps -a --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        docker start $CONTAINER_NAME
        success "Container started"
    else
        error "Container does not exist. Run setup.sh first."
        exit 1
    fi
}

# Stop container
stop_container() {
    log "Stopping MySQL container..."
    
    if docker ps --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        docker stop $CONTAINER_NAME
        success "Container stopped"
    else
        warning "Container is not running"
    fi
}

# Restart container
restart_container() {
    log "Restarting MySQL container..."
    docker restart $CONTAINER_NAME
    success "Container restarted"
}

# Show logs
show_logs() {
    local lines=${1:-50}
    log "Showing last $lines lines of container logs..."
    docker logs --tail $lines -f $CONTAINER_NAME
}

# Connect to MySQL
connect_mysql() {
    log "Connecting to MySQL (use Ctrl+C to exit)..."
    docker exec -it $CONTAINER_NAME mysql -u pharmatrak_user -ppharmatrak_password pharmatrak
}

# Connect as root
connect_mysql_root() {
    log "Connecting to MySQL as root (use Ctrl+C to exit)..."
    docker exec -it $CONTAINER_NAME mysql -u root -proot_password
}

# Remove container
remove_container() {
    echo -e "${RED}"
    echo "WARNING: This will completely remove the MySQL container!"
    echo "All data will be lost permanently unless you have backups."
    echo -e "${NC}"
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Container removal cancelled"
        exit 0
    fi
    
    log "Removing MySQL container..."
    
    # Stop if running
    if docker ps --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        docker stop $CONTAINER_NAME
    fi
    
    # Remove container
    if docker ps -a --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        docker rm $CONTAINER_NAME
        success "Container removed"
    else
        warning "Container does not exist"
    fi
}

# Show container info
show_info() {
    log "Container Information:"
    
    if docker ps -a --format 'table {{.Names}}' | grep -q "$CONTAINER_NAME"; then
        docker inspect $CONTAINER_NAME --format '
Container: {{.Name}}
Image: {{.Config.Image}}
Status: {{.State.Status}}
Started: {{.State.StartedAt}}
Ports: {{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}} {{end}}
Mounts: {{range .Mounts}}{{.Source}}:{{.Destination}} {{end}}
'
    else
        echo "Container '$CONTAINER_NAME' does not exist"
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status    Show container status"
    echo "  start     Start the container"
    echo "  stop      Stop the container"
    echo "  restart   Restart the container"
    echo "  logs      Show container logs (optional: number of lines)"
    echo "  connect   Connect to MySQL as application user"
    echo "  root      Connect to MySQL as root user"
    echo "  info      Show detailed container information"
    echo "  remove    Remove the container (DESTRUCTIVE)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 logs 100"
    echo "  $0 connect"
}

main() {
    local command=${1:-status}
    
    case $command in
        "status")
            show_status
            ;;
        "start")
            start_container
            ;;
        "stop")
            stop_container
            ;;
        "restart")
            restart_container
            ;;
        "logs")
            show_logs $2
            ;;
        "connect")
            connect_mysql
            ;;
        "root")
            connect_mysql_root
            ;;
        "info")
            show_info
            ;;
        "remove")
            remove_container
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            error "Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi