# PharmaTrack Backend

A Node.js backend application for pharmacy store management with authentication and user management.

## Features

- JWT-based authentication
- Store management (admin only)
- User management with role-based access control
- MySQL database integration
- Input validation and sanitization
- Rate limiting and security middleware

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your database credentials and JWT secret.

3. Create MySQL database and run schema:
```bash
mysql -u root -p < database/schema.sql
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Stores (Admin only)
- `POST /api/stores` - Create store
- `GET /api/stores` - Get all stores
- `GET /api/stores/:id` - Get store by ID
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store

### Users (Store admin only)
- `POST /api/users` - Create user
- `GET /api/users` - Get store users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Drugs & Inventory
- `GET /api/drugs/search/fda` - Search FDA database
- `GET /api/drugs/search` - Search local drug database
- `GET /api/drugs/:id` - Get drug by ID
- `POST /api/drugs/add-from-fda` - Add drug from FDA to local database
- `GET /api/drugs/inventory/:storeId` - Get store inventory
- `POST /api/drugs/inventory` - Add drug to inventory
- `PUT /api/drugs/inventory/:id` - Update inventory item
- `GET /api/drugs/inventory/:storeId/low-stock` - Get low stock items
- `GET /api/drugs/inventory/:storeId/expiring` - Get expiring items
- `GET /api/drugs/inventory/:storeId/stats` - Get inventory statistics

## Database Schema

### Stores
- **id**: Auto-increment primary key
- **name**: VARCHAR(100) - Store name (2-100 chars, letters/numbers/spaces/basic punctuation)
- **address**: VARCHAR(500) - Street address (5-500 chars)
- **state**: CHAR(2) - US state abbreviation (validated against all US states/territories)
- **zipcode**: VARCHAR(10) - ZIP code (5 digits or 5+4 format)
- **phone**: VARCHAR(11) - Phone number (10-11 digits only)
- **fax**: VARCHAR(11) - Fax number (10-11 digits, optional)
- **dea_registration_number**: CHAR(9) - DEA number with check digit validation (Format: AB1234567)
- **npi**: CHAR(10) - NPI number with Luhn algorithm validation (10 digits)
- **admin_user_id**: INT - Foreign key to users table
- **date_created, updated_at**: Timestamps

### Users
- **id**: Auto-increment primary key
- **name**: VARCHAR(100) - User name (2-100 chars, letters/spaces/basic punctuation)
- **email**: VARCHAR(255) - Unique email with format validation
- **phone**: VARCHAR(11) - Phone number (10-11 digits only)
- **password**: VARCHAR(255) - bcrypt hash (minimum 60 chars for bcrypt)
- **address**: VARCHAR(500) - Street address (5-500 chars)
- **store_id**: INT - Foreign key to stores table
- **role**: ENUM('admin', 'user') - User role
- **is_active**: BOOLEAN - Account status
- **date_created, updated_at**: Timestamps

### Drugs & Inventory
- **drugs**: NDC, generic/brand names, dosage forms, manufacturers, FDA data
- **store_inventory**: Quantities, costs, expiration dates, lot numbers, suppliers
- **fda_search_history**: Search analytics and caching optimization

### Database Constraints
- **CHECK constraints** enforce data format validation at database level
- **UNIQUE constraints** on email, DEA, NPI numbers, and NDC codes
- **FOREIGN KEY constraints** with CASCADE/SET NULL actions
- **REGEX validation** for phone numbers, emails, DEA/NPI/NDC formats
- **State validation** against complete US state/territory list
- **Full-text search** indexes for drug names and substances

## OpenFDA Integration

The system integrates with the OpenFDA NDC endpoint to provide:
- **Real-time drug lookups** from FDA database
- **NDC validation** and formatting
- **Comprehensive drug information** including ingredients, manufacturers, dosage forms
- **Intelligent caching** to reduce API calls and improve performance
- **Local drug database** for frequently accessed medications

### FDA Features
- Search by NDC, generic name, brand name, or manufacturer
- Automatic data synchronization with FDA database
- Advanced search with multiple criteria
- Response caching with TTL management
- Rate limit handling and error recovery