# PharmaTraK Frontend

## 🎯 Overview
React-based frontend for the PharmaTraK pharmacy inventory management system. Built with modern React patterns, Bootstrap UI, and comprehensive debug logging.

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── FormField.js     # Universal form inputs
│   │   ├── FormModal.js     # Standardized modals
│   │   ├── DataTable.js     # Advanced tables
│   │   └── ...              # Other reusable components
│   ├── Dashboard.js         # Main dashboard
│   ├── Inventory.js         # Inventory management
│   ├── UserManagement.js    # User administration
│   └── ...                  # Page-specific components
├── contexts/                # React contexts
│   ├── AuthContext.js       # Authentication state
│   ├── ThemeContext.js      # Theme management
│   └── DebugContext.js      # Debug logging
├── services/                # API communication
│   └── api.js               # Main API service
└── utils/                   # Utility functions
    ├── safeDebugLogger.js   # Debug logging system
    └── dropdownUtils.js     # UI utilities
```

## 🧩 Component Library

### Reusable Components (`src/components/common/`)

#### FormField
Universal form input component supporting various input types.
```jsx
<FormField
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={setEmail}
  required
  helpText="Enter your email address"
/>
```

#### FormModal
Standardized modal dialogs with form submission handling.
```jsx
<FormModal
  show={showModal}
  onHide={() => setShowModal(false)}
  title="Add User"
  onSubmit={handleSubmit}
  loading={loading}
>
  {/* Form content */}
</FormModal>
```

#### DataTable
Advanced table component with sorting, pagination, and custom renderers.
```jsx
<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'actions', label: 'Actions', render: renderActions }
  ]}
  data={users}
  pagination={{ page: 1, limit: 10, total: 100 }}
  onSort={handleSort}
  onPageChange={handlePageChange}
/>
```

### Page Components

#### Dashboard (`Dashboard.js`)
- **Purpose**: Main overview interface with key metrics
- **Features**: Store stats, low stock alerts, recent activity
- **Props**: None (uses contexts for data)

#### Inventory (`Inventory.js`)
- **Purpose**: Comprehensive inventory management
- **Features**: Search, filter, add/edit items, transaction history
- **Props**: None (route-based component)

#### UserManagement (`UserManagement.js`)
- **Purpose**: User administration interface
- **Features**: Create/edit users, role management, store access
- **Permissions**: Admin only

## 🎨 Styling & Themes

### Theme System
- **Location**: `src/contexts/ThemeContext.js`
- **Themes**: Light, Dark, High Contrast
- **CSS Variables**: Defined in `src/theme.css`

### Bootstrap Integration
- **Version**: Bootstrap 5.3
- **Customization**: Custom CSS in `src/css/components.css`
- **Icons**: FontAwesome 6.5.1

## 🔧 Development Tools

### Debug Logging System
Comprehensive development debugging with multiple logging levels.

#### Features
- **API Call Logging**: Automatic request/response tracking
- **Component Lifecycle**: Mount/update/unmount events
- **User Interactions**: Click/input/navigation tracking
- **Performance Monitoring**: Render timing and function profiling
- **Error Tracking**: Automatic error capture with stack traces

#### Usage
```jsx
import { useDebug, useComponentDebug } from '../contexts/DebugContext';

function MyComponent() {
  const debug = useDebug();
  const componentDebug = useComponentDebug('MyComponent');
  
  // Automatic lifecycle logging
  useEffect(() => {
    componentDebug.onMount();
    return () => componentDebug.onUnmount();
  }, []);
  
  // Manual logging
  const handleClick = () => {
    debug.logUserAction('click', 'MyComponent', { button: 'save' });
  };
}
```

#### Debug Panel
- **Access**: `http://localhost:3000/debug/logging`
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+D` - Toggle debug panel
  - `Ctrl+Shift+L` - Export logs
  - `Ctrl+Shift+C` - Clear logs

## 🔐 Authentication & Routing

### Auth Context (`src/contexts/AuthContext.js`)
Manages user authentication state and API tokens.

```jsx
const { user, login, logout, loading } = useAuth();
```

### Protected Routes
Routes requiring authentication use the `ProtectedRoute` component:
```jsx
<Route path="/admin/*" element={
  <ProtectedRoute>
    <AdminComponent />
  </ProtectedRoute>
} />
```

### Role-Based Access
Components can check user roles:
```jsx
const { user } = useAuth();
const isAdmin = user?.role === 'admin';
```

## 🌐 API Integration

### API Service (`src/services/api.js`)
Centralized API communication with automatic token handling.

```jsx
import api from '../services/api';

