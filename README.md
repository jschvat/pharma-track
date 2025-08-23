# PharmaTraK - Pharmacy Inventory Management System

## 🎯 Overview
PharmaTraK is a comprehensive pharmacy inventory management system built with React (frontend) and Node.js/Express (backend). Features include inventory tracking, user management, FDA drug integration, audit logging, and role-based access control.

## 🏗️ Architecture
- **Frontend**: React with Bootstrap UI and real-time debug logging
- **Backend**: Node.js/Express RESTful API with JWT authentication  
- **Database**: MySQL with comprehensive audit trails
- **Integration**: OpenFDA API for drug information
- **Testing**: Comprehensive test suites for all components

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based authentication with role-based access control
- Password hashing with bcrypt (12 rounds)
- CORS configuration for secure cross-origin requests
- Input validation and SQL injection prevention

### 📦 Inventory Management
- Real-time inventory tracking across multiple stores
- Low stock and expiration alerts
- Batch/lot number tracking with cost analysis
- Comprehensive transaction history with audit trails

### 👥 User Management
- Role-based access: Admin, Store Manager, Staff
- Multi-store user access control
- User activity tracking and session management

### 💊 FDA Integration
- OpenFDA API integration for drug information
- NDC validation and lookup
- Automatic drug database population
- Intelligent caching for performance

### 📊 Reporting & Analytics
- Inventory statistics and trends
- NDC audit reports with PDF generation
- Low stock and expiration reports
- User activity and transaction reports

### 🔧 Development Tools
- Comprehensive debug logging system
- Component lifecycle monitoring
- API call tracking with timing
- Real-time error reporting

## 🗂️ Project Structure

```
pharmatrak/
├── 📁 frontend/                 # React frontend application
│   ├── src/components/          # React components
│   │   ├── common/              # Reusable UI components
│   │   ├── Dashboard.js         # Main dashboard
│   │   ├── Inventory.js         # Inventory management
│   │   └── UserManagement.js    # User administration
│   ├── src/contexts/            # React contexts (Auth, Theme, Debug)
│   ├── src/services/            # API communication services
│   └── src/utils/               # Utility functions and helpers
├── 📁 routes/                   # Express API routes
├── 📁 models/                   # Database models & business logic
├── 📁 middleware/               # Express middleware functions
├── 📁 database/                 # SQL schemas and migrations
├── 📁 services/                 # Business services (PDF, etc.)
├── 📁 tests/                    # Comprehensive test suites
├── 📁 documentation/           # 📚 Comprehensive documentation hub
├── 📁 scripts/                  # Setup and utility scripts
└── server.js                    # Main Express server
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ 
- **MySQL** 8.0+
- **npm** or **yarn**

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd pharmatrak
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE pharmatrak;"
   
   # Run schema
   mysql -u root -p pharmatrak < database/schema.sql
   
   # Create admin user
   mysql -u root -p pharmatrak < database/seed_admin.sql
   ```

3. **Environment Configuration**
   ```bash
   # Backend environment
   export DB_HOST=localhost
   export DB_USER=pharmatrak_user
   export DB_PASSWORD=pharmatrak_password
   export DB_NAME=pharmatrak
   export JWT_SECRET=your-secret-key
   ```

4. **Start Services**
   ```bash
   # Start backend (Terminal 1)
   node server.js
   
   # Start frontend (Terminal 2)  
   cd frontend && npm start
   ```

5. **Access Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3001
   - **Debug Panel**: http://localhost:3000/debug/logging

### Default Credentials
- **Email**: `admin@pharmatrak.com`
- **Password**: `Admin123!`

## 🌐 API Documentation

### Authentication
```bash
# Login
POST /api/auth/login
{
  "email": "admin@pharmatrak.com",
  "password": "Admin123!"
}

# Get current user
GET /api/auth/me
Authorization: Bearer <token>
```

### Key Endpoints
- **Users**: `/api/users/` - User management (CRUD)
- **Stores**: `/api/stores/` - Store management
- **Inventory**: `/api/inventory/store/:id` - Inventory operations
- **Drugs**: `/api/drugs/` - Drug information and FDA search
- **Audit**: `/api/audit/` - Transaction history and reports

**📖 Complete API Documentation**: See [documentation/api/API_DOCUMENTATION.md](./documentation/api/API_DOCUMENTATION.md)

## 🧩 Component Architecture

### Reusable Components
- **FormField**: Universal form input component
- **FormModal**: Standardized modal dialogs  
- **DataTable**: Advanced tables with sorting/pagination
- **ActionButtonGroup**: Consistent button layouts
- **SearchFilterBar**: Search and filter interfaces

### Page Components
- **Dashboard**: Overview with key metrics and alerts
- **Inventory**: Comprehensive inventory management
- **UserManagement**: User administration interface
- **BrowseDrugs**: Drug catalog and FDA search
- **AdminSettings**: System configuration

**📖 Frontend Documentation**: See [frontend/README.md](./frontend/README.md)

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts with role-based permissions
- **stores**: Pharmacy store information and settings
- **drugs**: Master drug database with FDA integration
- **store_inventory**: Inventory levels with batch tracking
- **inventory_audit_log**: Complete transaction history

### Key Features
- **Foreign Key Constraints**: Data integrity enforcement
- **CHECK Constraints**: Format validation at database level
- **Full-Text Search**: Optimized drug name searching
- **Audit Triggers**: Automatic transaction logging

