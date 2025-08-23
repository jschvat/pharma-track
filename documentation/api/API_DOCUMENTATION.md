# PharmaTraK API Documentation

## 🌐 API Overview

RESTful API for the PharmaTraK pharmacy inventory management system. All API endpoints use JSON for request/response data.

**Base URL**: `http://localhost:3001/api`

## 🔐 Authentication

### JWT Token-Based Authentication
All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@pharmatrak.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@pharmatrak.com",
    "role": "admin"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin User", 
    "email": "admin@pharmatrak.com",
    "role": "admin"
  }
}
```

## 👥 User Management

### List Users
```http
GET /api/users?page=1&limit=20&search=john
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term for name/email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "store_manager",
      "created_at": "2025-08-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Create User
```http
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "role": "staff"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "staff"
  },
  "message": "User created successfully"
}
```

### Update User
```http
PUT /api/users/15
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "role": "store_manager"
}
```

### Delete User
```http
DELETE /api/users/15
Authorization: Bearer <admin-token>
```

## 🏪 Store Management

### List Stores
```http
GET /api/stores
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Main Pharmacy",
      "address": "123 Main St, City, State 12345",
      "phone": "(555) 123-4567",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Store Statistics
```http
GET /api/stores/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStores": 5,
    "totalInventoryValue": 125000.50,
    "averageInventoryPerStore": 25000.10,
    "storePerformance": [
      {
        "storeId": 1,
        "storeName": "Main Pharmacy",
        "inventoryValue": 45000.25,
        "itemCount": 1250
      }
    ]
  }
}
```

## 📦 Inventory Management

### Get Store Inventory
```http
GET /api/inventory/store/1?page=1&limit=20&search=aspirin&lowStock=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search drug names
- `lowStock` (optional): Filter low stock items
- `expiring` (optional): Filter expiring items
- `expired` (optional): Filter expired items

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "drugId": 501,
      "drugName": "Aspirin 325mg",
      "ndc": "12345-678-90",
      "quantity": 150,
      "expirationDate": "2025-12-31",
      "batchNumber": "LOT12345",
      "costPerUnit": 0.25,
      "totalValue": 37.50,
      "isLowStock": false,
      "isExpiring": false,
      "isExpired": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "pages": 63
  }
}
```

### Add Inventory Item
```http
POST /api/inventory/store/1/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "drugId": 501,
  "quantity": 100,
  "expirationDate": "2025-12-31",
  "batchNumber": "LOT67890",
  "costPerUnit": 0.30,
  "reason": "New shipment received"
}
```

### Update Inventory Quantity
```http
PUT /api/inventory/items/101
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 75,
  "reason": "Dispensed to patients"
}
```

### Remove Inventory Item
```http
DELETE /api/inventory/items/101
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Expired medication disposal"
}
```

### Inventory Statistics
```http
GET /api/inventory/store/1/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalItems": 1250,
    "totalValue": 45000.25,
    "lowStockCount": 15,
    "expiringCount": 8,
    "expiredCount": 2,
    "categoryBreakdown": {
      "Pain Relief": 150,
      "Antibiotics": 200,
      "Cardiovascular": 175
    }
  }
}
```

### Low Stock Items
```http
GET /api/inventory/store/1/low-stock?limit=10&threshold=20
Authorization: Bearer <token>
```

### Expiring Items
```http
GET /api/inventory/store/1/expiring?days=30&limit=10
Authorization: Bearer <token>
```

## 💊 Drug Information

### Search Drugs
```http
GET /api/drugs?search=aspirin&page=1&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 501,
      "name": "Aspirin",
      "genericName": "Acetylsalicylic Acid",
      "brandName": "Bayer Aspirin",
      "ndc": "12345-678-90",
      "strength": "325mg",
      "dosageForm": "Tablet",
      "manufacturer": "Bayer Healthcare",
      "category": "Pain Relief"
    }
  ]
}
```

### Get Drug Details
```http
GET /api/drugs/501
Authorization: Bearer <token>
```

### FDA Drug Search
```http
POST /api/drugs/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "searchTerm": "aspirin",
  "searchType": "brand_name"
}
```

### Drug Statistics
```http
GET /api/drugs/stats/overview
Authorization: Bearer <token>
```

## 📊 Audit Logging

### Store Audit Trail
```http
GET /api/audit/store/1?page=1&limit=20&transactionType=add
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page  
- `transactionType` (optional): add, remove, adjust, expire, transfer
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `userId` (optional): Filter by user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "storeId": 1,
      "storeName": "Main Pharmacy",
      "drugId": 501,
      "drugName": "Aspirin 325mg",
      "userId": 5,
      "userName": "John Doe",
      "transactionType": "add",
      "quantityChange": 100,
      "previousQuantity": 50,
      "newQuantity": 150,
      "reason": "New shipment received",
      "createdAt": "2025-08-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

