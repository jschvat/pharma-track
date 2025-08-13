# Utilities Directory

This directory contains utility scripts and tools for development, debugging, and system maintenance.

## Structure

- **`check/`** - System check and verification scripts
- **`debug/`** - Debugging and diagnostic tools

## Check Utilities (`check/`)

- `check_demo_user.js` - Verify demo user account status
- `check_demo_via_api.js` - Test demo user via API calls
- `check_stores.js` - Verify store data integrity

## Debug Utilities (`debug/`)

- `check_admin_password.js` - Debug admin password issues
- `check_existing_users.js` - Debug user account issues
- `check_stores_table.js` - Debug store table structure
- `check_user_table.js` - Debug user table structure
- `check_users.js` - Debug user-related issues
- `debug_audit_400.js` - Debug audit API 400 errors

## Usage

Each utility can be run directly with Node.js:

```bash
# Check utilities
node utilities/check/check_demo_user.js
node utilities/check/check_stores.js

# Debug utilities  
node utilities/debug/check_admin_password.js
node utilities/debug/debug_audit_400.js
```

## Purpose

These utilities help with:
- System health checks
- Database integrity verification
- User account troubleshooting
- API debugging
- Development workflow support