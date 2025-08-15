/**
 * Debug Logging Example Component
 * 
 * Demonstrates how to use the comprehensive debug logging system
 * in React components. This serves as documentation and testing
 * for the debug features.
 * 
 * @author PharmaTraK Development Team
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert } from 'react-bootstrap';
import { useDebug, useComponentDebug, useAPIDebug } from '../contexts/DebugContext';
// Unused imports removed to fix warnings

const DebugExample = () => {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);

  // Get debug utilities
  const debug = useDebug();
  const componentDebug = useComponentDebug('DebugExample');
  const apiDebug = useAPIDebug();

  // Create simple interaction handlers
  const interactionHandlers = {
    onClick: (e) => debug.logUserAction('click', 'DebugExample', { target: e.target.tagName }),
    onChange: (e) => debug.logUserAction('input', 'DebugExample', { value: e.target.value }),
    onFocus: (e) => debug.logUserAction('focus', 'DebugExample', { target: e.target.tagName }),
    onBlur: (e) => debug.logUserAction('blur', 'DebugExample', { target: e.target.tagName })
  };

  useEffect(() => {
    componentDebug.onMount({ initialCount: count });
    
    return () => {
      componentDebug.onUnmount();
    };
  }, [componentDebug, count]);

  useEffect(() => {
    if (count > 0) {
      componentDebug.logAction('count_updated', { newCount: count });
    }
  }, [count, componentDebug]);

  // Example of timing a function
  const timedIncrement = debug.time('increment_counter', () => {
    setCount(prev => prev + 1);
  });

  // Example of API call with debugging
  const fetchData = async () => {
    const wrappedAPICall = apiDebug.wrapCall(
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { data: `Fetched at ${new Date().toISOString()}`, count };
      },
      'GET',
      '/api/debug/example'
    );

    try {
      const response = await wrappedAPICall();
      setApiData(response);
    } catch (err) {
      setError(err.message);
      componentDebug.onError(err);
    }
  };

  // Example of causing an error for testing
  const triggerError = () => {
    try {
      // Intentionally cause an error
      const badFunction = null;
      badFunction();
    } catch (err) {
      componentDebug.onError(err);
      setError('Intentional error for debugging');
    }
  };

  // Example of assertion
  const testAssertion = () => {
    debug.assert(count >= 0, 'Count should always be non-negative', { count });
    debug.assert(typeof inputValue === 'string', 'Input value should be a string', { inputValue, type: typeof inputValue });
  };

  // Example of state inspection
  const inspectState = () => {
    debug.inspectState('DebugExample', { count, inputValue, apiData, error });
  };

  return (
    <Card>
      <Card.Header>
        <h5>Debug Logging Example Component</h5>
        <small className="text-muted">
          This component demonstrates all debug logging features. 
          Check browser console and press Ctrl+Shift+D for debug panel.
        </small>
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {debug.isEnabled && (
          <Alert variant="info">
            🔍 Debug Mode Active | Logs: {debug.stats.totalLogs} | Errors: {debug.stats.errors}
          </Alert>
        )}

        <div className="mb-3">
          <h6>Counter Example</h6>
          <p>Current count: <strong>{count}</strong></p>
          <Button 
            variant="primary" 
            onClick={timedIncrement}
            {...interactionHandlers}
          >
            Increment (Timed)
          </Button>
          <Button 
            variant="secondary" 
            className="ms-2"
            onClick={() => setCount(0)}
            {...interactionHandlers}
          >
            Reset
          </Button>
        </div>

        <div className="mb-3">
          <h6>Form Input Example</h6>
          <Form.Control
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              interactionHandlers.onChange(e);
            }}
            onFocus={interactionHandlers.onFocus}
            onBlur={interactionHandlers.onBlur}
            placeholder="Type something..."
          />
        </div>

        <div className="mb-3">
          <h6>API Call Example</h6>
          {apiData && (
            <Alert variant="success">
              <strong>API Response:</strong> {JSON.stringify(apiData, null, 2)}
            </Alert>
          )}
          <Button 
            variant="outline-primary" 
            onClick={fetchData}
            {...interactionHandlers}
          >
            Fetch Data
          </Button>
        </div>

        <div className="mb-3">
          <h6>Debug Tools</h6>
          <Button 
            variant="outline-warning" 
            onClick={triggerError}
            className="me-2"
            {...interactionHandlers}
          >
            Trigger Error
          </Button>
          <Button 
            variant="outline-info" 
            onClick={testAssertion}
            className="me-2"
            {...interactionHandlers}
          >
            Test Assertions
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={inspectState}
            {...interactionHandlers}
          >
            Inspect State
          </Button>
        </div>

        <div className="mb-3">
          <h6>Debug Panel Controls</h6>
          <Button 
            variant="success" 
            onClick={debug.tools.showLogs}
            className="me-2"
            size="sm"
          >
            Show Debug Panel
          </Button>
          <Button 
            variant="info" 
            onClick={debug.tools.exportLogs}
            className="me-2"
            size="sm"
          >
            Export Logs
          </Button>
          <Button 
            variant="warning" 
            onClick={debug.tools.clearLogs}
            className="me-2"
            size="sm"
          >
            Clear Logs
          </Button>
        </div>

        <div className="mt-4 p-3 bg-light rounded">
          <h6>Keyboard Shortcuts</h6>
          <ul className="mb-0 small">
            <li><kbd>Ctrl+Shift+D</kbd> - Toggle Debug Panel</li>
            <li><kbd>Ctrl+Shift+L</kbd> - Export Logs</li>
            <li><kbd>Ctrl+Shift+C</kbd> - Clear Logs</li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DebugExample;