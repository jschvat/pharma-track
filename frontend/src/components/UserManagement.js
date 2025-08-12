import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Form, 
  Modal, 
  Alert, 
  Spinner,
  InputGroup,
  Pagination
} from 'react-bootstrap';
import { userAPI, storeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DraggableDialog from './DraggableDialog';

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
  const { user: currentUser, isAdmin } = useAuth();
  
  
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
  
  const usersPerPage = 10;

  // Load users and stores
  useEffect(() => {
    loadUsers();
    loadStores();
  }, [currentPage, searchTerm, roleFilter, activeFilter]);

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

      const response = await userAPI.getAll(params);
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
      setSuccess('User deleted successfully');
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

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
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
    
    // Pre-validate admin deletion restrictions
    if (user.role === 'admin' && user.store_name) {
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
        <Alert variant="danger">
          Access denied. You must be an admin to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">User Management</h4>
                <small className="text-muted">Manage users in your store</small>
              </div>
              <Button variant="primary" onClick={openCreateModal}>
                <i className="fas fa-plus me-2"></i>Add User
              </Button>
            </Card.Header>
            
            <Card.Body>
              {/* Alerts */}
              {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
              
              {/* Filters */}
              <Row className="mb-3">
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text><i className="fas fa-search"></i></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('');
                      setActiveFilter('');
                      setCurrentPage(1);
                    }}
                  >
                    Clear
                  </Button>
                </Col>
              </Row>

              {/* Users Table */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading users...</p>
                </div>
              ) : (
                <>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Store</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.name}</strong>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.phone}</td>
                          <td>
                            {user.store_name ? (
                              <span className="text-muted">{user.store_name}</span>
                            ) : (
                              <Badge bg="warning">No Store</Badge>
                            )}
                          </td>
                          <td>
                            <Badge bg={user.role === 'admin' ? 'primary' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={user.is_active ? 'success' : 'danger'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>{new Date(user.date_created).toLocaleDateString()}</td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                onClick={() => openEditModal(user)}
                                title="Edit User"
                                className="btn-gradient-edit"
                                type="button"
                              >
                                <i className="fas fa-edit me-1"></i>Edit
                              </button>
                              <button
                                onClick={() => openPasswordModal(user)}
                                title="Change Password"
                                className="btn-gradient-password"
                                type="button"
                              >
                                <i className="fas fa-key me-1"></i>Password
                              </button>
                              {(() => {
                                const isCurrentUser = user.id === currentUser.id;
                                const isLastAdminInStore = user.role === 'admin' && user.store_name && 
                                  users.filter(u => u.role === 'admin' && u.store_name === user.store_name && u.is_active).length <= 1;
                                
                                if (isCurrentUser || isLastAdminInStore) {
                                  return (
                                    <button
                                      disabled
                                      title={isCurrentUser ? "Cannot delete your own account" : "Cannot delete - last admin for this store"}
                                      className="btn-gradient-disabled"
                                      type="button"
                                    >
                                      <i className="fas fa-trash me-1"></i>Delete
                                    </button>
                                  );
                                } else {
                                  return (
                                    <button
                                      onClick={() => openDeleteModal(user)}
                                      title="Delete User"
                                      className="btn-gradient-delete"
                                      type="button"
                                    >
                                      <i className="fas fa-trash me-1"></i>Delete
                                    </button>
                                  );
                                }
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {users.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted">No users found</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center">
                      <Pagination>
                        <Pagination.Prev
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        />
                        {[...Array(totalPages)].map((_, i) => (
                          <Pagination.Item
                            key={i + 1}
                            active={currentPage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Store *</Form.Label>
              <Form.Select
                value={createForm.store_id}
                onChange={(e) => setCreateForm({...createForm, store_id: e.target.value})}
                required
              >
                <option value="">Select Store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.state}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={createForm.address}
                onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    required
                    minLength={8}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})}
                    required
                    minLength={8}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
                  <Form.Select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={editForm.is_active}
                    onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'true'})}
                    required
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
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
              disabled={loading || selectedUser?.id === currentUser.id || 
                (selectedUser?.role === 'admin' && selectedUser?.store_name && 
                 users.filter(u => u.role === 'admin' && u.store_name === selectedUser.store_name && u.is_active).length <= 1)
              }
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
        
        {selectedUser?.role === 'admin' && selectedUser?.store_name && (
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
                  <strong>Note:</strong> Deleting this admin will leave {adminsInSameStore.length - 1} other admin(s) 
                  for {selectedUser.store_name}.
                </Alert>
              );
            }
          })()
        )}
        
        {selectedUser?.role === 'admin' && !selectedUser?.store_name && (
          <Alert variant="warning">
            <i className="fas fa-user-shield me-2"></i>
            <strong>Admin User:</strong> This user has administrative privileges.
          </Alert>
        )}
      </DraggableDialog>
    </Container>
  );
};

export default UserManagement;