# Remote Docker Deployment Guide for PharmaTraK

This guide explains how to deploy PharmaTraK to a remote Docker host using various connection methods.

## Quick Start

1. **Setup Docker Context (Recommended)**
   ```bash
   ./scripts/setup-docker-context.sh create
   ```

2. **Deploy to Remote Host**
   ```bash
   ./deploy-remote.sh production "" my-remote-context
   ```

## Deployment Methods

### 1. Docker Context (Recommended)

Docker contexts provide a secure and convenient way to manage remote Docker connections.

#### Setup SSH Context
```bash
# Interactive setup
./scripts/setup-docker-context.sh create

# Quick setup
./scripts/setup-docker-context.sh create ssh://user@192.168.1.100

# Manual setup
docker context create my-server --docker host=ssh://user@server.com
```

#### Deploy Using Context
```bash
./deploy-remote.sh production "" my-server
```

### 2. Direct SSH Connection

Deploy directly using SSH without creating a persistent context.

```bash
./deploy-remote.sh production ssh://user@192.168.1.100
./deploy-remote.sh production ssh://user@server.com:2222  # Custom SSH port
```

### 3. TLS Connection

For Docker daemons configured with TLS certificates.

```bash
./deploy-remote.sh production tcp://server.com:2376
```

## Prerequisites

### Local Requirements
- Docker installed locally
- Docker Compose plugin
- SSH access to remote server (for SSH connections)
- TLS certificates (for TLS connections)

### Remote Server Requirements
- Docker installed and running
- SSH server running (for SSH connections)
- Docker daemon accessible (ports 2375/2376 for TCP)
- Sufficient resources (2GB RAM minimum recommended)

## Security Configurations

### SSH Key Setup

1. **Generate SSH Key**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "pharmatrak-deploy"
   ```

2. **Copy to Remote Server**
   ```bash
   ssh-copy-id user@server.com
   ```

3. **Test Connection**
   ```bash
   ssh user@server.com "docker version"
   ```

### Docker Daemon Security

#### Enable SSH Access (Recommended)
```bash
# On remote server - no additional Docker configuration needed
# SSH connection uses existing Docker socket via SSH tunnel
```

#### Enable TLS Access (Advanced)
```bash
# On remote server
sudo mkdir -p /etc/docker/certs.d/
# Copy your TLS certificates to the certs directory
# Configure Docker daemon for TLS
sudo systemctl restart docker
```

## Environment Configuration

### Create Remote Environment File

1. **Copy template**
   ```bash
   cp .env.production .env.remote
   ```

2. **Update remote-specific settings**
   ```bash
   # Update URLs for remote deployment
   FRONTEND_URL=https://your-remote-domain.com
   REACT_APP_API_URL=https://your-remote-domain.com/api
   ```

3. **Generate secure secrets**
   ```bash
   ./deploy-remote.sh production ssh://user@server  # Will auto-generate secrets
   ```

## Docker Swarm Deployment

For high availability and scaling, deploy as a Docker Swarm stack.

### Setup Swarm
```bash
# On remote server
docker swarm init

# Create secrets
echo "secure_mysql_root_password" | docker secret create mysql_root_password -
echo "secure_mysql_password" | docker secret create mysql_password -
echo "secure_jwt_secret_32_chars_min" | docker secret create jwt_secret -
echo "secure_redis_password" | docker secret create redis_password -
```

### Deploy Stack
```bash
# Using docker-stack.yml
docker --context my-server stack deploy --compose-file docker-stack.yml pharmatrak
```

## Troubleshooting

### Connection Issues

1. **SSH Connection Fails**
   ```bash
   # Test SSH connection
   ssh user@server "echo 'SSH working'"
   
   # Check SSH key
   ssh-add -l
   
   # Test Docker over SSH
   ssh user@server "docker version"
   ```

2. **Docker Context Issues**
   ```bash
   # List contexts
   docker context ls
   
   # Test specific context
   docker --context my-server version
   
   # Remove and recreate context
   docker context rm my-server
   ./scripts/setup-docker-context.sh create
   ```

3. **TLS Certificate Issues**
   ```bash
   # Verify certificates
   openssl x509 -in cert.pem -text -noout
   
   # Test TLS connection
   docker --tlsverify --tlscacert=ca.pem --tlscert=cert.pem --tlskey=key.pem -H=tcp://server:2376 version
   ```

### Deployment Issues

1. **Check Remote Docker Status**
   ```bash
   docker --context my-server system info
   docker --context my-server compose ps
   ```

2. **View Remote Logs**
   ```bash
   docker --context my-server compose logs -f
   docker --context my-server compose logs backend
   ```

3. **Health Check Issues**
   ```bash
   # Check service health
   docker --context my-server compose ps
   
   # Test health endpoints
   curl -f http://remote-server/health
   curl -f http://remote-server/api/health
   ```

### Resource Issues

1. **Check Remote Resources**
   ```bash
   docker --context my-server system df
   docker --context my-server stats
   ```

2. **Free Up Space**
   ```bash
   docker --context my-server system prune -f
   docker --context my-server volume prune -f
   ```

## Best Practices

### Security
- Use SSH keys instead of passwords
- Keep TLS certificates secure and rotated
- Use Docker secrets for sensitive data in Swarm mode
- Configure firewall rules appropriately
- Enable audit logging on remote server

### Performance
- Ensure sufficient resources on remote server
- Use SSD storage for database volumes
- Configure appropriate Docker resource limits
- Monitor resource usage regularly

### Monitoring
- Set up log aggregation
- Configure health check endpoints
- Use Docker stats for resource monitoring
- Consider adding Portainer for web-based management

### Backup
- Regular database backups
- Volume snapshots
- Configuration backup
- Test restore procedures

## Examples

### Complete SSH Deployment
```bash
# 1. Setup SSH access
./scripts/setup-docker-context.sh ssh-setup

# 2. Create Docker context
./scripts/setup-docker-context.sh create ssh://user@server.com

# 3. Deploy application
./deploy-remote.sh production "" server-context

# 4. Verify deployment
docker --context server-context compose ps
curl -f http://server.com/health
```

### Multi-Server Swarm Deployment
```bash
# 1. Initialize swarm on manager node
ssh manager "docker swarm init"

# 2. Join worker nodes
ssh worker1 "docker swarm join --token TOKEN manager:2377"
ssh worker2 "docker swarm join --token TOKEN manager:2377"

# 3. Create secrets
docker --context swarm-manager secret create mysql_root_password - <<< "secure_password"
docker --context swarm-manager secret create mysql_password - <<< "secure_password"
docker --context swarm-manager secret create jwt_secret - <<< "secure_jwt_secret_32_chars"
docker --context swarm-manager secret create redis_password - <<< "secure_password"

# 4. Deploy stack
docker --context swarm-manager stack deploy --compose-file docker-stack.yml pharmatrak

# 5. Check deployment
docker --context swarm-manager stack services pharmatrak
```

## Support

For deployment issues:
1. Check logs using the troubleshooting commands above
2. Verify network connectivity and firewall rules
3. Ensure Docker daemon is running on remote server
4. Validate certificates and authentication credentials