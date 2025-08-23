# PharmaTraK Backend

## 🎯 Overview
Node.js/Express backend for the PharmaTraK pharmacy inventory management system. Features RESTful APIs, MySQL database integration, JWT authentication, and comprehensive audit logging.

## 🏗️ Architecture

### Directory Structure
```
pharmatrak/                   # Root directory
├── server.js                 # Main Express server
├── config/
│   └── database.js           # Database configuration
├── routes/                   # API route definitions
│   ├── auth.js               # Authentication endpoints
│   ├── inventory.js          # Inventory management
│   ├── users.js              # User management
│   ├── stores.js             # Store management
│   ├── drugs.js              # Drug information
│   └── auditLog.js           # Audit logging
├── models/                   # Database models & business logic
│   ├── User.js               # User model
│   ├── Store.js              # Store model
│   ├── Drug.js               # Drug model
│   ├── StoreInventory.js     # Inventory model
│   └── InventoryAuditLog.js  # Audit model
├── middleware/               # Express middleware
│   ├── auth.js               # Authentication middleware
│   ├── validation.js         # Input validation
│   └── errorHandler.js       # Error handling
└── services/                 # Business services
    └── pdfReportService.js   # PDF generation
```

## 🔐 Authentication & Authorization

### JWT Authentication
- **Login**: `POST /api/auth/login`
- **Token Verification**: `GET /api/auth/me`
- **Token Storage**: Bearer token in Authorization header

### User Roles
- **admin**: Full system access
- **store_manager**: Store-level management
- **staff**: Basic inventory operations

### Middleware
```javascript
// Authentication middleware
const authenticateToken = require('./middleware/auth');

// Role-based authorization
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

## 🗄️ Database Models

### User Model (`models/User.js`)
```javascript
class User {
  static async create(userData) {
    // Creates new user with hashed password
  }
  
  static async findByEmail(email) {
    // Finds user by email address
  }
  
  static async updatePassword(userId, newPassword) {
    // Updates user password with hashing
  }
}
```

### Store Model (`models/Store.js`)
```javascript
class Store {
  static async getAll() {
    // Returns all stores
  }
  
  static async getById(storeId) {
    // Returns specific store details
  }
  
  static async getStats() {
    // Returns store statistics
  }
}
```

### Inventory Model (`models/StoreInventory.js`)
```javascript
class StoreInventory {
  static async getByStore(storeId, filters = {}) {
    // Returns inventory for specific store
  }
  
  static async addItem(storeId, drugId, quantity) {
    // Adds inventory item with audit trail
  }
  
  static async updateQuantity(itemId, newQuantity, reason) {
    // Updates quantity with audit logging
  }
  
  static async getLowStock(storeId, threshold = 10) {
    // Returns items below threshold
  }
  
  static async getExpiring(storeId, days = 30) {
    // Returns items expiring within days
  }
}
```

## 🛣️ API Routes

### Authentication Routes (`/api/auth/`)
- **`POST /login`** - User authentication
- **`GET /me`** - Get current user info
- **`POST /logout`** - User logout (client-side token removal)

### User Management (`/api/users/`)
- **`GET /`** - List all users (admin only)
- **`POST /`** - Create new user (admin only)
- **`PUT /:id`** - Update user (admin only)
- **`DELETE /:id`** - Delete user (admin only)

### Store Management (`/api/stores/`)
- **`GET /`** - List all stores
- **`GET /:id`** - Get store details
- **`GET /stats`** - Get store statistics (admin only)
- **`POST /`** - Create new store (admin only)

### Inventory Management (`/api/inventory/`)
- **`GET /store/:storeId`** - Get store inventory
- **`POST /store/:storeId/items`** - Add inventory item
- **`PUT /items/:itemId`** - Update inventory item
- **`DELETE /items/:itemId`** - Remove inventory item
- **`GET /store/:storeId/low-stock`** - Get low stock items
- **`GET /store/:storeId/expiring`** - Get expiring items
- **`GET /store/:storeId/stats`** - Get inventory statistics

### Drug Information (`/api/drugs/`)
- **`GET /`** - Search drugs
- **`GET /:id`** - Get drug details
- **`POST /search`** - FDA drug search
- **`GET /stats/overview`** - Drug statistics

### Audit Logging (`/api/audit/`)
- **`GET /store/:storeId`** - Get store audit trail
- **`GET /drug/:drugId`** - Get drug audit trail
- **`GET /recent`** - Get recent audit entries
- **`POST /ndc-report`** - Generate NDC audit report

## 🔍 Input Validation

### Validation Middleware (`middleware/validation.js`)
```javascript
const validateUser = {
  create: [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    body('role').isIn(['admin', 'store_manager', 'staff'])
  ],
  update: [
    // Update validation rules
  ]
};
```

### Usage in Routes
```javascript
app.post('/api/users', 
  authenticateToken,
  requireRole(['admin']),
  validateUser.create,
  handleValidationErrors,
  userController.create
);
```

## 📊 Database Schema

### Core Tables
```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'store_manager', 'staff') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores table  
CREATE TABLE stores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store inventory table
CREATE TABLE store_inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  store_id INT NOT NULL,
  drug_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  expiration_date DATE,
  batch_number VARCHAR(50),
  cost_per_unit DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (drug_id) REFERENCES drugs(id)
);

