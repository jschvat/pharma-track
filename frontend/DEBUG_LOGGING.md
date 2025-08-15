# Debug Logging System Documentation

## Overview

The PharmaTraK frontend includes a comprehensive development-only debug logging system that captures API calls, errors, component lifecycle events, user interactions, and performance metrics. This system is designed to help developers and Claude debug issues more effectively.

## Features

### 🔍 Core Logging Capabilities
- **API Call Logging**: All HTTP requests/responses with timing
- **Error Tracking**: JavaScript errors with stack traces and context
- **Component Lifecycle**: Mount, update, unmount events
- **User Interactions**: Clicks, form submissions, navigation
- **Performance Monitoring**: Render times, API response times
- **State Changes**: Component state and prop tracking

### 🛠 Development Tools
- **Debug Panel**: Visual interface for viewing logs
- **Log Export**: Download logs as JSON files
- **Keyboard Shortcuts**: Quick access to debug tools
- **Console Integration**: Enhanced console logging
- **Memory Monitoring**: JavaScript heap usage tracking

### 🚨 Error Boundaries
- **Automatic Error Catching**: Global error handlers
- **Component Error Boundaries**: Isolated error handling
- **Detailed Error Display**: Development error screens

## Quick Start

### 1. Basic Usage

The debug system is automatically initialized in development mode. No additional setup is required.

```javascript
// The system automatically logs:
// - All API calls made through fetch or axios
// - All JavaScript errors
// - Component lifecycle events (when using debug hooks)
// - User interactions (when using interaction handlers)
```

### 2. Component Logging

```javascript
import { useDebugLogging, useUserInteractionLogging } from '../utils/withDebugLogging';
import { useComponentDebug } from '../contexts/DebugContext';

const MyComponent = () => {
  const [state, setState] = useState({});
  const props = { /* component props */ };
  
  // Automatic lifecycle logging
  useDebugLogging('MyComponent', props, state);
  
  // Manual component actions
  const componentDebug = useComponentDebug('MyComponent');
  
  // User interaction logging
  const interactionHandlers = useUserInteractionLogging('MyComponent');
  
  const handleClick = () => {
    componentDebug.logAction('custom_action', { data: 'example' });
  };
  
  return (
    <div>
      <button 
        onClick={handleClick}
        {...interactionHandlers} // Adds onClick, onFocus, onBlur logging
      >
        Click Me
      </button>
    </div>
  );
};
```

### 3. API Call Logging

```javascript
import { useAPIDebug } from '../contexts/DebugContext';

const MyComponent = () => {
  const apiDebug = useAPIDebug();
  
  const fetchData = async () => {
    const wrappedCall = apiDebug.wrapCall(
      async (data) => {
        return await fetch('/api/data', {
          method: 'POST',
          body: JSON.stringify(data)
        }).then(res => res.json());
      },
      'POST',
      '/api/data'
    );
    
    try {
      const result = await wrappedCall({ param: 'value' });
      return result;
    } catch (error) {
      // Error is automatically logged
      throw error;
    }
  };
};
```

### 4. Performance Timing

```javascript
import { useDebug } from '../contexts/DebugContext';

const MyComponent = () => {
  const debug = useDebug();
  
  const expensiveOperation = debug.time('expensive_operation', async () => {
    // This function's execution time will be logged
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'result';
  });
};
```

### 5. Error Logging

```javascript
import { useComponentDebug } from '../contexts/DebugContext';

const MyComponent = () => {
  const componentDebug = useComponentDebug('MyComponent');
  
  const riskyOperation = () => {
    try {
      // Potentially failing operation
      JSON.parse('invalid json');
    } catch (error) {
      componentDebug.onError(error);
      // Handle error gracefully
    }
  };
};
```

## Debug Tools Access

### Keyboard Shortcuts
- `Ctrl+Shift+D` - Toggle Debug Panel
- `Ctrl+Shift+L` - Export Logs to JSON file
- `Ctrl+Shift+C` - Clear all logs

### Debug Panel
The debug panel shows:
- Recent log entries with filtering
- Log categories and levels
- Expandable log details
- Export and clear controls

### Programmatic Access
```javascript
import debugLogger from '../utils/debugLogger';

// Get debug statistics
const stats = debugLogger.getSummary();

// Get filtered logs
const apiLogs = debugLogger.getLogsByCategory('api');
const errors = debugLogger.getLogsByLevel('error');

// Export logs
debugLogger.exportLogs();

// Clear logs
debugLogger.clearLogs();
```

## Log Categories and Levels

### Categories
- `api` - HTTP requests and responses
- `component` - React component lifecycle
- `function` - Function calls and timing
- `user` - User interactions
- `performance` - Performance metrics
- `error` - Errors and exceptions
- `console` - Console output

### Levels
- `info` - General information
- `debug` - Debug information
- `warn` - Warnings
- `error` - Errors
- `api` - API calls (success)

## Log Entry Structure

