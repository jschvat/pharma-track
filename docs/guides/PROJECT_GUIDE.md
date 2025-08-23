# PharmaTraK - Project Navigation Guide

## 📖 Overview
PharmaTraK is a comprehensive pharmacy inventory management system built with React (frontend) and Node.js/Express (backend), using MySQL for data storage.

## 🗂️ Project Structure

```
pharmatrak/
├── 📁 frontend/                 # React frontend application
├── 📁 backend files/           # Node.js/Express backend
├── 📁 database/               # SQL schemas and migrations  
├── 📁 docs/                   # Documentation
├── 📁 tests/                  # Test files
└── 📁 scripts/                # Setup and utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- npm or yarn

### Setup
1. **Database Setup**: `cd database && mysql < schema.sql`
2. **Backend**: `npm install && node server.js`
3. **Frontend**: `cd frontend && npm install && npm start`
4. **Access**: Navigate to `http://localhost:3000`

### Default Credentials
- **Email**: `admin@pharmatrak.com`
- **Password**: `Admin123!`

## 📂 Directory Guide

### Frontend (`/frontend/`)
- **`src/components/`** - React components
  - **`common/`** - Reusable UI components
  - **Individual files** - Page-specific components
- **`src/contexts/`** - React contexts (Auth, Theme, Debug)
- **`src/services/`** - API communication
- **`src/utils/`** - Utility functions and helpers

### Backend (Root directory)
- **`routes/`** - API endpoint definitions
- **`models/`** - Database models and business logic
- **`middleware/`** - Express middleware functions
- **`services/`** - Business services

### Database (`/database/`)
- **`schema.sql`** - Main database schema
- **`migrations/`** - Database migration scripts
- **`*.sql`** - Additional schema files

### Documentation (`/docs/`)
- **`frontend/`** - Frontend-specific documentation
- **`deployment/`** - Deployment guides
- **`testing/`** - Test documentation

## 🔧 Development Tools

### Debug System
- **Location**: `http://localhost:3000/debug/logging`
- **Shortcuts**: 
  - `Ctrl+Shift+D` - Debug panel
  - `Ctrl+Shift+L` - Export logs
  - `Ctrl+Shift+C` - Clear logs

### Testing
- **Frontend Tests**: `cd frontend && npm test`
- **API Tests**: `node tests/test-api.js`
- **Integration Tests**: Located in `tests/integration/`

## 📋 Key Features

### Core Functionality
- **Inventory Management** - Track pharmaceutical inventory
- **User Management** - Role-based access control
- **Audit Logging** - Comprehensive transaction tracking
- **FDA Integration** - Drug information lookup
- **Multi-Store Support** - Manage multiple pharmacy locations

### Administrative Features
- **God Mode Panel** - Advanced administrative tools
- **Store Settings** - Configure individual stores
- **User Roles** - Admin, store manager, staff levels
- **Reporting** - NDC audit reports and analytics

## 🛠️ Component Architecture

### Reusable Components (`frontend/src/components/common/`)
- **FormField** - Universal form input component
- **FormModal** - Standardized modal dialogs
- **DataTable** - Advanced table with sorting/pagination
- **ActionButtonGroup** - Consistent button layouts
- **SearchFilterBar** - Search and filter interface
- **CardHeader** - Standardized card headers

### Page Components
- **Dashboard** - Main overview interface
- **Inventory** - Inventory management
- **UserManagement** - User administration
- **BrowseDrugs** - Drug catalog browsing
- **AdminSettings** - System configuration

## 🔐 Security & Authentication

### Authentication Flow
1. Login via `/api/auth/login`
2. JWT token stored in localStorage
3. Token validated on protected routes
4. Role-based access control

### User Roles
- **admin** - Full system access
- **store_manager** - Store-level management
- **staff** - Basic inventory operations

## 🌐 API Structure

### Main Endpoints
- **`/api/auth/*`** - Authentication
- **`/api/inventory/*`** - Inventory operations
- **`/api/users/*`** - User management
- **`/api/stores/*`** - Store management
- **`/api/drugs/*`** - Drug information
- **`/api/audit/*`** - Audit logging

### API Documentation
Detailed API documentation available in `docs/api/` (to be created)

## 📊 Database Schema

### Core Tables
- **users** - User accounts and roles
- **stores** - Pharmacy store information
- **drugs** - Drug master data
- **store_inventory** - Inventory levels per store
- **inventory_audit_log** - Transaction history

### Relationships
- Users can access multiple stores
- Inventory is store-specific
- All transactions are audited

## 🔄 Development Workflow

### Making Changes
1. **Frontend**: Edit files in `frontend/src/`
2. **Backend**: Edit routes in `routes/` or models in `models/`
3. **Database**: Create migration in `database/migrations/`
4. **Testing**: Add tests in appropriate `tests/` subdirectory

### Code Style
- **Frontend**: React functional components with hooks
- **Backend**: Express.js with async/await
- **Database**: Prepared statements for security
- **Documentation**: JSDoc comments for functions

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Backend (3001), Frontend (3000)
2. **Database connection**: Check MySQL service and credentials
3. **CORS errors**: Verify allowed origins in server.js
4. **Authentication**: Clear localStorage and re-login

### Debug Modes
- **Frontend**: Enable debug logging at `/debug/logging`
- **Backend**: Check server logs for detailed output
- **Database**: Review query logs in MySQL

## 📚 Additional Resources

### File-Specific Documentation
- **Frontend Components**: See individual component JSDoc comments
- **API Routes**: Check route files for endpoint documentation
- **Database**: Review schema comments in SQL files

### External Documentation
- **React**: https://reactjs.org/docs
- **Express.js**: https://expressjs.com/
- **MySQL**: https://dev.mysql.com/doc/
- **Bootstrap**: https://getbootstrap.com/docs/

---

**Last Updated**: August 2025  
**Version**: 1.0  
**Maintainer**: PharmaTraK Development Team