import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Table, 
  Badge, 
  Form, 
  Modal,
  Button,
  Alert,
  Spinner,
  InputGroup,
  Pagination,
  ButtonGroup
} from 'react-bootstrap';
import PharmaDropdown from './common/PharmaDropdown';
import { userAPI, storeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DraggableDialog from './DraggableDialog';
import FormField from './common/FormField';
import FormModal from './common/FormModal';
import DataTable from './common/DataTable';
import ActionButtonGroup from './common/ActionButtonGroup';
import SearchFilterBar from './common/SearchFilterBar';
import { PharmaCard, PharmaAlert, PharmaButton, PharmaModal } from './common/PharmaComponents';

// Custom CSS for professional solid buttons
const buttonStyles = `
  .btn-gradient-edit {
    background: #2563eb !important;
    border: none !important;
    border-bottom: 2px solid #1e40af !important;
    border-radius: 6px !important;
    color: white !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 10px !important;
    letter-spacing: 0.5px !important;
    padding: 7px 14px !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2) !important;
  }
  
  .btn-gradient-edit:hover {
    background: #1d4ed8 !important;
    border-bottom: 2px solid #1e40af !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3) !important;
    color: white !important;
  }
  
  .btn-gradient-edit:active {
    transform: translateY(0) !important;
    background: #1e40af !important;
    border-bottom: 2px solid #1e3a8a !important;
  }
  
  .btn-gradient-password {
    background: #d97706 !important;
    border: none !important;
    border-bottom: 2px solid #92400e !important;
    border-radius: 6px !important;
    color: white !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 10px !important;
    letter-spacing: 0.5px !important;
    padding: 7px 14px !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2) !important;
  }
  
  .btn-gradient-password:hover {
    background: #b45309 !important;
    border-bottom: 2px solid #92400e !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(217, 119, 6, 0.3) !important;
    color: white !important;
  }
  
  .btn-gradient-password:active {
    transform: translateY(0) !important;
    background: #92400e !important;
    border-bottom: 2px solid #78350f !important;
  }
  
  .btn-gradient-delete {
    background: #dc2626 !important;
    border: none !important;
    border-bottom: 2px solid #991b1b !important;
    border-radius: 6px !important;
    color: white !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 10px !important;
    letter-spacing: 0.5px !important;
    padding: 7px 14px !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2) !important;
  }
  
  .btn-gradient-delete:hover {
    background: #b91c1c !important;
    border-bottom: 2px solid #991b1b !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3) !important;
    color: white !important;
  }
  
  .btn-gradient-delete:active {
    transform: translateY(0) !important;
    background: #991b1b !important;
    border-bottom: 2px solid #7f1d1d !important;
  }
  
  .btn-gradient-disabled {
    background: #6b7280 !important;
    border: none !important;
    border-bottom: 2px solid #4b5563 !important;
    border-radius: 6px !important;
    color: white !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 10px !important;
    letter-spacing: 0.5px !important;
    padding: 7px 14px !important;
    opacity: 0.6 !important;
    cursor: not-allowed !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
  }
  
  .btn-gradient-disabled:hover {
    background: #6b7280 !important;
    border-bottom: 2px solid #4b5563 !important;
    color: white !important;
    opacity: 0.6 !important;
    transform: none !important;
  }
  
  /* Professional Windows-style dialog */
  .professional-dialog .modal-dialog {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    width: 420px !important;
    max-width: 90vw !important;
    transition: none !important;
  }
  
  .professional-dialog .modal-dialog.dragging {
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
  }
  
  .professional-dialog .modal-content {
    border-radius: 0 !important;
    border: 2px solid #2c3e50 !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
    position: relative !important;
  }
  
  .professional-dialog .modal-header {
    background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%) !important;
    border-bottom: none !important;
    border-radius: 0 !important;
    padding: 6px 8px !important;
    min-height: 32px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    cursor: move !important;
    user-select: none !important;
  }
  
  .professional-dialog .modal-header:active {
    cursor: grabbing !important;
  }
  
  .professional-dialog .modal-title {
    font-size: 13px !important;
    font-weight: 400 !important;
    color: white !important;
    margin: 0 !important;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
  }
  
  .professional-dialog .btn-close {
    background: #e81123 !important;
    border: none !important;
    font-size: 12px !important;
    color: white !important;
    padding: 0 !important;
    width: 24px !important;
    height: 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    opacity: 1 !important;
    margin: 0 !important;
  }
  
  .professional-dialog .btn-close:hover {
    background: #f1707a !important;
    color: white !important;
  }
  
  .professional-dialog .btn-close::before {
    content: '×' !important;
    font-size: 16px !important;
    line-height: 1 !important;
  }
  
  .professional-dialog .modal-body {
    padding: 16px !important;
    background: #f0f0f0 !important;
    font-size: 13px !important;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
    line-height: 1.4 !important;
  }
  
  .professional-dialog .modal-footer {
    background: #f0f0f0 !important;
    border-top: 1px solid #d0d0d0 !important;
    border-radius: 0 !important;
    padding: 10px 16px !important;
    gap: 8px !important;
    justify-content: flex-end !important;
  }
  
  .professional-dialog .alert {
    border-radius: 0 !important;
    border: 1px solid #d0d0d0 !important;
    border-left: 3px solid #f59e0b !important;
    background: white !important;
    padding: 8px 12px !important;
    margin-bottom: 12px !important;
    font-size: 13px !important;
    line-height: 1.3 !important;
  }
  
  .professional-dialog .alert-danger {
    border-left-color: #e81123 !important;
    background: white !important;
    color: #333 !important;
  }
  
  .professional-dialog .alert-info {
    border-left-color: #0078d4 !important;
    background: white !important;
    color: #333 !important;
  }
  
  .professional-dialog .alert-warning {
    border-left-color: #ff8c00 !important;
    background: white !important;
    color: #333 !important;
  }
  
  .professional-dialog .alert i {
    font-size: 12px !important;
    margin-right: 6px !important;
  }
  
  .professional-dialog .btn {
    border-radius: 0 !important;
    font-size: 11px !important;
    font-weight: 400 !important;
    padding: 6px 20px !important;
    border: 1px solid #ababab !important;
    text-transform: none !important;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
    min-width: 75px !important;
    height: 23px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  .professional-dialog .btn-secondary {
    background: #e1e1e1 !important;
    border-color: #ababab !important;
    color: #000 !important;
  }
  
  .professional-dialog .btn-secondary:hover {
    background: #e5f1fb !important;
    border-color: #0078d4 !important;
    color: #000 !important;
  }
  
  .professional-dialog .btn-danger {
    background: #e1e1e1 !important;
    border-color: #ababab !important;
    color: #000 !important;
  }
  
  .professional-dialog .btn-danger:hover {
    background: #e5f1fb !important;
    border-color: #0078d4 !important;
    color: #000 !important;
  }
  
  .professional-dialog .btn-danger:disabled {
    background: #f0f0f0 !important;
    border-color: #d0d0d0 !important;
    color: #808080 !important;
    opacity: 1 !important;
  }
`;

// Add styles to document head with force refresh
if (typeof document !== 'undefined') {
  // Remove existing styles first
  const existingStyle = document.querySelector('[data-gradient-buttons]');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Add new styles
  const styleElement = document.createElement('style');
  styleElement.textContent = buttonStyles;
  styleElement.setAttribute('data-gradient-buttons', 'true');
  document.head.appendChild(styleElement);
}

const UserManagement = () => {
  const { user: currentUser, isAdmin, isGodMode } = useAuth();
  
  
  // Force style injection on component mount
  useEffect(() => {
    // Remove any existing gradient button styles
    const existingStyle = document.querySelector('[data-gradient-buttons]');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add fresh styles
    const styleElement = document.createElement('style');
    styleElement.textContent = buttonStyles;
    styleElement.setAttribute('data-gradient-buttons', 'true');
    document.head.appendChild(styleElement);
    
    return () => {
      // Cleanup on unmount
      const style = document.querySelector('[data-gradient-buttons]');
      if (style) {
        style.remove();
      }
    };
  }, []);
  
  
  // State management
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
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    role: 'user',
    store_id: ''
  });
  
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    role: 'user',
    store_id: '',
    is_active: true
  });
  
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState(''); // Store filter for god_mode users
  
  const usersPerPage = 10;

  // Load users and stores
  useEffect(() => {
    loadUsers();
    loadStores();
  }, [currentPage, searchTerm, roleFilter, activeFilter, storeFilter]);

  const loadStores = async () => {
    try {
      const response = await storeAPI.getAll({ limit: 100 });
      setStores(response.data.stores || []);
    } catch (err) {
      console.error('Failed to load stores:', err);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin()) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: usersPerPage
      };
      
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== '') params.active = activeFilter === 'true';
      
      // Add store filter for god_mode users
      if (storeFilter && isGodMode()) params.store_id = storeFilter;

      // God mode users should see ALL users across ALL stores (unless filtered)
      const response = isGodMode() ? 
        await userAPI.getAllUsers(params) : // Use /all endpoint for god_mode
        await userAPI.getAll(params);       // Use regular endpoint for admin
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (createForm.password !== createForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!createForm.store_id) {
      setError('Store assignment is required');
      return;
    }

    try {
      setLoading(true);
      await userAPI.create({
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone,
        password: createForm.password,
        address: createForm.address,
        role: createForm.role,
        store_id: createForm.store_id
      });
      
      setSuccess('User created successfully');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        address: '',
        role: 'user',
        store_id: ''
      });
      loadUsers();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await userAPI.update(selectedUser.id, editForm);
      setSuccess('User updated successfully');
      setShowEditModal(false);
      loadUsers();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to update user');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await userAPI.updatePassword(selectedUser.id, {
        new_password: passwordForm.new_password
      });
      setSuccess('Password updated successfully');
      setShowPasswordModal(false);
      setPasswordForm({ new_password: '', confirm_password: '' });
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      await userAPI.delete(selectedUser.id);
      setSuccess('User deactivated successfully');
      setShowDeleteModal(false);
      loadUsers();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setShowCreateModal(true);
    setError('');
  };

  // Helper function for form field changes
  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to generate action buttons for each user row
  const getUserActions = (user) => {
    const isCurrentUser = user.id === currentUser.id;
    const isAdminUser = user.role === 'admin';
    const currentUserIsGodMode = isGodMode();
    
    const actions = [
      {
        label: 'Edit',
        icon: 'fas fa-edit',
        onClick: () => openEditModal(user),
        variant: 'edit',
        title: 'Edit User'
      },
      {
        label: 'Password',
        icon: 'fas fa-key',
        onClick: () => openPasswordModal(user),
        variant: 'password',
        title: 'Change Password'
      }
    ];

    // Add delete button logic:
    // - Always show for non-admin users (regular users)
    // - Show for admin users only if current user is god_mode
    // - Never show for god_mode users (they should not be deletable)
    const shouldShowDelete = (
      (!isAdminUser) || // Regular users can always be deleted
      (isAdminUser && currentUserIsGodMode && user.role !== 'god_mode') // God mode can delete admins but not other god_mode users
    );

    if (shouldShowDelete) {
      // For admin users, check if they're the last admin in their store
      let isLastAdminInStore = false;
      if (isAdminUser && user.store_name) {
        const adminsInSameStore = users.filter(u => 
          u.role === 'admin' && 
          u.store_name === user.store_name && 
          u.is_active
        );
        isLastAdminInStore = adminsInSameStore.length <= 1;
      }

      actions.push({
        label: 'Delete',
        icon: 'fas fa-trash',
        onClick: () => openDeleteModal(user),
        variant: 'delete',
        title: isCurrentUser ? "Cannot delete your own account" : 
               isLastAdminInStore ? "Cannot delete - last admin for this store" : 
               "Delete User",
        disabled: isCurrentUser || isLastAdminInStore
      });
    }

    return actions;
  };

  // Column definitions for DataTable
  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <strong>{row.name}</strong>
          <div className="text-muted small">{row.email}</div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true
    },
    {
      key: 'store_name',
      label: 'Store',
      sortable: true,
      render: (value, row) => (
        <div>
          <span>{row.store_name}</span>
          {row.store_state && (
            <div className="text-muted small">{row.store_state}</div>
          )}
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => {
        const badgeProps = {
          'admin': { bg: 'primary', text: 'Admin' },
          'god_mode': { bg: 'danger', text: 'God Mode' },
          'user': { bg: 'secondary', text: 'User' }
        };
        const props = badgeProps[value] || badgeProps['user'];
        return (
          <Badge bg={props.bg}>
            {props.text}
          </Badge>
        );
      }
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge bg={value ? 'success' : 'danger'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'date_created',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
      className: 'small text-muted'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => <ActionButtonGroup actions={getUserActions(row)} />
    }
  ];

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      store_id: user.store_id,
      is_active: user.is_active
    });
    setShowEditModal(true);
    setError('');
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordForm({ new_password: '', confirm_password: '' });
    setShowPasswordModal(true);
    setError('');
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setError('');
    
    // Pre-validate admin deletion restrictions for god_mode users
    if (user.role === 'admin' && user.store_name && isGodMode()) {
      // Count active admins in the same store
      const adminsInSameStore = users.filter(u => 
        u.role === 'admin' && 
        u.store_name === user.store_name && 
        u.is_active
      );
      
      if (adminsInSameStore.length <= 1) {
        setError(`Warning: ${user.name} is the last admin for ${user.store_name}. Each store must have at least one admin.`);
      }
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!isAdmin()) {
    return (
      <Container fluid className="p-4">
        <PharmaAlert variant="danger" title="Access Denied" icon="🚫">
          You must be an admin to access this page.
        </PharmaAlert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <PharmaCard
            title="User Management"
            subtitle="Manage users in your store"
            headerIcon="👥"
            headerActions={[{
              label: 'Add User',
              variant: 'primary',
              icon: '➕',
              onClick: openCreateModal
            }]}
          >
              {/* Alerts */}
              {error && <PharmaAlert variant="danger" dismissible onClose={() => setError('')}>{error}</PharmaAlert>}
              {success && <PharmaAlert variant="success" dismissible onClose={() => setSuccess('')} autoClose={true}>{success}</PharmaAlert>}
              
              <SearchFilterBar
                searchPlaceholder="Search users..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={[
                  {
                    label: "Role",
                    value: roleFilter,
                    onChange: setRoleFilter,
                    options: [
                      { value: "", label: "All Roles" },
                      { value: "admin", label: "Admin" },
                      { value: "user", label: "User" },
                      ...(isGodMode() ? [{ value: "god_mode", label: "God Mode" }] : [])
                    ]
                  },
                  // Store filter - only visible to god_mode users
                  ...(isGodMode() ? [{
                    label: "Store",
                    value: storeFilter,
                    onChange: setStoreFilter,
                    options: [
                      { value: "", label: "All Stores" },
                      ...stores.map(store => ({
                        value: store.id.toString(),
                        label: store.name
                      }))
                    ]
                  }] : []),
                  {
                    label: "Status",
                    value: activeFilter,
                    onChange: setActiveFilter,
                    options: [
                      { value: "", label: "All Status" },
                      { value: "true", label: "Active" },
                      { value: "false", label: "Inactive" }
                    ]
                  }
                ]}
                additionalActions={
                  <PharmaButton 
                    variant="outline-secondary" 
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('');
                      setActiveFilter('');
                      setCurrentPage(1);
                    }}
                  >
                    Clear
                  </PharmaButton>
                }
                showCard={false}
              />

              <DataTable
                columns={userColumns}
                data={users}
                striped
                hover
                responsive
                emptyMessage="No users found"
                loading={loading}
                loadingContent="Loading users..."
                pagination={{
                  currentPage: currentPage,
                  totalPages: totalPages,
                  onPageChange: setCurrentPage
                }}
              />
          </PharmaCard>
        </Col>
      </Row>

      {/* Create User Modal */}
      <FormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        title="Add New User"
        size="lg"
        onSubmit={handleCreateUser}
        loading={loading}
        submitText="Create User"
      >
        <Row>
          <Col md={6}>
            <FormField
              label="Name"
              name="name"
              value={createForm.name}
              onChange={handleCreateFormChange}
              required
            />
          </Col>
          <Col md={6}>
            <FormField
              label="Email"
              name="email"
              type="email"
              value={createForm.email}
              onChange={handleCreateFormChange}
              required
            />
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={createForm.phone}
              onChange={handleCreateFormChange}
              required
            />
          </Col>
          <Col md={6}>
            <FormField
              label="Role"
              name="role"
              type="select"
              value={createForm.role}
              onChange={handleCreateFormChange}
              options={[
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
                ...(isGodMode() ? [{ value: 'god_mode', label: 'God Mode' }] : [])
              ]}
              required
            />
          </Col>
        </Row>
        <FormField
          label="Store"
          name="store_id"
          type="select"
          value={createForm.store_id}
          onChange={handleCreateFormChange}
          options={[
            { value: '', label: 'Select Store' },
            ...(isGodMode() ? 
              // God mode users can assign users to any store
              stores.map(store => ({
                value: store.id,
                label: `${store.name} - ${store.state}`
              })) :
              // Admin users can only assign users to their own store
              stores.filter(store => store.id === currentUser.store_id).map(store => ({
                value: store.id,
                label: `${store.name} - ${store.state}`
              }))
            )
          ]}
          required
        />
        <FormField
          label="Address"
          name="address"
          type="textarea"
          rows={2}
          value={createForm.address}
          onChange={handleCreateFormChange}
          required
        />
        <Row>
          <Col md={6}>
            <FormField
              label="Password"
              name="password"
              type="password"
              value={createForm.password}
              onChange={handleCreateFormChange}
              inputProps={{ minLength: 8 }}
              required
            />
          </Col>
          <Col md={6}>
            <FormField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={createForm.confirmPassword}
              onChange={handleCreateFormChange}
              inputProps={{ minLength: 8 }}
              required
            />
          </Col>
        </Row>
      </FormModal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User: {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <PharmaDropdown
                    variant="outline-secondary"
                    className="w-100"
                    trigger="click"
                    align="start"
                    pharmaType="pill"
                    size="md"
                    label={
                      editForm.role === 'admin' ? 'Admin' : 
                      editForm.role === 'god_mode' ? 'God Mode' : 
                      'User'
                    }
                    menuClassName="w-100"
                  >
                    <button
                      className={`dropdown-item ${editForm.role === 'user' ? 'active' : ''}`}
                      onClick={() => setEditForm({...editForm, role: 'user'})}
                    >
                      User
                    </button>
                    <button
                      className={`dropdown-item ${editForm.role === 'admin' ? 'active' : ''}`}
                      onClick={() => setEditForm({...editForm, role: 'admin'})}
                    >
                      Admin
                    </button>
                    {isGodMode() && (
                      <button
                        className={`dropdown-item ${editForm.role === 'god_mode' ? 'active' : ''}`}
                        onClick={() => setEditForm({...editForm, role: 'god_mode'})}
                      >
                        God Mode
                      </button>
                    )}
                  </PharmaDropdown>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <PharmaDropdown
                    variant="outline-secondary"
                    className="w-100"
                    trigger="click"
                    align="start"
                    pharmaType="pill"
                    size="md"
                    label={editForm.is_active ? 'Active' : 'Inactive'}
                    menuClassName="w-100"
                  >
                    <button
                      className={`dropdown-item ${editForm.is_active === true ? 'active' : ''}`}
                      onClick={() => setEditForm({...editForm, is_active: true})}
                    >
                      Active
                    </button>
                    <button
                      className={`dropdown-item ${editForm.is_active === false ? 'active' : ''}`}
                      onClick={() => setEditForm({...editForm, is_active: false})}
                    >
                      Inactive
                    </button>
                  </PharmaDropdown>
                </Form.Group>
              </Col>
            </Row>
            
            {/* Store selection - only visible to god_mode users */}
            {isGodMode() && (
              <Row>
                <Col md={12}>
                  {/* Show warning if store is being changed */}
                  {selectedUser && parseInt(editForm.store_id) !== selectedUser.store_id && (
                    <PharmaAlert
                      variant="warning"
                      className="mb-3"
                      dismissible={false}
                    >
                      ⚠️ <strong>Store Transfer:</strong> You are moving this user from "{selectedUser.store_name}" to "{stores.find(s => s.id === parseInt(editForm.store_id))?.name}". This will affect their access permissions and inventory visibility.
                    </PharmaAlert>
                  )}
                  <Form.Group className="mb-3">
                    <Form.Label>Store Assignment *</Form.Label>
                    <PharmaDropdown
                      variant="outline-secondary"
                      className="w-100"
                      trigger="click"
                      align="start"
                      pharmaType="pill"
                      size="md"
                      label={stores.find(s => s.id === parseInt(editForm.store_id))?.name || 'Select Store'}
                      menuClassName="w-100"
                    >
                      {stores.map(store => (
                        <button
                          key={store.id}
                          className={`dropdown-item ${editForm.store_id === store.id.toString() ? 'active' : ''}`}
                          onClick={() => setEditForm({...editForm, store_id: store.id})}
                        >
                          {store.name}
                        </button>
                      ))}
                    </PharmaDropdown>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Update User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Password Update Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password: {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdatePassword}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>New Password *</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                required
                minLength={8}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password *</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                required
                minLength={8}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="warning" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Update Password'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DraggableDialog
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title="Delete User Confirmation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteUser} 
              disabled={loading || selectedUser?.id === currentUser.id}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Delete User'}
            </Button>
          </>
        }
      >
        <Alert variant="warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?
          This action cannot be undone.
        </Alert>
        
        {selectedUser?.id === currentUser.id && (
          <Alert variant="danger">
            <i className="fas fa-ban me-2"></i>
            <strong>Blocked:</strong> You cannot delete your own account.
          </Alert>
        )}

        {selectedUser?.role === 'admin' && selectedUser?.store_name && isGodMode() && (
          (() => {
            const adminsInSameStore = users.filter(u => 
              u.role === 'admin' && 
              u.store_name === selectedUser.store_name && 
              u.is_active
            );
            
            if (adminsInSameStore.length <= 1) {
              return (
                <Alert variant="danger">
                  <i className="fas fa-shield-alt me-2"></i>
                  <strong>Blocked:</strong> {selectedUser.name} is the last admin for {selectedUser.store_name}. 
                  Each store must have at least one admin. Add another admin to this store before deleting this user.
                </Alert>
              );
            } else {
              return (
                <Alert variant="info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>God Mode Privilege:</strong> Deleting this admin will leave {adminsInSameStore.length - 1} other admin(s) 
                  for {selectedUser.store_name}. This action is only allowed for god_mode users.
                </Alert>
              );
            }
          })()
        )}

        {selectedUser?.role === 'admin' && !isGodMode() && (
          <Alert variant="danger">
            <i className="fas fa-user-shield me-2"></i>
            <strong>Access Denied:</strong> Admin users can only be deleted by god_mode users.
          </Alert>
        )}
      </DraggableDialog>
    </Container>
  );
};

export default UserManagement;