Each log entry contains:
```json
{
  "id": "log_1234567890_abc123",
  "timestamp": 1234567890123,
  "relativeTime": 5000,
  "level": "api",
  "category": "api",
  "message": "GET /api/users SUCCESS (250ms)",
  "data": {
    "method": "GET",
    "url": "/api/users",
    "requestData": null,
    "responseData": { "users": [] },
    "duration": 250
  },
  "stack": null,
  "url": "http://localhost:3000/dashboard",
  "userAgent": "Mozilla/5.0..."
}
```

## Configuration

### Environment Variables
The debug system is automatically enabled when:
- `NODE_ENV === 'development'`
- `REACT_APP_ENV === 'development'`

### Debug Flags
```javascript
import { useDebug } from '../contexts/DebugContext';

const debug = useDebug();

// Configure what gets logged
debug.flags.logComponents = true;
debug.flags.logAPI = true;
debug.flags.logUserInteractions = true;
debug.flags.logPerformance = true;
debug.flags.logErrors = true;
```

## Integration with Existing Components

### Wrap Components with Debug Logging
```javascript
import { withDebugLogging } from '../utils/withDebugLogging';

const MyComponent = () => {
  return <div>My Component</div>;
};

export default withDebugLogging(MyComponent, 'MyComponent');
```

### Add Error Boundaries
```javascript
import { DebugErrorBoundary } from '../utils/withDebugLogging';

const App = () => (
  <DebugErrorBoundary>
    <MyComponent />
  </DebugErrorBoundary>
);
```

## Performance Impact

The debug system is designed to have minimal impact:
- **Production**: Completely disabled, zero overhead
- **Development**: Lightweight logging with automatic cleanup
- **Memory**: Keeps only last 1000 log entries
- **Storage**: Logs are not persisted between sessions

## Helping Claude Debug

### What Claude Can See
When you encounter issues, Claude can help by analyzing:
- **Exported log files** (JSON format with all debug data)
- **Console output** (formatted log entries)
- **Error stack traces** (with component context)
- **API call patterns** (request/response data)
- **Performance bottlenecks** (timing data)

### Best Practices for Debug Sessions
1. **Reproduce the issue** while debug logging is active
2. **Export logs** using `Ctrl+Shift+L` or debug panel
3. **Share the JSON file** with Claude for analysis
4. **Describe the expected vs actual behavior**
5. **Include any error messages** from the console

### Example Debug Session
```javascript
// 1. Enable detailed logging for problematic component
const MyProblematicComponent = () => {
  const debug = useDebug();
  const componentDebug = useComponentDebug('MyProblematicComponent');
  
  useEffect(() => {
    // Log when component mounts
    componentDebug.onMount({ initialData: props.data });
  }, []);
  
  const handleProblematicAction = async () => {
    try {
      // Log the action attempt
      componentDebug.logAction('problematic_action_start', { context: 'user_click' });
      
      // Execute problematic code
      const result = await problematicAPICall();
      
      // Log success
      componentDebug.logAction('problematic_action_success', { result });
    } catch (error) {
      // Error is automatically logged with full context
      componentDebug.onError(error);
    }
  };
  
  return (
    <button onClick={handleProblematicAction}>
      Trigger Issue
    </button>
  );
};

// 2. After reproducing issue, export logs with Ctrl+Shift+L
// 3. Share the exported JSON file with Claude for analysis
```

## File Structure

```
frontend/src/
├── utils/
│   ├── debugLogger.js          # Core logging system
│   ├── apiInterceptor.js       # Automatic API logging
│   └── withDebugLogging.js     # React component wrappers
├── contexts/
│   └── DebugContext.js         # Debug context provider
└── components/
    └── DebugExample.js         # Usage examples
```

## Troubleshooting

### Common Issues

1. **Debug panel not showing**
   - Ensure you're in development mode
   - Try `Ctrl+Shift+D` keyboard shortcut
   - Check console for initialization messages

2. **API calls not being logged**
   - Verify the API interceptor is loaded
   - Check if you're using fetch or axios
   - Look for API interceptor initialization message

3. **Component events not logged**
   - Ensure you're using the debug hooks
   - Check that component names are provided
   - Verify the DebugProvider is in your component tree

4. **Performance impact**
   - Debug system only runs in development
   - Production builds exclude all debug code
   - Memory usage is automatically managed

## Advanced Features

### Custom Log Categories
```javascript
debugLogger.log('custom', 'my_category', 'Custom message', { data: 'example' });
```

### Memory Usage Monitoring
```javascript
const debug = useDebug();
const memoryInfo = debug.tools.getMemoryUsage();
console.log('Memory usage:', memoryInfo);
```

### Component Tree Inspection
```javascript
const debug = useDebug();
const componentRef = useRef();

debug.tools.inspectComponent(componentRef);
```

This debug logging system provides comprehensive visibility into your application's behavior, making it much easier for both developers and Claude to identify and resolve issues quickly.