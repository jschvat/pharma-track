#!/bin/bash

# Docker Context Setup Script for PharmaTraK Remote Deployment
# This script helps configure Docker contexts for remote deployment

set -e

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

# Usage information
usage() {
    echo "Docker Context Setup for PharmaTraK Remote Deployment"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  create    Create a new Docker context"
    echo "  list      List all Docker contexts"
    echo "  test      Test a Docker context"
    echo "  remove    Remove a Docker context"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 create                    # Interactive context creation"
    echo "  $0 create ssh://user@server # Quick SSH context creation"
    echo "  $0 test my-remote-server     # Test a context"
    echo "  $0 list                      # List all contexts"
}

# Create Docker context interactively
create_context_interactive() {
    echo -e "${BLUE}"
    echo "==================================================="
    echo "        Docker Context Creation Wizard"
    echo "==================================================="
    echo -e "${NC}"
    
    # Get context name
    read -p "Enter context name: " context_name
    if [[ -z "$context_name" ]]; then
        error "Context name cannot be empty"
        return 1
    fi
    
    # Check if context already exists
    if docker context inspect "$context_name" &>/dev/null; then
        error "Context '$context_name' already exists"
        return 1
    fi
    
    echo ""
    echo "Select connection type:"
    echo "1) SSH (recommended for secure connections)"
    echo "2) TCP (for Docker daemon with TLS)"
    echo "3) TCP (for Docker daemon without TLS - not recommended)"
    read -p "Enter choice [1-3]: " -n 1 -r
    echo
    
    case $REPLY in
        1)
            create_ssh_context "$context_name"
            ;;
        2)
            create_tls_context "$context_name"
            ;;
        3)
            create_tcp_context "$context_name"
            ;;
        *)
            error "Invalid choice"
            return 1
            ;;
    esac
}

# Create SSH-based Docker context
create_ssh_context() {
    local context_name="$1"
    
    if [[ -z "$context_name" ]]; then
        read -p "Enter context name: " context_name
    fi
    
    read -p "Enter SSH connection string (user@hostname): " ssh_connection
    if [[ -z "$ssh_connection" ]]; then
        error "SSH connection string cannot be empty"
        return 1
    fi
    
    read -p "Enter SSH port (default: 22): " ssh_port
    ssh_port=${ssh_port:-22}
    
    read -p "Enter SSH key path (optional, press Enter for default): " ssh_key
    
    # Build Docker host URL
    local docker_host="ssh://${ssh_connection}"
    if [[ "$ssh_port" != "22" ]]; then
        docker_host="${docker_host}:${ssh_port}"
    fi
    
    # Create context
    log "Creating SSH Docker context '$context_name'..."
    
    local create_cmd="docker context create $context_name --docker host=$docker_host"
    if [[ -n "$ssh_key" ]]; then
        create_cmd="$create_cmd --docker-options=--ssh-identity-file=$ssh_key"
    fi
    
    if eval "$create_cmd"; then
        success "Docker context '$context_name' created successfully"
        
        # Test the context
        test_context "$context_name"
    else
        error "Failed to create Docker context"
        return 1
    fi
}

# Create TLS-based Docker context
create_tls_context() {
    local context_name="$1"
    
    if [[ -z "$context_name" ]]; then
        read -p "Enter context name: " context_name
    fi
    
    read -p "Enter Docker daemon hostname/IP: " docker_host
    if [[ -z "$docker_host" ]]; then
        error "Docker host cannot be empty"
        return 1
    fi
    
    read -p "Enter Docker daemon port (default: 2376): " docker_port
    docker_port=${docker_port:-2376}
    
    read -p "Enter TLS CA certificate path: " ca_cert
    read -p "Enter TLS client certificate path: " client_cert
    read -p "Enter TLS client key path: " client_key
    
    # Validate certificate files
    if [[ ! -f "$ca_cert" ]] || [[ ! -f "$client_cert" ]] || [[ ! -f "$client_key" ]]; then
        error "One or more certificate files do not exist"
        return 1
    fi
    
    # Create context
    log "Creating TLS Docker context '$context_name'..."
    
    if docker context create "$context_name" \
        --docker "host=tcp://${docker_host}:${docker_port},ca=${ca_cert},cert=${client_cert},key=${client_key}"; then
        success "Docker context '$context_name' created successfully"
        
        # Test the context
        test_context "$context_name"
    else
        error "Failed to create Docker context"
        return 1
    fi
}

# Create plain TCP Docker context (insecure)
create_tcp_context() {
    local context_name="$1"
    
    if [[ -z "$context_name" ]]; then
        read -p "Enter context name: " context_name
    fi
    
    warning "TCP without TLS is not secure and not recommended for production!"
    read -p "Are you sure you want to continue? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    
    read -p "Enter Docker daemon hostname/IP: " docker_host
    if [[ -z "$docker_host" ]]; then
        error "Docker host cannot be empty"
        return 1
    fi
    
    read -p "Enter Docker daemon port (default: 2375): " docker_port
    docker_port=${docker_port:-2375}
    
    # Create context
    log "Creating TCP Docker context '$context_name'..."
    
    if docker context create "$context_name" --docker "host=tcp://${docker_host}:${docker_port}"; then
        success "Docker context '$context_name' created successfully"
        
        # Test the context
        test_context "$context_name"
    else
        error "Failed to create Docker context"
        return 1
    fi
}