-- Audit log table
CREATE TABLE inventory_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  store_id INT NOT NULL,
  drug_id INT NOT NULL,
  user_id INT NOT NULL,
  transaction_type ENUM('add', 'remove', 'adjust', 'expire', 'transfer') NOT NULL,
  quantity_change INT NOT NULL,
  previous_quantity INT,
  new_quantity INT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (drug_id) REFERENCES drugs(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🛡️ Security Features

### Password Security
- **Hashing**: bcrypt with salt rounds 12
- **Validation**: Minimum 8 characters, complexity requirements
- **Storage**: Never store plain text passwords

### SQL Injection Prevention
- **Prepared Statements**: All queries use parameterized statements
- **Input Sanitization**: Validation middleware cleans inputs
- **ORM Pattern**: Models abstract database access

### CORS Configuration
```javascript
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

## 📝 Audit Logging

### Automatic Audit Trail
All inventory changes are automatically logged with:
- **User ID**: Who made the change
- **Timestamp**: When the change occurred
- **Transaction Type**: add, remove, adjust, expire, transfer
- **Quantity Changes**: Previous and new quantities
- **Reason**: User-provided reason for change

### Audit Model Usage
```javascript
// Log inventory transaction
await InventoryAuditLog.logTransaction({
  storeId: req.params.storeId,
  drugId: drugId,
  userId: req.user.id,
  transactionType: 'add',
  quantityChange: quantity,
  previousQuantity: 0,
  newQuantity: quantity,
  reason: 'Initial stock'
});
```

## 🔧 Error Handling

### Global Error Handler (`middleware/errorHandler.js`)
```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.details });
  }
  
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};
```

### Custom Error Classes
```javascript
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}
```

## 🧪 Testing

### Test Structure
```
tests/
├── api/                     # API endpoint tests
├── integration/             # Integration tests
└── manual-tests/            # Manual testing scripts
```

### Running Tests
```bash
# API tests
node tests/test-api.js

# Integration tests  
node tests/integration/test_admin_stores.js

# Manual FDA testing
node tests/manual-fda-test.js
```

## 🚀 Development Setup

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- npm/yarn

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_USER=pharmatrak_user
DB_PASSWORD=pharmatrak_password
DB_NAME=pharmatrak

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

### Quick Start
```bash
# Install dependencies
npm install

# Setup database
mysql -u root -p < database/schema.sql

# Start server
node server.js

# Server runs on http://localhost:3001
```

## 📊 Performance & Monitoring

### Database Optimization
- **Indexes**: All foreign keys and search fields indexed
- **Connection Pooling**: MySQL2 connection pool
- **Query Optimization**: Efficient JOIN queries

### Logging
- **Request Logging**: All API requests logged with timing
- **Error Logging**: Comprehensive error tracking
- **Audit Logging**: Complete transaction history

### Monitoring Endpoints
- **Health Check**: `GET /api/health`
- **Database Status**: `GET /api/status/db`
- **System Info**: `GET /api/status/system`

## 🔄 Development Workflow

### Making Changes
1. **Models**: Add new model methods in `models/`
2. **Routes**: Define new endpoints in `routes/`
3. **Middleware**: Add cross-cutting concerns in `middleware/`
4. **Testing**: Add tests for new functionality

### Database Migrations
```bash
# Create migration
touch database/migrations/add_new_feature.sql

# Run migration
mysql -u root -p pharmatrak < database/migrations/add_new_feature.sql
```

### Code Style
- **ESLint**: Consistent code formatting
- **JSDoc**: Function documentation
- **Error Handling**: Comprehensive try/catch blocks
- **Async/Await**: Modern promise handling

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection**: Check MySQL service and credentials
2. **Port Conflicts**: Ensure port 3001 is available
3. **Authentication Errors**: Verify JWT secret and token format
4. **CORS Issues**: Check allowed origins configuration

### Debug Strategies
1. **Enable Verbose Logging**: Set `NODE_ENV=development`
2. **Check Database Logs**: Review MySQL error logs
3. **API Testing**: Use Postman or curl for endpoint testing
4. **Server Logs**: Monitor console output for errors

## 📚 API Documentation

### Response Formats
```javascript
// Success response
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed"
}

// Error response
{
  "success": false,
  "error": "Error message",
  "details": { /* error details */ }
}

// Paginated response
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Authentication Header
```
Authorization: Bearer <jwt-token>
```

---

**Last Updated**: August 2025  
**Maintainer**: PharmaTraK Development Team