// Automatic token attachment
const users = await api.get('/api/users');
const newUser = await api.post('/api/users', userData);
```

### Error Handling
- **Global Error Boundary**: Catches React component errors
- **API Error Handling**: Automatic token refresh and error reporting
- **User Feedback**: Toast notifications for success/error states

## 🧪 Testing

### Test Structure
```
src/
├── __tests__/               # Component tests
├── __mocks__/               # Test mocks
└── utils/test-utils.js      # Testing utilities
```

### Running Tests
```bash
npm test                     # Run all tests
npm test -- --coverage      # Run with coverage
npm test Dashboard.test.js   # Run specific test
```

### Test Utilities
Custom test utilities for common patterns:
```jsx
import { renderWithProviders } from '../utils/test-utils';

test('Dashboard renders correctly', () => {
  renderWithProviders(<Dashboard />);
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

## 📦 Build & Deployment

### Development
```bash
npm start                    # Start development server (port 3000)
npm run build               # Create production build
npm run eject               # Eject from Create React App (irreversible)
```

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

### Production Build
```bash
npm run build               # Creates optimized build in /build
serve -s build              # Serve production build locally
```

## 🔍 Code Organization

### File Naming Conventions
- **Components**: PascalCase (e.g., `UserManagement.js`)
- **Utilities**: camelCase (e.g., `dropdownUtils.js`)
- **Constants**: UPPER_SNAKE_CASE
- **CSS Files**: kebab-case (e.g., `dropdown-clean.css`)

### Import Organization
```jsx
// React imports
import React, { useState, useEffect } from 'react';

// Third-party imports
import { Card, Button } from 'react-bootstrap';

// Internal imports
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import FormField from './common/FormField';
```

### Component Structure
```jsx
/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.title - Component title
 */
const MyComponent = ({ title }) => {
  // State declarations
  const [data, setData] = useState(null);
  
  // Context hooks
  const { user } = useAuth();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Event handlers
  const handleSubmit = async (e) => {
    // Handler logic
  };
  
  // Render
  return (
    <Card>
      <Card.Header>{title}</Card.Header>
      <Card.Body>
        {/* Component content */}
      </Card.Body>
    </Card>
  );
};

export default MyComponent;
```

## 🚨 Troubleshooting

### Common Issues

#### Build Errors
- **ESLint warnings**: Fix hook dependencies and unused imports
- **Module not found**: Check import paths and file names
- **Memory issues**: Increase Node.js memory limit

#### Runtime Issues
- **Authentication errors**: Check token expiration and API connectivity
- **CORS errors**: Verify backend CORS configuration
- **Component errors**: Check React DevTools and debug logs

#### Performance Issues
- **Slow rendering**: Use React DevTools Profiler
- **Memory leaks**: Check for missing cleanup in useEffect
- **Large bundles**: Analyze bundle with webpack-bundle-analyzer

### Debug Strategies
1. **Enable debug logging**: Visit `/debug/logging`
2. **Check browser console**: Look for errors and warnings
3. **Use React DevTools**: Inspect component state and props
4. **Monitor network**: Check API calls in DevTools Network tab

## 📚 Quick Start (Create React App)

### Available Scripts

#### `npm start`
Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

#### `npm test`
Launches the test runner in interactive watch mode.

#### `npm run build`
Builds the app for production to the `build` folder.

#### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

### Learn More
- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)

---

**Last Updated**: August 2025  
**Maintainer**: PharmaTraK Development Team