### Recent Audit Entries
```http
GET /api/audit/recent?limit=10
Authorization: Bearer <token>
```

### NDC Audit Report
```http
POST /api/audit/ndc-report
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-08-01",
  "endDate": "2025-08-15",
  "storeId": 1,
  "ndc": "12345-678-90"
}
```

## 📈 Reports

### Generate PDF Report
```http
POST /api/reports/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "storeId": 1,
  "reportType": "low-stock",
  "format": "pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "rpt_20250815_lowstock_001",
    "downloadUrl": "/api/reports/download/rpt_20250815_lowstock_001.pdf",
    "expiresAt": "2025-08-16T10:30:00Z"
  }
}
```

## 🔧 System Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-08-15T10:30:00Z",
  "uptime": "2h 15m 30s"
}
```

### Database Status
```http
GET /api/status/db
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "database": {
    "status": "connected",
    "host": "localhost",
    "database": "pharmatrak",
    "connectionCount": 5,
    "queryCount": 1250
  }
}
```

## ❌ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "code": "VALIDATION_ERROR",
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### Common HTTP Status Codes
- **200 OK**: Successful operation
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error

### Error Types
```json
// Validation Error
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "errors": [
      {
        "field": "email",
        "message": "Valid email required"
      },
      {
        "field": "password", 
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}

// Authentication Error
{
  "success": false,
  "error": "Invalid credentials",
  "code": "AUTH_FAILED"
}

// Authorization Error
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "requiredRole": "admin"
}

// Not Found Error
{
  "success": false,
  "error": "User not found",
  "code": "NOT_FOUND",
  "resource": "user",
  "id": 999
}
```

## 📊 Rate Limiting

### API Rate Limits
- **General endpoints**: 100 requests per minute
- **Authentication**: 5 requests per minute
- **Reports**: 10 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1692115800
```

## 🧪 Testing with cURL

### Login Example
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pharmatrak.com","password":"Admin123!"}'
```

### Authenticated Request Example
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer your-jwt-token-here"
```

### Create User Example
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer your-jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "TestPassword123!",
    "role": "staff"
  }'
```

## 📚 SDK/Client Libraries

### JavaScript/Node.js Client
```javascript
import axios from 'axios';

class PharmaTraKAPI {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.client = axios.create({ baseURL });
    this.token = null;
  }
  
  setToken(token) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    this.setToken(response.data.token);
    return response.data;
  }
  
  async getUsers(params = {}) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }
  
  async getInventory(storeId, params = {}) {
    const response = await this.client.get(`/inventory/store/${storeId}`, { params });
    return response.data;
  }
}

// Usage
const api = new PharmaTraKAPI();
await api.login('admin@pharmatrak.com', 'Admin123!');
const users = await api.getUsers({ page: 1, limit: 20 });
```

---

**Last Updated**: August 2025  
**Maintainer**: PharmaTraK Development Team  
**API Version**: 1.0