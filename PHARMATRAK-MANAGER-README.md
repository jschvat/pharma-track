# 🏥 PharmaTraK Database Manager 2.0

A unified, interactive command-line tool that consolidates all PharmaTraK database management operations into a single, user-friendly interface.

## Features

### 🗄️ **Database Setup & Schema Creation**
- **Complete Database Setup**: Create database, schema, constraints, indexes, and sample data
- **Schema Only**: Create just the database structure without sample data
- **Sample Stores**: Add realistic pharmacy store data
- **Admin User**: Create system administrator account
- **Database Reset**: Clean slate database recreation (with safety prompts)

### 🧪 **Test Data Management**
- **Basic Test Data**: 10 common drugs with 50 realistic transactions
- **Comprehensive Test Data**: 50+ drugs with 200+ audit log entries
- **Sample Prescription Data**: Realistic prescription fill scenarios
- **Data Cleanup**: Remove test data while preserving schema

### 🔄 **Database Migrations & Updates**
- **Migration Runner**: Apply database schema updates
- **Version Control**: Track applied migrations
- **Rollback Support**: Undo problematic migrations
- **Constraint Management**: Update CHECK constraints and foreign keys

### 🔍 **System Diagnostics & Verification**
- **Health Checks**: Verify database connectivity and table integrity
- **Constraint Testing**: Validate all database constraints work properly
- **Performance Analysis**: Check query performance and index usage
- **Data Integrity**: Verify referential integrity across tables

### 💾 **Backup & Restore Operations**
- **Full Database Backup**: Complete database dump with structure and data
- **Schema-Only Backup**: Structure without data
- **Incremental Backup**: Changes since last backup
- **Restore Operations**: Restore from backup files with verification

### 👥 **User & Store Management**
- **User Creation**: Add new users with proper roles and permissions
- **Store Management**: Add, modify, and configure pharmacy stores
- **Role Assignment**: Manage admin, user, and god_mode permissions
- **Bulk Operations**: Import users and stores from CSV files

### ⚡ **Performance & Optimization**
- **Index Analysis**: Review and optimize database indexes
- **Query Optimization**: Identify slow queries and suggest improvements
- **Storage Analysis**: Database size and growth analytics
- **Performance Tuning**: Optimize MySQL configuration

### ℹ️ **System Information**
- **Database Statistics**: Table counts, sizes, and relationships
- **Version Information**: MySQL version and PharmaTraK schema version
- **Connection Details**: Current database connection parameters
- **System Health**: Overall system status and recommendations

## Installation & Setup

### Prerequisites
```bash
# Required Node.js packages (already included in package.json)
npm install mysql2 bcryptjs readline

# Required environment variables
export DB_HOST=localhost
export DB_USER=pharmatrak_user
export DB_PASSWORD=pharmatrak_password
export DB_NAME=pharmatrak
```

### Usage
```bash
# Make executable
chmod +x pharmatrak-manager.js

# Run the interactive manager
node pharmatrak-manager.js

# Or run directly if executable
./pharmatrak-manager.js
```

## Quick Start Guide

### 1. **First Time Setup**
```bash
# Start the manager
node pharmatrak-manager.js

# Select: 1️⃣ Database Setup & Schema Creation
# Then: 1️⃣ Create Database & Complete Setup
```
This will:
- Create the database if it doesn't exist
- Set up all tables with proper constraints
- Add performance indexes
- Create sample stores
- Create admin user (admin@pharmatrak.com / Admin123!)

### 2. **Add Test Data**
```bash
# Select: 2️⃣ Test Data Management
# Then: 1️⃣ Generate Basic Test Data (recommended)
# Or: 2️⃣ Generate Comprehensive Test Data (for extensive testing)
```

### 3. **Verify Setup**
```bash
# Select: 8️⃣ System Information
```
This shows database statistics and confirms everything is working.

## Advanced Features

### Database Constraints
All constraints are now descriptively named:
- `chk_store_state_valid_us` - Validates US state codes
- `chk_store_dea_registration_format` - Validates DEA number format
- `chk_user_email_valid_format` - Validates email addresses
- And many more...

### Transaction Types
Supports all valid inventory transaction types:
- `prescription_fill` - Dispensing medications to patients
- `return_to_stock` - Returned medications
- `expire` - Expired medication disposal
- `audit` - Physical inventory adjustments
- `shipment_received` - New inventory from suppliers
- `initial_inventory` - Starting inventory quantities

### Data Generation
- **Realistic NDC Numbers**: Uses valid 11-digit NDC format
- **Pharmaceutical Data**: Real drug names, manufacturers, and dosage forms
- **Transaction History**: Realistic prescription fills and inventory movements
- **Multi-Store Support**: Data across multiple pharmacy locations

## Safety Features

### Data Protection
- **Confirmation Prompts**: All destructive operations require explicit confirmation
- **Backup Recommendations**: Suggests backups before major operations
- **Rollback Support**: Most operations can be undone
- **Transaction Safety**: Database transactions ensure data integrity

### Error Handling
- **Graceful Failures**: Operations fail safely without corrupting data
- **Detailed Error Messages**: Clear explanations of what went wrong
- **Recovery Suggestions**: Guidance on how to fix common issues
- **Connection Recovery**: Automatic reconnection on database timeouts

## Integration with Existing Scripts

This manager replaces and improves upon these individual scripts:
- `setup_complete_database.js` → **Database Setup & Schema Creation**
- `addTestData.js` → **Test Data Management**
- `generateFreshTestData.js` → **Comprehensive Test Data**
- `rename_constraints_migration.js` → **Database Migrations**
- Various diagnostic scripts → **System Diagnostics**

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | Database host |
| `DB_USER` | pharmatrak_user | Database username |
| `DB_PASSWORD` | pharmatrak_password | Database password |
| `DB_NAME` | pharmatrak | Database name |

## Troubleshooting

### Common Issues

**Connection Failed**
```
Error: Database connection failed: Access denied
```
- Check environment variables are set correctly
- Verify MySQL is running
- Confirm user has proper permissions

**Table Already Exists**
```
Warning: Table stores already exists
```
- This is normal - the manager skips existing tables
- Use "Database Reset" if you need a clean slate

**Constraint Violations**
```
Error: Check constraint 'chk_store_state_valid_us' is violated
```
- The manager validates all data before insertion
- Check that store states are valid 2-letter US codes
- DEA numbers must be 9 characters (2 letters + 7 digits)

### Getting Help

1. **System Information** (Option 8) - Shows current database state
2. **Health Checks** - Validates database integrity
3. **Error Messages** - Read carefully, they contain specific guidance
4. **Log Output** - All operations are logged with timestamps

## Development

### Adding New Features
The manager is designed to be extensible:

```javascript
// Add new menu option
async showNewFeatureMenu() {
  console.clear();
  this.log('🆕 NEW FEATURE', 'green');
  // ... menu implementation
}

// Add to main menu handler
case 'N':
  await this.showNewFeatureMenu();
  break;
```

### Testing
```bash
# Test basic functionality
echo "8" | node pharmatrak-manager.js  # System info
echo "9" | node pharmatrak-manager.js  # Exit

# Test database operations
echo -e "1\n6\n9" | node pharmatrak-manager.js  # Setup menu, back, exit
```

---

## License
Part of the PharmaTraK project - see main project license.

## Support
For issues or feature requests, please use the main PharmaTraK issue tracker.