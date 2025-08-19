/**
 * User Management Component (Refactored)
 * 
 * Comprehensive user management system for pharmacy operations.
 * This is the refactored version that uses extracted components for better maintainability.
 * 
 * Key Features:
 * - User CRUD operations (Create, Read, Update, Delete)
 * - Role-based access control
 * - Store assignment management
 * - Password management
 * - Professional Windows-style dialogs
 * - Responsive table display
 * 
 * Architecture:
 * - Main orchestrator component
 * - Extracted UserForm for user creation/editing
 * - Extracted UserTable for user display
 * - Extracted UserModals for dialog handling
 * - External CSS for styling
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 2.0.0 (Refactored)
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { userAPI, storeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SearchFilterBar from './common/SearchFilterBar';
import { UserTable, UserModals } from './user-management';
import './user-management/userStyles.css';

/**
 * UserManagement Component - Main user management interface
 * 
 * @returns {JSX.Element} The complete user management system
 */
const UserManagement = () => {
  const { user: currentUser, isAdmin, isGodMode } = useAuth();

  // Core state
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'user',
    store_id: '',
    is_active: true
  });

  const [editForm, setEditForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    newPassword: ''
  });

  // Validation and filtering
  const [validationErrors, setValidationErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadUsers();
    loadStores();
  }, []);

  /**
   * Load users from API
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userAPI.getUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        throw new Error(response.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load stores from API
   */
  const loadStores = async () => {
    try {
      const response = await storeAPI.getStores();
      if (response.success) {
        setStores(response.data);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  /**
   * Filter users based on search and filter criteria
   */
  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStore = !storeFilter || user.store_id === parseInt(storeFilter);
      
      return matchesSearch && matchesRole && matchesStore;
    });
  };

  /**
   * Reset form data
   */
  const resetForms = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      role: 'user',
      store_id: '',
      is_active: true
    });
    setEditForm({});
    setPasswordForm({ newPassword: '' });
    setValidationErrors({});
  };

  /**
   * Handle create user
   */
  const handleCreateUser = async () => {
    try {
      setLoading(true);
      setValidationErrors({});
      
      const response = await userAPI.createUser(createForm);
      if (response.success) {
        setSuccess('User created successfully');
        setShowCreateModal(false);
        resetForms();
        await loadUsers();
      } else {
        if (response.validationErrors) {
          setValidationErrors(response.validationErrors);
        } else {
          throw new Error(response.error || 'Failed to create user');
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle edit user
   */
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({ ...user });
    setShowEditModal(true);
    setValidationErrors({});
  };

  /**
   * Handle update user
   */
  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      setValidationErrors({});
      
      const response = await userAPI.updateUser(selectedUser.id, editForm);
      if (response.success) {
        setSuccess('User updated successfully');
        setShowEditModal(false);
        resetForms();
        await loadUsers();
      } else {
        if (response.validationErrors) {
          setValidationErrors(response.validationErrors);
        } else {
          throw new Error(response.error || 'Failed to update user');
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle change password
   */
  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: '' });
    setShowPasswordModal(true);
  };

  /**
   * Handle password change submit
   */
  const handlePasswordSubmit = async () => {
    try {
      setLoading(true);
      
      const response = await userAPI.changePassword(selectedUser.id, {
        newPassword: passwordForm.newPassword
      });
      
      if (response.success) {
        setSuccess('Password changed successfully');
        setShowPasswordModal(false);
        resetForms();
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete user
   */
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      
      const response = await userAPI.deleteUser(selectedUser.id);
      if (response.success) {
        setSuccess('User deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        await loadUsers();
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Filter options for search bar
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'user', label: 'Users' },
    { value: 'admin', label: 'Admins' },
    ...(isGodMode ? [{ value: 'god_mode', label: 'God Mode' }] : [])
  ];

  const storeOptions = [
    { value: '', label: 'All Stores' },
    ...stores.map(store => ({
      value: store.id.toString(),
      label: store.name
    }))
  ];

  return (
    <div className="user-management-container">
      <Container fluid>
        
        {/* Alerts */}
        {error && (
          <Row className="mb-3">
            <Col>
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {success && (
          <Row className="mb-3">
            <Col>
              <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                {success}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Search and Filter Bar */}
        <SearchFilterBar
          searchPlaceholder="Search users by name or email..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              key: 'role',
              label: 'Filter by Role',
              type: 'select',
              value: roleFilter,
              onChange: setRoleFilter,
              options: roleOptions
            },
            {
              key: 'store',
              label: 'Filter by Store',
              type: 'select',
              value: storeFilter,
              onChange: setStoreFilter,
              options: storeOptions
            }
          ]}
          additionalActions={
            <Button 
              variant="primary" 
              onClick={() => {
                resetForms();
                setShowCreateModal(true);
              }}
              disabled={loading || (!isAdmin && !isGodMode)}
            >
              + Create User
            </Button>
          }
        />

        {/* User Table */}
        <Row>
          <Col>
            <UserTable
              users={getFilteredUsers()}
              stores={stores}
              loading={loading}
              currentUser={currentUser}
              isAdmin={isAdmin}
              isGodMode={isGodMode}
              onEdit={handleEditUser}
              onPassword={handleChangePassword}
              onDelete={handleDeleteUser}
            />
          </Col>
        </Row>

        {/* User Modals */}
        <UserModals
          showCreate={showCreateModal}
          showEdit={showEditModal}
          showPassword={showPasswordModal}
          showDelete={showDeleteModal}
          onHideCreate={() => setShowCreateModal(false)}
          onHideEdit={() => setShowEditModal(false)}
          onHidePassword={() => setShowPasswordModal(false)}
          onHideDelete={() => setShowDeleteModal(false)}
          createForm={createForm}
          editForm={editForm}
          passwordForm={passwordForm}
          onCreateFormChange={setCreateForm}
          onEditFormChange={setEditForm}
          onPasswordFormChange={setPasswordForm}
          onCreateSubmit={handleCreateUser}
          onEditSubmit={handleUpdateUser}
          onPasswordSubmit={handlePasswordSubmit}
          onDeleteConfirm={handleDeleteConfirm}
          stores={stores}
          selectedUser={selectedUser}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isGodMode={isGodMode}
          loading={loading}
          validationErrors={validationErrors}
        />
      </Container>
    </div>
  );
};

export default UserManagement;