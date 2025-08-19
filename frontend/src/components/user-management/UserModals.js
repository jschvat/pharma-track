/**
 * UserModals Component
 * 
 * Handles all user-related modal dialogs (create, edit, password, delete).
 * Extracted from UserManagement.js to improve maintainability.
 * 
 * Features:
 * - Create user modal with form
 * - Edit user modal with form
 * - Change password modal
 * - Delete confirmation modal
 * - Professional Windows-style dialogs
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import DraggableDialog from '../DraggableDialog';
import FormField from '../common/FormField';
import UserForm from './UserForm';

/**
 * UserModals Component - All user-related modal dialogs
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.showCreate - Show create user modal
 * @param {boolean} props.showEdit - Show edit user modal
 * @param {boolean} props.showPassword - Show password change modal
 * @param {boolean} props.showDelete - Show delete confirmation modal
 * @param {Function} props.onHideCreate - Hide create modal handler
 * @param {Function} props.onHideEdit - Hide edit modal handler
 * @param {Function} props.onHidePassword - Hide password modal handler
 * @param {Function} props.onHideDelete - Hide delete modal handler
 * @param {Object} props.createForm - Create form data
 * @param {Object} props.editForm - Edit form data
 * @param {Object} props.passwordForm - Password form data
 * @param {Function} props.onCreateFormChange - Create form change handler
 * @param {Function} props.onEditFormChange - Edit form change handler
 * @param {Function} props.onPasswordFormChange - Password form change handler
 * @param {Function} props.onCreateSubmit - Create user submit handler
 * @param {Function} props.onEditSubmit - Edit user submit handler
 * @param {Function} props.onPasswordSubmit - Password change submit handler
 * @param {Function} props.onDeleteConfirm - Delete confirmation handler
 * @param {Array} props.stores - Available stores
 * @param {Object} props.selectedUser - Currently selected user
 * @param {Object} props.currentUser - Current logged-in user
 * @param {boolean} props.isAdmin - Whether current user is admin
 * @param {boolean} props.isGodMode - Whether current user has god mode
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.validationErrors - Form validation errors
 * @returns {JSX.Element} The user modals component
 */
const UserModals = ({
  showCreate,
  showEdit,
  showPassword,
  showDelete,
  onHideCreate,
  onHideEdit,
  onHidePassword,
  onHideDelete,
  createForm,
  editForm,
  passwordForm,
  onCreateFormChange,
  onEditFormChange,
  onPasswordFormChange,
  onCreateSubmit,
  onEditSubmit,
  onPasswordSubmit,
  onDeleteConfirm,
  stores = [],
  selectedUser,
  currentUser,
  isAdmin = false,
  isGodMode = false,
  loading = false,
  validationErrors = {}
}) => {

  const [passwordValidation, setPasswordValidation] = useState({
    confirmPassword: '',
    errors: {}
  });

  // Password form validation
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (passwordForm.newPassword !== passwordValidation.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  // Enhanced password submit with validation
  const handlePasswordSubmit = () => {
    const errors = validatePasswordForm();
    setPasswordValidation({ ...passwordValidation, errors });
    
    if (Object.keys(errors).length === 0) {
      onPasswordSubmit();
    }
  };

  return (
    <>
      {/* Create User Modal */}
      <DraggableDialog
        show={showCreate}
        onHide={onHideCreate}
        title="Create New User"
        width={500}
        height={600}
        className="professional-dialog"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHideCreate}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={onCreateSubmit}
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Create User'}
            </Button>
          </div>
        }
      >
        <UserForm
          formData={createForm}
          onChange={onCreateFormChange}
          stores={stores}
          isEditing={false}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isGodMode={isGodMode}
          validationErrors={validationErrors}
        />
      </DraggableDialog>

      {/* Edit User Modal */}
      <DraggableDialog
        show={showEdit}
        onHide={onHideEdit}
        title={`Edit User: ${selectedUser?.name || ''}`}
        width={500}
        height={580}
        className="professional-dialog"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHideEdit}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={onEditSubmit}
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Update User'}
            </Button>
          </div>
        }
      >
        <UserForm
          formData={editForm}
          onChange={onEditFormChange}
          stores={stores}
          isEditing={true}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isGodMode={isGodMode}
          validationErrors={validationErrors}
        />
      </DraggableDialog>

      {/* Change Password Modal */}
      <DraggableDialog
        show={showPassword}
        onHide={onHidePassword}
        title={`Change Password: ${selectedUser?.name || ''}`}
        width={400}
        height={300}
        className="professional-dialog"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHidePassword}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handlePasswordSubmit}
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Change Password'}
            </Button>
          </div>
        }
      >
        <div>
          <FormField
            label="New Password"
            name="newPassword"
            type="password"
            value={passwordForm.newPassword || ''}
            onChange={(e) => onPasswordFormChange({
              ...passwordForm,
              newPassword: e.target.value
            })}
            required
            placeholder="Enter new password"
            error={passwordValidation.errors.newPassword}
            helpText="Password must be at least 8 characters"
          />
          
          <FormField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={passwordValidation.confirmPassword}
            onChange={(e) => setPasswordValidation({
              ...passwordValidation,
              confirmPassword: e.target.value
            })}
            required
            placeholder="Confirm new password"
            error={passwordValidation.errors.confirmPassword}
          />

          <div className="bg-light p-3 rounded mt-3">
            <small className="text-muted">
              <strong>Note:</strong> The user will need to log in again with the new password.
              Make sure to communicate the password change to the user.
            </small>
          </div>
        </div>
      </DraggableDialog>

      {/* Delete User Modal */}
      <DraggableDialog
        show={showDelete}
        onHide={onHideDelete}
        title="Confirm Delete User"
        width={400}
        height={280}
        className="professional-dialog"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHideDelete}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={onDeleteConfirm}
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Delete User'}
            </Button>
          </div>
        }
      >
        <div>
          <Alert variant="danger">
            <Alert.Heading className="h6">
              ⚠️ Warning: This action cannot be undone
            </Alert.Heading>
            <p className="mb-0">
              Are you sure you want to delete the user <strong>{selectedUser?.name}</strong>?
            </p>
          </Alert>

          {selectedUser && (
            <div className="bg-light p-3 rounded">
              <div><strong>Name:</strong> {selectedUser.name}</div>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>Role:</strong> {selectedUser.role}</div>
              <div><strong>Status:</strong> {selectedUser.is_active ? 'Active' : 'Inactive'}</div>
            </div>
          )}

          <div className="mt-3">
            <small className="text-muted">
              This will permanently remove the user from the system. All associated data and 
              access will be revoked immediately.
            </small>
          </div>
        </div>
      </DraggableDialog>
    </>
  );
};

export default UserModals;