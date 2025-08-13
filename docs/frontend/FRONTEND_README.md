# PharmaTraK Frontend

A comprehensive React-based frontend for the PharmaTraK pharmacy management system.

## Features

### 🔐 Authentication
- Secure JWT-based authentication
- Role-based access control (Admin/User)
- Protected routes and navigation
- Test credentials provided for demo

### 📊 Dashboard
- Real-time inventory statistics
- Low stock and expiring medication alerts
- Recent transaction history
- Quick action buttons

### 💊 Inventory Management
- Complete CRUD operations for inventory items
- Advanced filtering and search
- Transaction processing:
  - Prescription fills with Rx numbers
  - Return to stock with reference tracking
  - Medication expiration handling
  - Inventory audits with adjustment tracking

### 📈 Audit & Reporting
- **NDC Audit Reports**: Comprehensive drug-specific audit trails
- Date range filtering from audit points
- Running totals and transaction breakdowns
- Export capabilities (CSV/JSON)
- Real-time transaction tracking

### 🏪 Store Management (Admin)
- Multi-store support
- Store-specific data segregation
- Admin oversight across all stores

## Technology Stack

- **React 18** - Modern React with Hooks
- **React Router 6** - Client-side routing
- **React Bootstrap** - UI components
- **Axios** - HTTP client for API communication
- **Context API** - State management

## Quick Start

### Prerequisites
- Node.js 16+ 
- Backend API running on http://localhost:3000

### Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Setup**
   ```bash
   # .env file is already configured for local development
   REACT_APP_API_URL=http://localhost:3000/api
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   The application will open at http://localhost:3001

## Test Credentials

**Default Admin Account:**
- **Email:** `admin@pharmatrak.com`
- **Password:** `Admin123!`
- **Store:** PharmaTraK Demo Store

*These credentials are automatically created when you run the backend setup.*

## Project Structure

```
frontend/src/
├── components/          # React components
│   ├── Login.js        # Authentication form
│   ├── Navigation.js   # App navigation bar
│   ├── Dashboard.js    # Main dashboard
│   ├── Inventory.js    # Inventory management
│   ├── NDCAuditReport.js # Audit reporting
│   └── ProtectedRoute.js # Route protection
├── contexts/
│   └── AuthContext.js  # Authentication context
├── services/
│   └── api.js         # API service layer
└── App.js             # Main application component
```

## Key Components

### Authentication System
- **AuthContext**: Manages user state and authentication
- **ProtectedRoute**: Secures routes based on authentication/role
- **Login**: User authentication interface with test credentials

### Inventory Management
- **Real-time filtering**: Search, low stock, expiring items
- **Transaction modals**: Prescription fills, returns, expiration, audits
- **Stock level indicators**: Visual badges for stock status
- **Bulk operations**: Mass inventory updates

### NDC Audit Reports
- **Comprehensive reporting**: Full audit trail for specific drugs
- **Date range filtering**: From audit points to future dates
- **Running totals**: Real-time calculation of stock levels
- **Export functionality**: CSV and JSON formats
- **Transaction breakdown**: Detailed analysis by type

## Getting Started

1. **Backend Setup** (in root directory):
   ```bash
   # Install backend dependencies
   npm install
   
   # Setup database and create admin user
   ./setup.sh
   
   # Start backend server
   npm start
   ```

2. **Frontend Setup** (in frontend directory):
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Login**: Use the test credentials at http://localhost:3001/login

## Available Scripts

- `npm start` - Development server (port 3001)
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App