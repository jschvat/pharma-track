/**
 * Dropdown Test Component
 * Simple test to verify dropdown functionality
 */

import React from 'react';
import { Dropdown, Form } from 'react-bootstrap';

const DropdownTest = () => {
  return (
    <div style={{ padding: '20px', background: '#f8f9fa' }}>
      <h4>Dropdown Test</h4>
      
      {/* Test 1: Basic HTML Select */}
      <div style={{ marginBottom: '20px' }}>
        <label>Basic HTML Select:</label>
        <select className="form-control" style={{ marginTop: '5px' }}>
          <option value="">Choose option...</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </select>
      </div>

      {/* Test 2: Bootstrap Form.Select */}
      <div style={{ marginBottom: '20px' }}>
        <label>Bootstrap Form.Select:</label>
        <Form.Select style={{ marginTop: '5px' }}>
          <option value="">Choose option...</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Form.Select>
      </div>

      {/* Test 3: Bootstrap Dropdown Component */}
      <div style={{ marginBottom: '20px' }}>
        <label>Bootstrap Dropdown:</label>
        <div style={{ marginTop: '5px' }}>
          <Dropdown>
            <Dropdown.Toggle variant="primary">
              Dropdown Test
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item>Action 1</Dropdown.Item>
              <Dropdown.Item>Action 2</Dropdown.Item>
              <Dropdown.Item>Action 3</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default DropdownTest;