**📖 Database Documentation**: See [documentation/backend/BACKEND_README.md](./documentation/backend/BACKEND_README.md)

## 🧪 Testing

### Test Suites
```bash
# Frontend tests
cd frontend && npm test

# Backend API tests  
node tests/test-api.js

# Integration tests
node tests/integration/test_admin_stores.js

# FDA integration tests
node tests/manual-fda-test.js
```

### Test Coverage
- **Frontend**: Component testing with React Testing Library
- **Backend**: API endpoint testing with comprehensive scenarios
- **Integration**: End-to-end workflow testing
- **Manual**: FDA API integration testing

## 🔧 Development Tools

### Debug Logging System
- **Access**: Visit `/debug/logging` for interactive debug panel
- **Features**: API tracking, component lifecycle, user interactions
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+D` - Toggle debug panel
  - `Ctrl+Shift+L` - Export logs to JSON
  - `Ctrl+Shift+C` - Clear logs

### Development Commands
```bash
# Backend development
npm run dev                    # Start with nodemon
npm run lint                   # ESLint code checking
npm run test                   # Run test suites

# Frontend development  
cd frontend
npm start                      # Development server
npm run build                  # Production build
npm test                       # Component tests
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with configurable expiration
- **Role-Based Access**: Admin, Store Manager, Staff permissions
- **Password Security**: bcrypt hashing with salt rounds 12
- **Session Management**: Automatic token refresh and logout

### Data Protection
- **SQL Injection Prevention**: Parameterized queries throughout
- **Input Validation**: Comprehensive server-side validation
- **CORS Configuration**: Secure cross-origin request handling
- **Error Handling**: Secure error messages without data leakage

## 📊 Performance & Monitoring

### Database Optimization
- **Connection Pooling**: MySQL2 connection pool management
- **Query Optimization**: Efficient JOIN queries with proper indexing
- **Caching Strategy**: FDA API response caching with TTL

### Monitoring
- **Health Checks**: System status endpoints
- **Request Logging**: Comprehensive API request tracking
- **Error Tracking**: Centralized error logging and reporting
- **Performance Metrics**: Response time monitoring

## 🚀 Deployment

### Production Setup
```bash
# Build frontend
cd frontend && npm run build

# Set production environment
export NODE_ENV=production

# Start with PM2 (recommended)
pm2 start server.js --name pharmatrak

# Or start directly
npm run start
```

### Docker Deployment
```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**📖 Deployment Guide**: See [documentation/deployment/](./documentation/deployment/)

## 🛠️ Maintenance

### Database Maintenance
```bash
# Run migrations
node scripts/run_migration.js

# Backup database
bash scripts/db-backup.sh

# Restore database  
bash scripts/db-restore.sh
```

### System Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit --audit-level high

# Test after updates
npm test
```

## 📚 Documentation

### 🏠 Main Documentation Hub
**[📚 documentation/INDEX.md](./documentation/INDEX.md)** - **Start here!** Complete documentation index with organized categories

### Key Documentation
- **[🔧 Error Repairs Log](./documentation/guides/error-repairs-log.html)**: Recent fixes and solutions
- **[⚙️ Setup Guide](./documentation/setup/SETUP.md)**: Installation and setup instructions  
- **[🔌 API Reference](./documentation/api/API_DOCUMENTATION.md)**: Complete API documentation
- **[🖥️ Backend Architecture](./documentation/backend/BACKEND_README.md)**: Server architecture guide
- **[🎨 Frontend Components](./documentation/frontend/FRONTEND_README.md)**: UI component library
- **[🗄️ Database Schema](./documentation/database/database-schema.md)**: Database structure guide

### Component Documentation
- Individual components include JSDoc headers
- Usage examples in component files
- Props documentation for all reusable components

## 🤝 Contributing

### Development Workflow
1. **Code Standards**: ESLint + Prettier configuration
2. **Testing**: Add tests for all new features
3. **Documentation**: Update relevant documentation
4. **Security**: Follow security best practices

### Code Organization
- **Naming**: PascalCase for components, camelCase for utilities
- **Imports**: Organized by React, third-party, internal
- **Structure**: Consistent component and function organization

## 🚨 Troubleshooting

### Common Issues
- **Port Conflicts**: Backend (3001), Frontend (3000)
- **Database Connection**: Check MySQL credentials and service
- **Authentication**: Clear localStorage and re-login
- **CORS Errors**: Verify origin configuration

### Debug Tools
- **Frontend Debug Panel**: `/debug/logging`
- **Browser DevTools**: Network tab for API issues
- **Server Logs**: Console output for backend errors
- **Database Logs**: MySQL error logs for data issues

### Performance Issues
- **Slow Loading**: Check network tab and API response times
- **High Memory**: Monitor component re-renders and memory leaks
- **Database**: Review query performance and indexing

## 📄 License
MIT License - See LICENSE file for details

## 👥 Support
- **Issues**: GitHub Issues for bug reports
- **Documentation**: Check [documentation/](./documentation/) directory for detailed guides
- **API Reference**: See [documentation/api/API_DOCUMENTATION.md](./documentation/api/API_DOCUMENTATION.md) for endpoint details

---

**Last Updated**: August 2025  
**Version**: 1.0.0  
**Maintainer**: PharmaTraK Development Team