# PharmaTrack Backend Setup Guide

This guide will help you set up the PharmaTrack backend application with all dependencies, database, and configuration.

## Prerequisites

Before running the setup, ensure you have the following installed:

- **Node.js 16+** ([Download](https://nodejs.org/))
- **Docker** ([Download](https://www.docker.com/get-started))
- **Git** (for cloning the repository)

## Quick Setup (Recommended)

### Option 1: Automated Setup Script

Run the automated setup script that handles everything:

```bash
# Make setup script executable and run
chmod +x setup.sh
./setup.sh
```

This script will:
- ✅ Install Node.js dependencies
- ✅ Set up MySQL in Docker container
- ✅ Create and configure environment file
- ✅ Run database migrations
- ✅ Verify the setup

### Option 2: Using Make Commands

If you prefer using Make commands:

```bash
# Complete setup
make setup

# Or step by step
make install        # Install dependencies
make docker-start   # Start database
make dev           # Start development server
```

### Option 3: Docker Compose (Production)

For production or containerized development:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

### 3. Start MySQL Database

```bash
# Using Docker
docker run -d \
  --name pharmatrak-mysql \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=pharmatrak \
  -e MYSQL_USER=pharmatrak_user \
  -e MYSQL_PASSWORD=pharmatrak_password \
  -p 3306:3306 \
  mysql:8.0

# Wait for MySQL to be ready
sleep 30
```

### 4. Setup Database Schema

```bash
# Run main schema
docker exec -i pharmatrak-mysql mysql -u root -proot_password pharmatrak < database/schema.sql

# Run drug schema
docker exec -i pharmatrak-mysql mysql -u root -proot_password pharmatrak < database/drug_schema.sql
```

### 5. Start Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=pharmatrak_user
DB_PASSWORD=pharmatrak_password
DB_NAME=pharmatrak

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Optional: FDA API Configuration
FDA_API_TIMEOUT=10000
```

### Database Configuration

Default database settings:
- **Host**: localhost
- **Port**: 3306
- **Database**: pharmatrak
- **User**: pharmatrak_user
- **Password**: pharmatrak_password

## Available Scripts

### Application Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm test           # Run tests
```

### Database Management Scripts

```bash
./scripts/db-backup.sh     # Create database backup
./scripts/db-restore.sh    # Restore from backup
./scripts/db-reset.sh      # Reset database (DESTRUCTIVE)
```

### Docker Management Scripts

```bash
./scripts/docker-manage.sh status    # Show container status
./scripts/docker-manage.sh start     # Start container
./scripts/docker-manage.sh stop      # Stop container
./scripts/docker-manage.sh logs      # View logs
./scripts/docker-manage.sh connect   # Connect to MySQL
```

### Make Commands

```bash
make help              # Show all available commands
make setup             # Complete setup
make dev               # Start development server
make docker-start      # Start database
make backup            # Create backup
make test-fda          # Test FDA API connection
```

## Verification

After setup, verify everything is working:

### 1. Check Application Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### 2. Check Database Connection

```bash
./scripts/docker-manage.sh connect
```

### 3. Test FDA API Integration

```bash
curl "http://localhost:3000/api/drugs/search/fda?ndc=0069-2587-10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Port 3306 already in use**
   ```bash
   # Find and stop conflicting service
   sudo lsof -i :3306
   # Or change port in docker command
   ```

2. **Docker permission denied**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Restart terminal session
   ```

3. **Database connection failed**
   ```bash
   # Check container status
   docker ps
   # Check logs
   docker logs pharmatrak-mysql
   ```

4. **Missing dependencies**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

### Reset Everything

If you need to start completely fresh:

```bash
# Stop and remove containers
docker stop pharmatrak-mysql
docker rm pharmatrak-mysql

# Clean project
make clean

# Run setup again
./setup.sh
```

## Development Workflow

### Starting Development

```bash
# Quick start (database + app)
make quick-start

# Or manually
make docker-start  # Start database
make dev          # Start development server
```

### Database Operations

```bash
# Create backup before changes
make backup

# Reset database if needed
make reset

# Connect to database
make db-shell
```

### Testing

```bash
# Run tests
make test

# Check application health
make health

# Test FDA API
make test-fda
```

## Production Deployment

### Using Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

### Environment Setup

1. Set production environment variables
2. Use secure JWT secret
3. Configure proper database credentials
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)

## Support

If you encounter issues:

1. Check the logs: `make logs` or `docker logs pharmatrak-mysql`
2. Verify prerequisites are installed
3. Ensure Docker daemon is running
4. Check port availability (3000, 3306)
5. Review environment configuration

For additional help, refer to the main README.md file.