# Test Docker context
test_context() {
    local context_name="$1"
    
    if [[ -z "$context_name" ]]; then
        read -p "Enter context name to test: " context_name
    fi
    
    log "Testing Docker context '$context_name'..."
    
    # Check if context exists
    if ! docker context inspect "$context_name" &>/dev/null; then
        error "Context '$context_name' does not exist"
        return 1
    fi
    
    # Test connection
    if docker --context "$context_name" version &>/dev/null; then
        local remote_version=$(docker --context "$context_name" version --format '{{.Server.Version}}' 2>/dev/null)
        success "Context '$context_name' is working (Remote Docker version: $remote_version)"
        
        # Show additional info
        log "Remote Docker info:"
        docker --context "$context_name" system info --format "table {{.ServerVersion}}\t{{.OSType}}\t{{.Architecture}}\t{{.MemTotal}}"
        
        return 0
    else
        error "Context '$context_name' connection failed"
        return 1
    fi
}

# List Docker contexts
list_contexts() {
    log "Available Docker contexts:"
    echo ""
    docker context ls
    echo ""
    
    # Show current context
    local current_context=$(docker context show)
    log "Current context: $current_context"
}

# Remove Docker context
remove_context() {
    local context_name="$1"
    
    if [[ -z "$context_name" ]]; then
        read -p "Enter context name to remove: " context_name
    fi
    
    if [[ -z "$context_name" ]]; then
        error "Context name cannot be empty"
        return 1
    fi
    
    # Check if context exists
    if ! docker context inspect "$context_name" &>/dev/null; then
        error "Context '$context_name' does not exist"
        return 1
    fi
    
    # Confirm removal
    warning "This will remove the Docker context '$context_name'"
    read -p "Are you sure? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    
    # Remove context
    if docker context rm "$context_name"; then
        success "Docker context '$context_name' removed"
    else
        error "Failed to remove Docker context '$context_name'"
        return 1
    fi
}

# Setup SSH key for remote access
setup_ssh_key() {
    echo -e "${BLUE}"
    echo "==================================================="
    echo "           SSH Key Setup for Remote Docker"
    echo "==================================================="
    echo -e "${NC}"
    
    read -p "Enter remote server hostname/IP: " remote_host
    if [[ -z "$remote_host" ]]; then
        error "Remote host cannot be empty"
        return 1
    fi
    
    read -p "Enter remote username: " remote_user
    if [[ -z "$remote_user" ]]; then
        error "Remote username cannot be empty"
        return 1
    fi
    
    # Check if SSH key exists
    local ssh_key="$HOME/.ssh/id_rsa"
    if [[ ! -f "$ssh_key" ]]; then
        log "SSH key not found. Generating new SSH key..."
        ssh-keygen -t rsa -b 4096 -C "pharmatrak-docker-deploy" -f "$ssh_key" -N ""
        success "SSH key generated: $ssh_key"
    fi
    
    # Copy SSH key to remote server
    log "Copying SSH key to remote server..."
    if ssh-copy-id -i "${ssh_key}.pub" "${remote_user}@${remote_host}"; then
        success "SSH key copied to remote server"
    else
        error "Failed to copy SSH key"
        return 1
    fi
    
    # Test SSH connection
    log "Testing SSH connection..."
    if ssh -o BatchMode=yes -o ConnectTimeout=5 "${remote_user}@${remote_host}" "echo 'SSH connection successful'"; then
        success "SSH connection test passed"
        
        # Create Docker context
        log "Creating Docker context..."
        local context_name="${remote_host}-docker"
        if docker context create "$context_name" --docker "host=ssh://${remote_user}@${remote_host}"; then
            success "Docker context '$context_name' created"
            test_context "$context_name"
        fi
    else
        error "SSH connection test failed"
        return 1
    fi
}

# Main function
main() {
    local command="${1:-help}"
    
    case "$command" in
        "create")
            if [[ -n "$2" ]]; then
                if [[ "$2" == ssh://* ]]; then
                    # Quick SSH context creation
                    local ssh_string="${2#ssh://}"
                    local context_name=$(echo "$ssh_string" | sed 's/@/-/g' | sed 's/:.*//g')
                    docker context create "$context_name" --docker "host=$2"
                    test_context "$context_name"
                else
                    error "Invalid connection string format. Use ssh://user@host format"
                    return 1
                fi
            else
                create_context_interactive
            fi
            ;;
        "list")
            list_contexts
            ;;
        "test")
            test_context "$2"
            ;;
        "remove")
            remove_context "$2"
            ;;
        "ssh-setup")
            setup_ssh_key
            ;;
        "help"|"-h"|"--help")
            usage
            ;;
        *)
            error "Unknown command: $command"
            echo ""
            usage
            return 1
            ;;
    esac
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi