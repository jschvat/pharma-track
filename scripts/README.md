# PharmaTraK Scripts Directory

This directory contains utility scripts for database management, testing, deployment, and system administration.

## Database Scripts

### Database Management
- **`createAdmin.js`** - Creates admin users in the system
- **`addTestData.js`** - Adds test data for development and testing
- **`generateFreshTestData.js`** - Generates fresh test data with realistic pharmacy data

### Database Maintenance  
- **`db-backup.sh`** - Creates database backups with timestamps
- **`db-reset.sh`** - Resets database to clean state
- **`db-restore.sh`** - Restores database from backup files

## System Debugging Scripts

### User Management Debugging
- **`check_admin_password.js`** - Verifies admin user passwords and authentication
- **`check_existing_users.js`** - Lists and validates existing users in the system
- **`check_user_table.js`** - Analyzes user table structure and constraints
- **`check_users.js`** - Comprehensive user data validation and checking

### System Debugging
- **`debug_audit_400.js`** - Debugs 400 errors in audit functionality
- **`restart_server.js`** - Gracefully restarts the application server

## Docker & Deployment Scripts

### Docker Management
- **`docker-manage.sh`** - Manages Docker containers and services
- **`setup-docker-context.sh`** - Sets up Docker context for remote deployment

## Usage Examples

### Database Operations
```bash
# Create admin user
node scripts/createAdmin.js

# Add test data
node scripts/addTestData.js

# Backup database
./scripts/db-backup.sh

# Reset database
./scripts/db-reset.sh
```

### User Management
```bash
# Check admin password
node scripts/check_admin_password.js

# List existing users
node scripts/check_existing_users.js

# Validate user table
node scripts/check_user_table.js
```

### System Debugging
```bash
# Debug audit errors
node scripts/debug_audit_400.js

# Restart server gracefully
node scripts/restart_server.js
```

### Docker Operations
```bash
# Manage Docker containers
./scripts/docker-manage.sh [start|stop|restart|logs]

# Setup Docker context
./scripts/setup-docker-context.sh
```

## Environment Requirements

Most scripts require environment variables to be set:
```env
DB_HOST=localhost
DB_USER=your_db_user  
DB_PASSWORD=your_db_password
DB_NAME=pharmatrak
PORT=3001
```

## Security Notes

- Database scripts contain sensitive operations - use with caution in production
- Always backup before running reset or restore operations
- User management scripts should only be run by authorized administrators
- Debug scripts may output sensitive information - review logs carefully

## Script Categories

### Production Safe ✅
- `check_existing_users.js`
- `check_user_table.js`
- `check_users.js`
- `db-backup.sh`

### Development Only ⚠️  
- `addTestData.js`
- `generateFreshTestData.js`
- `debug_audit_400.js`
- `db-reset.sh`

### Administrative 🔐
- `createAdmin.js`
- `check_admin_password.js`
- `restart_server.js`
- `db-restore.sh`

## Adding New Scripts

When adding new scripts to this directory:

1. **Follow naming convention**: Use descriptive names with underscores or hyphens
2. **Add documentation**: Include header comments explaining purpose and usage
3. **Handle errors gracefully**: Include proper error handling and logging
4. **Use environment variables**: Don't hardcode sensitive values
5. **Update this README**: Document the new script's purpose and usage