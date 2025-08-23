# Enhanced Debugging System

## Overview

The PharmaTraK enhanced debugging system provides comprehensive debugging capabilities for development, including colored logging, request tracking, performance monitoring, and security event tracking.

## Features

### 🎨 Colored Output
- **Blue**: Info messages
- **Green**: Success messages  
- **Yellow**: Warnings
- **Red**: Errors
- **Cyan**: Highlights
- **Gray**: Debug info

### 📊 Namespace-Based Debugging
- `pharmatrak:app` - Application-level events
- `pharmatrak:db` - Database queries and operations
- `pharmatrak:auth` - Authentication events
- `pharmatrak:api` - API request/response tracking
- `pharmatrak:performance` - Timing and memory monitoring
- `pharmatrak:security` - Security events
- `pharmatrak:error` - Error tracking
- `pharmatrak:test` - Test debugging

### 🔧 Key Components

#### 1. Enhanced Debugger (`utils/debugger.js`)
Core debugging utility with methods for:
- Database query logging with timing
- API request/response tracking
- Authentication event monitoring
- Performance timing and memory usage
- Security event logging
- Error tracking with stack traces

#### 2. Debug Middleware (`middleware/debugMiddleware.js`)
Specialized middleware for:
- Route-specific debugging
- Database operation tracking
- Authentication debugging
- Inventory operation monitoring
- User management auditing
- God mode operation tracking
- Report generation monitoring

#### 3. Enhanced Server (`server-enhanced.js`)
Integrated server with:
- Debugging middleware integration
- Development debug endpoints
- Enhanced error monitoring
- Startup performance tracking

## Usage

### Environment Setup
```bash
# Enable all debugging
DEBUG=pharmatrak:* NODE_ENV=development node server-enhanced.js

# Enable specific namespaces
DEBUG=pharmatrak:db,pharmatrak:api node server.js

# Enable debugging with custom port
DEBUG=pharmatrak:* PORT=3002 node server-enhanced.js
```

### In Code

#### Basic Logging
```javascript
const { debugger: devDebugger } = require('./utils/debugger');

// Basic logging
devDebugger.log('app', 'Application started', { port: 3000 });

// Database query debugging
devDebugger.dbQuery('SELECT * FROM users WHERE id = ?', [123], 45);

// Authentication events
devDebugger.auth('login', {
  email: 'user@example.com',
  ip: '127.0.0.1',
  success: true
});
```

#### Performance Monitoring
```javascript
// Start timing
devDebugger.startTimer('operation_name');

// ... perform operation ...

// End timing and log duration
const duration = devDebugger.endTimer('operation_name');

// Memory usage check
devDebugger.memoryUsage('After Operation');
```

#### Security Monitoring
```javascript
// Log security events
devDebugger.security('rate_limit', {
  ip: '127.0.0.1',
  endpoint: '/api/auth/login',
  attempts: 5
});

// Track suspicious activity
devDebugger.security('suspicious_request', {
  path: '/admin',
  ip: '192.168.1.100',
  reason: 'unauthorized_access_attempt'
});
```

#### Error Debugging
```javascript
try {
  // risky operation
} catch (error) {
  devDebugger.error(error, {
    context: 'user_creation',
    userId: 123,
    operation: 'database_insert'
  });
}
```

### Middleware Usage

#### Route Debugging
```javascript
const { debugRoute } = require('./middleware/debugMiddleware');

// Apply to specific routes
app.use('/api/users', debugRoute('users'), userRoutes);
```

#### Database Operation Debugging
```javascript
const { debugDatabaseQuery } = require('./middleware/debugMiddleware');

// Monitor database-heavy operations
app.use('/api/reports', debugDatabaseQuery('reports'), reportsRoutes);
```

#### Authentication Debugging
```javascript
const { debugAuth } = require('./middleware/debugMiddleware');

// Track authentication flows
app.use('/api/protected', debugAuth, protectedRoutes);
```

## Development Endpoints

When `NODE_ENV=development`:

### Debug Info
```bash
GET /api/debug/info
```
Returns system information including:
- Environment details
- Debug status
- Memory usage
- Feature flags

### Memory Monitor
```bash
GET /api/debug/memory
```
Returns current memory usage statistics.

## Example Output

### Database Query
```
2025-08-17T10:59:46.034Z pharmatrak:db 📊 DB Query:
2025-08-17T10:59:46.034Z pharmatrak:db    SELECT * FROM users WHERE email = ? AND role = ?
2025-08-17T10:59:46.034Z pharmatrak:db    Params: "test@example.com", "admin"  
2025-08-17T10:59:46.034Z pharmatrak:db    Duration: 45ms
```

### API Request
```
2025-08-17T10:56:50.291Z pharmatrak:api 🌐 [1] GET /api/health
2025-08-17T10:56:50.291Z pharmatrak:api    IP: ::ffff:127.0.0.1
2025-08-17T10:56:50.291Z pharmatrak:api    User-Agent: curl/7.81.0...
```

### Authentication Event
```
2025-08-17T10:59:46.034Z pharmatrak:auth 🔐 Auth: LOGIN
2025-08-17T10:59:46.034Z pharmatrak:auth    email: test@example.com
2025-08-17T10:59:46.034Z pharmatrak:auth    ip: 127.0.0.1
2025-08-17T10:59:46.034Z pharmatrak:auth    success: true
```

### Performance Monitoring
```
2025-08-17T10:59:45.932Z pharmatrak:performance 💾 Initial Test:
2025-08-17T10:59:45.932Z pharmatrak:performance    RSS: 53MB
2025-08-17T10:59:45.932Z pharmatrak:performance    Heap Used: 5MB
2025-08-17T10:59:45.932Z pharmatrak:performance    Heap Total: 7MB
2025-08-17T10:59:45.932Z pharmatrak:performance    External: 2MB
```

## Configuration

### Environment Variables
- `DEBUG` - Controls which debug namespaces are active
- `NODE_ENV` - Set to 'development' to enable debugging
- `DEBUG_VERBOSE` - Enable verbose response logging

### Package Dependencies
- `debug` - Core debugging functionality
- `chalk` - Colored terminal output (with ANSI fallback)
- `util` - Object inspection

## Security Considerations

- **Sensitive data redaction**: Passwords, tokens, and secrets are automatically redacted
- **Production safety**: Debugging is disabled in production environments
- **Performance impact**: Minimal overhead when debugging is disabled

## Testing

Use the test script to verify debugging functionality:
```bash
node test-debugger.js
```

This will test all debugging features and display sample output.

## Integration with Existing Systems

The enhanced debugging system integrates with:
- **Winston Logger**: Complements structured logging
- **Morgan**: HTTP request logging
- **Express Error Handling**: Enhanced error context
- **Database Models**: Query performance tracking
- **Authentication Middleware**: Security event monitoring

## Best Practices

1. **Use appropriate namespaces** for different types of events
2. **Include relevant context** in debug messages
3. **Monitor performance impact** in development
4. **Sanitize sensitive data** before logging
5. **Use timing for performance-critical operations**
6. **Leverage security debugging** for audit trails