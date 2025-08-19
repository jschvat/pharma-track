/**
 * UserTable Component
 * 
 * Displays users in a table format with action buttons and status indicators.
 * Extracted from UserManagement.js to improve maintainability.
 * 
 * Features:
 * - User list display
 * - Status and role badges
 * - Action buttons (edit, password, delete)
 * - Role-based permissions
 * - Professional styling
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';
import DataTable from '../common/DataTable';
import CardHeader from '../common/CardHeader';

/**
 * UserTable Component - Displays users in table format
 * 
 * @param {Object} props - Component props
 * @param {Array} props.users - Array of user objects
 * @param {Array} props.stores - Array of store objects
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.currentUser - Current logged-in user
 * @param {boolean} props.isAdmin - Whether current user is admin
 * @param {boolean} props.isGodMode - Whether current user has god mode
 * @param {Function} props.onEdit - Edit user handler
 * @param {Function} props.onPassword - Change password handler
 * @param {Function} props.onDelete - Delete user handler
 * @returns {JSX.Element} The user table component
 */
const UserTable = ({
  users = [],
  stores = [],
  loading = false,
  currentUser,
  isAdmin = false,
  isGodMode = false,
  onEdit,
  onPassword,
  onDelete
}) => {

  // Get store name by ID
  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : 'Unassigned';
  };

  // Role badge styling
  const getRoleBadge = (role) => {
    const roleConfig = {
      god_mode: { variant: 'danger', text: 'GOD MODE' },
      admin: { variant: 'warning', text: 'ADMIN' },
      user: { variant: 'primary', text: 'USER' }
    };
    
    const config = roleConfig[role] || roleConfig.user;
    return (
      <Badge bg={config.variant} className="user-role-badge">
        {config.text}
      </Badge>
    );
  };

  // Status badge styling
  const getStatusBadge = (isActive) => {
    return (
      <Badge 
        bg={isActive ? 'success' : 'secondary'} 
        className="user-status-badge"
      >
        {isActive ? 'ACTIVE' : 'INACTIVE'}
      </Badge>
    );
  };

  // Check if user can be edited
  const canEditUser = (user) => {
    if (isGodMode) return true;
    if (isAdmin && user.role !== 'god_mode') return true;
    return user.id === currentUser?.id;
  };

  // Check if user can be deleted
  const canDeleteUser = (user) => {
    if (user.id === currentUser?.id) return false; // Can't delete self
    if (isGodMode) return true;
    if (isAdmin && user.role !== 'god_mode') return true;
    return false;
  };

  // Table columns configuration
  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (user) => (
        <div>
          <div className="fw-bold">{user.name}</div>
          <div className="text-muted small">{user.email}</div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (user) => getRoleBadge(user.role)
    },
    {
      header: 'Store',
      accessor: 'store_id',
      cell: (user) => (
        <span className="text-muted small">
          {getStoreName(user.store_id)}
        </span>
      )
    },
    {
      header: 'Phone',
      accessor: 'phone',
      cell: (user) => (
        <span className="small font-monospace">
          {user.phone || 'N/A'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (user) => getStatusBadge(user.is_active)
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (user) => (
        <div className="d-flex gap-1 user-actions-column">
          <button
            className="btn btn-gradient-edit"
            onClick={() => onEdit(user)}
            disabled={!canEditUser(user)}
            title="Edit User"
          >
            EDIT
          </button>
          <button
            className="btn btn-gradient-password"
            onClick={() => onPassword(user)}
            disabled={!canEditUser(user)}
            title="Change Password"
          >
            PWD
          </button>
          <button
            className="btn btn-gradient-delete"
            onClick={() => onDelete(user)}
            disabled={!canDeleteUser(user)}
            title="Delete User"
          >
            DEL
          </button>
        </div>
      )
    }
  ];

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader
          title="Loading Users..."
          subtitle="Please wait"
        />
        <Card.Body className="text-center py-4">
          <Spinner animation="border" variant="primary" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={`User Management (${users.length})`}
        subtitle="Manage user accounts, roles, and permissions"
      />
      <Card.Body className="p-0">
        <DataTable
          data={users}
          columns={columns}
          emptyMessage="No users found"
          className="user-table"
          striped
          hover
          responsive
        />
      </Card.Body>
    </Card>
  );
};

export default UserTable;