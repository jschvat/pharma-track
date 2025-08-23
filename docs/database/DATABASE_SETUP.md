# PharmaTraK Database Setup Guide

## 🚀 Complete Database Setup (Recommended)

### Single Command Setup

To set up the entire database with all tables, indexes, triggers, and sample data:

```bash
DB_HOST=localhost DB_USER=pharmatrak_user DB_PASSWORD=pharmatrak_password DB_NAME=pharmatrak node scripts/setup_complete_database.js
```

This script will:
- ✅ Create all core tables (users, stores, drugs, inventory)
- ✅ Apply all migrations (snapshots, triggers, indexes)
- ✅ Set up inventory snapshot history system
- ✅ Create performance optimization indexes
- ✅ Add database triggers for automation
- ✅ Create default admin user (admin@pharmatrak.com / Admin123!)
- ✅ Add sample stores
- ✅ Verify complete setup

### Alternative: Full Project Setup

Use the main setup script that includes Docker, dependencies, and database:

```bash
./setup.sh
```

This will:
- 🐳 Set up MySQL in Docker container
- 📦 Install Node.js dependencies  
- 🗄️ Run complete database setup
- ⚛️ Set up React frontend
- 👤 Create admin user
- ✅ Verify entire setup

## 📋 Manual Setup (Advanced Users)

If you prefer to set up components individually:

### 1. Core Schema
```bash
# Main tables and relationships
mysql -u pharmatrak_user -p pharmatrak < database/schema.sql

# Drug and inventory tables  
mysql -u pharmatrak_user -p pharmatrak < database/drug_schema.sql
```

### 2. Migrations (Execute in Order)
```bash
# Multi-store support
mysql -u pharmatrak_user -p pharmatrak < database/migrations/add_multi_store_support.sql

# Remove deprecated columns
mysql -u pharmatrak_user -p pharmatrak < database/migrations/remove_audit_columns.sql

# Inventory snapshot system
mysql -u pharmatrak_user -p pharmatrak < database/migrations/add_inventory_snapshot.sql

# Automation triggers
mysql -u pharmatrak_user -p pharmatrak < database/migrations/add_inventory_triggers.sql

# Performance indexes
mysql -u pharmatrak_user -p pharmatrak < database/migrations/add_performance_indexes.sql

# Snapshot history (maintains last 5 changes per drug)
mysql -u pharmatrak_user -p pharmatrak < database/migrations/add_inventory_snapshot_history_simple.sql

# God mode user support
mysql -u pharmatrak_user -p pharmatrak < database/migrations/add_god_mode_user.sql
```

### 3. Create Admin User
```bash
node scripts/createAdmin.js
```

## 🗂️ Database Structure

### Core Tables
- **`users`** - System users with role-based access
- **`stores`** - Pharmacy locations
- **`drugs`** - Drug master data with FDA integration
- **`store_inventory`** - Current inventory per store/drug
- **`inventory_audit_log`** - All inventory transactions
- **`store_inventory_snapshot`** - Current quantity snapshots
- **`store_inventory_snapshot_history`** - Last 5 quantity changes per drug

### Key Features
- **Real-time Inventory Tracking**: Automatic quantity updates via triggers
- **Audit Trail**: Complete transaction history with user attribution
- **Multi-Store Support**: Separate inventory per pharmacy location
- **Performance Optimized**: Comprehensive indexing strategy
- **Snapshot History**: Rolling history of last 5 quantity changes

## 📊 Verification

After setup, verify your database:

```bash
# Check table creation
mysql -u pharmatrak_user -p -e "USE pharmatrak; SHOW TABLES;"

# Check sample data
mysql -u pharmatrak_user -p -e "USE pharmatrak; SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM stores;"

# Test admin login
mysql -u pharmatrak_user -p -e "USE pharmatrak; SELECT name, email, role FROM users WHERE email='admin@pharmatrak.com';"
```

## 🔐 Default Credentials

**Admin User:**
- Email: `admin@pharmatrak.com`
- Password: `Admin123!`
- Role: `god_mode` (full system access)

**Database:**
- Host: `localhost`
- Port: `3306`
- Database: `pharmatrak`
- User: `pharmatrak_user`
- Password: `pharmatrak_password`

## 🔧 Troubleshooting

### Common Issues

**1. Connection Failed**
```bash
# Check if MySQL is running
docker ps | grep pharmatrak-mysql

# Start MySQL container
docker start pharmatrak-mysql
```

**2. Permission Denied**
```bash
# Grant necessary permissions
mysql -u root -p -e "GRANT ALL PRIVILEGES ON pharmatrak.* TO 'pharmatrak_user'@'localhost';"
```

**3. Migration Errors**
```bash
# Check existing tables before running migrations
mysql -u pharmatrak_user -p -e "USE pharmatrak; SHOW TABLES;"

# Some migrations may fail if already applied (this is normal)
```

**4. Admin User Issues**
```bash
# Reset admin password
node -e "
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost', user: 'pharmatrak_user', 
    password: 'pharmatrak_password', database: 'pharmatrak'
  });
  const hash = await bcrypt.hash('Admin123!', 12);
  await connection.execute('UPDATE users SET password = ? WHERE email = ?', 
    [hash, 'admin@pharmatrak.com']);
  console.log('Admin password reset to: Admin123!');
  await connection.end();
})();
"
```

## 📚 Additional Resources

- **API Documentation**: See `/api/health` for endpoint status
- **Frontend Setup**: See `frontend/README.md`
- **Development Guide**: See `DEVELOPMENT.md`
- **Docker Setup**: See `docker/README.md`

## 🚨 Production Notes

**Before deploying to production:**

1. **Change Default Passwords**: Update all default credentials
2. **Secure Database**: Use strong passwords and restrict access
3. **Backup Strategy**: Implement regular database backups
4. **Environment Variables**: Use environment-specific configuration
5. **SSL/TLS**: Enable encrypted connections
6. **Monitoring**: Set up database performance monitoring

## 📈 Performance Optimization

The setup includes comprehensive performance optimizations:

- **47+ Indexes**: Covering all common query patterns
- **Triggers**: Automatic snapshot updates for real-time data
- **Partitioning Ready**: Schema designed for future partitioning
- **Query Optimization**: Efficient joins and filtered queries

For high-volume environments, consider additional optimizations like read replicas, caching layers, and database connection pooling.