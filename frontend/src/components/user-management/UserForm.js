/**
 * UserForm Component
 * 
 * Handles user creation and editing forms with validation.
 * Extracted from UserManagement.js to improve maintainability.
 * 
 * Features:
 * - Create and edit user forms
 * - Role-based field visibility
 * - Store assignment
 * - Form validation
 * - Professional styling
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import FormField from '../common/FormField';

/**
 * UserForm Component - User creation and editing form
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data object
 * @param {Function} props.onChange - Form change handler
 * @param {Array} props.stores - Available stores list
 * @param {boolean} props.isEditing - Whether in edit mode
 * @param {Object} props.currentUser - Current logged-in user
 * @param {boolean} props.isAdmin - Whether current user is admin
 * @param {boolean} props.isGodMode - Whether current user has god mode
 * @param {Object} props.validationErrors - Form validation errors
 * @returns {JSX.Element} The user form component
 */
const UserForm = ({
  formData,
  onChange,
  stores = [],
  isEditing = false,
  currentUser,
  isAdmin = false,
  isGodMode = false,
  validationErrors = {}
}) => {

  const handleFieldChange = (name, value) => {
    onChange({
      ...formData,
      [name]: value
    });
  };

  // Role options based on current user permissions
  const getRoleOptions = () => {
    if (isGodMode) {
      return [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' },
        { value: 'god_mode', label: 'God Mode' }
      ];
    } else if (isAdmin) {
      return [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' }
      ];
    } else {
      return [
        { value: 'user', label: 'User' }
      ];
    }
  };

  // Store options for dropdown
  const getStoreOptions = () => {
    return stores.map(store => ({
      value: store.id,
      label: store.name
    }));
  };

  return (
    <Form>
      <Row>
        <Col md={12}>
          <FormField
            label="Full Name"
            name="name"
            value={formData.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            required
            placeholder="Enter full name"
            error={validationErrors.name}
          />
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            required
            placeholder="Enter email address"
            error={validationErrors.email}
          />
        </Col>
      </Row>

      {!isEditing && (
        <Row>
          <Col md={12}>
            <FormField
              label="Password"
              name="password"
              type="password"
              value={formData.password || ''}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              required
              placeholder="Enter password"
              error={validationErrors.password}
              helpText="Password must be at least 8 characters"
            />
          </Col>
        </Row>
      )}

      <Row>
        <Col md={6}>
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="Enter phone number"
            error={validationErrors.phone}
          />
        </Col>
        <Col md={6}>
          <FormField
            label="Role"
            name="role"
            type="select"
            value={formData.role || 'user'}
            onChange={(e) => handleFieldChange('role', e.target.value)}
            options={getRoleOptions()}
            required
            error={validationErrors.role}
            disabled={!isAdmin && !isGodMode}
          />
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <FormField
            label="Address"
            name="address"
            type="textarea"
            rows={3}
            value={formData.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="Enter address"
            error={validationErrors.address}
          />
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <FormField
            label="Assigned Store"
            name="store_id"
            type="select"
            value={formData.store_id || ''}
            onChange={(e) => handleFieldChange('store_id', e.target.value)}
            options={[
              { value: '', label: 'Select a store...' },
              ...getStoreOptions()
            ]}
            required
            error={validationErrors.store_id}
            helpText="Select the primary store for this user"
          />
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="is_active"
              label="Active User"
              checked={formData.is_active !== false}
              onChange={(e) => handleFieldChange('is_active', e.target.checked)}
              disabled={isEditing && formData.id === currentUser?.id}
            />
            {isEditing && formData.id === currentUser?.id && (
              <Form.Text className="text-muted">
                You cannot deactivate your own account
              </Form.Text>
            )}
          </Form.Group>
        </Col>
      </Row>

      {/* Additional notes for editing */}
      {isEditing && (
        <Row>
          <Col md={12}>
            <div className="bg-light p-3 rounded">
              <small className="text-muted">
                <strong>Note:</strong> To change the password, use the "Change Password" action.
                Role changes may affect user permissions immediately.
              </small>
            </div>
          </Col>
        </Row>
      )}
    </Form>
  );
};

export default UserForm;