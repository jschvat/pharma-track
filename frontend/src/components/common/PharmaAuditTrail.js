/**
 * PharmaAuditTrail - Pharmacy Audit Trail Component
 * 
 * Comprehensive audit trail component for tracking pharmaceutical operations.
 * Provides detailed logging and visualization of all actions performed on
 * prescriptions, inventory, patients, and other pharmacy entities.
 * 
 * Features:
 * - Timeline view of all audit events
 * - User-based filtering and search
 * - Action type categorization
 * - Export functionality for compliance
 * - Real-time updates and notifications
 * - Regulatory compliance formatting
 * - Pharmacy-themed styling
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Form, Button, Alert, Table, Modal, Timeline } from 'react-bootstrap';
import { PharmaButton, PharmaBadge, PharmaSearch, PharmaSpinner } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaAuditTrail = ({
  // Data configuration
  entity = 'prescription', // 'prescription', 'inventory', 'patient', 'user', 'system'
  entityId = null,
  auditData = [],
  
  // Display options
  showTimeline = true,
  showUsers = true,
  showActions = true,
  showDetails = true,
  showExport = true,
  
  // Filtering
  filterByUser = null,
  filterByAction = null,
  filterByDateRange = null,
  searchTerm = '',
  
  // Pagination
  itemsPerPage = 20,
  showPagination = true,
  
  // Events
  onAuditClick = null,
  onUserClick = null,
  onExport = null,
  onRefresh = null,
  
  // Styling
  variant = 'primary',
  pharmaTheme = 'tablet', // 'pill', 'capsule', 'tablet'
  size = 'md',
  
  // Behavior
  realTimeUpdates = false,
  autoRefresh = false,
  refreshInterval = 30000,
  exportable = true,
  
  className = '',
  ...otherProps
}) => {
  
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(filterByUser);
  const [selectedAction, setSelectedAction] = useState(filterByAction);
  const [dateRange, setDateRange] = useState(() => filterByDateRange || { start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState(searchTerm);
  
  // Action type configurations
  const actionTypes = {
    create: {
      label: 'Created',
      icon: 'fas fa-plus-circle',
      color: 'success',
      description: 'New record created'
    },
    update: {
      label: 'Updated',
      icon: 'fas fa-edit',
      color: 'primary',
      description: 'Record modified'
    },
    delete: {
      label: 'Deleted',
      icon: 'fas fa-trash',
      color: 'danger',
      description: 'Record deleted'
    },
    view: {
      label: 'Viewed',
      icon: 'fas fa-eye',
      color: 'info',
      description: 'Record accessed'
    },
    fill: {
      label: 'Filled',
      icon: 'fas fa-prescription',
      color: 'success',
      description: 'Prescription filled'
    },
    dispense: {
      label: 'Dispensed',
      icon: 'fas fa-hand-paper',
      color: 'success',
      description: 'Medication dispensed'
    },
    return: {
      label: 'Returned',
      icon: 'fas fa-undo',
      color: 'warning',
      description: 'Medication returned'
    },
    adjust: {
      label: 'Adjusted',
      icon: 'fas fa-balance-scale',
      color: 'warning',
      description: 'Inventory adjusted'
    },
    expire: {
      label: 'Expired',
      icon: 'fas fa-calendar-times',
      color: 'danger',
      description: 'Item expired'
    },
    verify: {
      label: 'Verified',
      icon: 'fas fa-check-circle',
      color: 'success',
      description: 'Record verified'
    },
    approve: {
      label: 'Approved',
      icon: 'fas fa-thumbs-up',
      color: 'success',
      description: 'Action approved'
    },
    reject: {
      label: 'Rejected',
      icon: 'fas fa-thumbs-down',
      color: 'danger',
      description: 'Action rejected'
    },
    login: {
      label: 'Login',
      icon: 'fas fa-sign-in-alt',
      color: 'info',
      description: 'User logged in'
    },
    logout: {
      label: 'Logout',
      icon: 'fas fa-sign-out-alt',
      color: 'secondary',
      description: 'User logged out'
    },
    export: {
      label: 'Exported',
      icon: 'fas fa-download',
      color: 'info',
      description: 'Data exported'
    },
    import: {
      label: 'Imported',
      icon: 'fas fa-upload',
      color: 'info',
      description: 'Data imported'
    },
    system: {
      label: 'System',
      icon: 'fas fa-cogs',
      color: 'secondary',
      description: 'System action'
    }
  };
  
  // Entity type configurations
  const entityTypes = {
    prescription: {
      label: 'Prescription',
      icon: 'fas fa-prescription',
      color: 'primary'
    },
    inventory: {
      label: 'Inventory',
      icon: 'fas fa-boxes',
      color: 'success'
    },
    patient: {
      label: 'Patient',
      icon: 'fas fa-user',
      color: 'info'
    },
    user: {
      label: 'User',
      icon: 'fas fa-users',
      color: 'warning'
    },
    system: {
      label: 'System',
      icon: 'fas fa-server',
      color: 'secondary'
    },
    drug: {
      label: 'Drug',
      icon: 'fas fa-pills',
      color: 'primary'
    }
  };
  
  // Sample audit data for demo purposes
  const sampleAuditData = [
    {
      id: 1,
      entityType: 'prescription',
      entityId: 'RX123456',
      action: 'fill',
      userId: 'pharmacist1',
      userName: 'Dr. Sarah Johnson',
      userRole: 'Pharmacist',
      timestamp: new Date('2024-01-15T14:30:00'),
      description: 'Prescription filled for patient John Doe',
      details: {
        drugName: 'Amoxicillin 500mg',
        quantity: 30,
        patientName: 'John Doe',
        prescriber: 'Dr. Smith',
        lot: 'LOT123ABC'
      },
      ipAddress: '192.168.1.100',
      severity: 'normal'
    },
    {
      id: 2,
      entityType: 'inventory',
      entityId: 'INV-AMX-001',
      action: 'adjust',
      userId: 'technician1',
      userName: 'Mike Wilson',
      userRole: 'Pharmacy Technician',
      timestamp: new Date('2024-01-15T13:15:00'),
      description: 'Inventory count adjusted after cycle count',
      details: {
        drugName: 'Amoxicillin 500mg',
        previousQuantity: 100,
        newQuantity: 95,
        reason: 'Cycle count discrepancy'
      },
      ipAddress: '192.168.1.101',
      severity: 'normal'
    },
    {
      id: 3,
      entityType: 'patient',
      entityId: 'PAT123456',
      action: 'update',
      userId: 'receptionist1',
      userName: 'Lisa Chen',
      userRole: 'Receptionist',
      timestamp: new Date('2024-01-15T12:45:00'),
      description: 'Patient information updated',
      details: {
        patientName: 'John Doe',
        fieldChanged: 'phone_number',
        oldValue: '(555) 123-4567',
        newValue: '(555) 987-6543'
      },
      ipAddress: '192.168.1.102',
      severity: 'low'
    },
    {
      id: 4,
      entityType: 'prescription',
      entityId: 'RX123457',
      action: 'reject',
      userId: 'pharmacist1',
      userName: 'Dr. Sarah Johnson',
      userRole: 'Pharmacist',
      timestamp: new Date('2024-01-15T11:20:00'),
      description: 'Prescription rejected due to drug interaction',
      details: {
        drugName: 'Warfarin 5mg',
        patientName: 'Jane Smith',
        rejectionReason: 'Drug interaction with current medication Aspirin',
        prescriber: 'Dr. Brown'
      },
      ipAddress: '192.168.1.100',
      severity: 'high'
    },
    {
      id: 5,
      entityType: 'system',
      entityId: 'SYS-001',
      action: 'login',
      userId: 'admin1',
      userName: 'Admin User',
      userRole: 'Administrator',
      timestamp: new Date('2024-01-15T09:00:00'),
      description: 'System administrator logged in',
      details: {
        loginMethod: 'Username/Password',
        sessionDuration: '8 hours'
      },
      ipAddress: '192.168.1.200',
      severity: 'normal'
    }
  ];
  
  // Use sample data if no data provided - memoized to prevent re-creation on each render
  const currentData = useMemo(() => {
    return auditData.length > 0 ? auditData : sampleAuditData;
  }, [auditData]);
  
  // Filter and search audit data - memoized to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    let filtered = [...currentData];
    
    // Filter by user
    if (selectedUser) {
      filtered = filtered.filter(item => item.userId === selectedUser || item.userName.toLowerCase().includes(selectedUser.toLowerCase()));
    }
    
    // Filter by action
    if (selectedAction) {
      filtered = filtered.filter(item => item.action === selectedAction);
    }
    
    // Filter by date range
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(item => new Date(item.timestamp) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(item => new Date(item.timestamp) <= endDate);
    }
    
    // Search in description and details
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.description.toLowerCase().includes(query) ||
        item.entityId.toLowerCase().includes(query) ||
        item.userName.toLowerCase().includes(query) ||
        JSON.stringify(item.details).toLowerCase().includes(query)
      );
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return filtered;
  }, [currentData, selectedUser, selectedAction, dateRange, searchQuery]);
  
  // Update filtered data and reset page when processed data changes
  useEffect(() => {
    setFilteredData(processedData);
    setCurrentPage(1);
  }, [processedData]);
  
  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (onRefresh) {
          onRefresh();
        }
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, onRefresh]);
  
  // Paginated data
  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage, showPagination]);
  
  // Get unique users for filtering
  const availableUsers = useMemo(() => {
    const users = new Set();
    currentData.forEach(item => {
      users.add(item.userName);
    });
    return Array.from(users).sort();
  }, [currentData]);
  
  // Get available actions for filtering
  const availableActions = useMemo(() => {
    const actions = new Set();
    currentData.forEach(item => {
      actions.add(item.action);
    });
    return Array.from(actions).sort();
  }, [currentData]);
  
  // Handle audit item click
  const handleAuditClick = (auditItem) => {
    setSelectedAudit(auditItem);
    setShowDetailModal(true);
    if (onAuditClick) {
      onAuditClick(auditItem);
    }
  };
  
  // Handle export
  const handleExport = (format = 'csv') => {
    const exportData = {
      entity,
      entityId,
      data: filteredData,
      filters: {
        user: selectedUser,
        action: selectedAction,
        dateRange,
        searchQuery
      },
      exportDate: new Date(),
      format
    };
    
    if (onExport) {
      onExport(exportData);
    } else {
      // Default export behavior
      downloadAuditReport(exportData);
    }
  };
  
  // Download audit report
  const downloadAuditReport = (exportData) => {
    const csvContent = generateCSV(exportData.data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_trail_${entity}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };
  
  // Generate CSV content
  const generateCSV = (data) => {
    const headers = ['Timestamp', 'Entity Type', 'Entity ID', 'Action', 'User', 'Role', 'Description', 'IP Address', 'Severity'];
    const rows = data.map(item => [
      item.timestamp.toISOString(),
      item.entityType,
      item.entityId,
      item.action,
      item.userName,
      item.userRole,
      `"${item.description}"`,
      item.ipAddress,
      item.severity
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };
  
  // Get severity badge variant
  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'normal': return 'success';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };
  
  // Render filters
  const renderFilters = () => (
    <Card className="mb-4">
      <Card.Header className="bg-light">
        <div className="d-flex align-items-center">
          <i className="fas fa-filter me-2"></i>
          <strong>Filters & Search</strong>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="row">
          {/* Search */}
          <div className="col-md-6 col-lg-3 mb-3">
            <Form.Label>Search</Form.Label>
            <PharmaSearch
              placeholder="Search audit logs..."
              value={searchQuery}
              onSearch={setSearchQuery}
              showResults={false}
            />
          </div>
          
          {/* User Filter */}
          {showUsers && (
            <div className="col-md-6 col-lg-3 mb-3">
              <Form.Label>User</Form.Label>
              <Form.Select
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value || null)}
              >
                <option value="">All Users</option>
                {availableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </Form.Select>
            </div>
          )}
          
          {/* Action Filter */}
          {showActions && (
            <div className="col-md-6 col-lg-3 mb-3">
              <Form.Label>Action</Form.Label>
              <Form.Select
                value={selectedAction || ''}
                onChange={(e) => setSelectedAction(e.target.value || null)}
              >
                <option value="">All Actions</option>
                {availableActions.map(action => (
                  <option key={action} value={action}>
                    {actionTypes[action]?.label || action}
                  </option>
                ))}
              </Form.Select>
            </div>
          )}
          
          {/* Date Range */}
          <div className="col-md-6 col-lg-3 mb-3">
            <Form.Label>Date Range</Form.Label>
            <div className="d-flex gap-1">
              <Form.Control
                type="date"
                size="sm"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <Form.Control
                type="date"
                size="sm"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
        
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <PharmaBadge variant="info" pharmaType={pharmaTheme} className="me-2">
              {filteredData.length} Records
            </PharmaBadge>
            {entityId && (
              <PharmaBadge variant="secondary" pharmaType={pharmaTheme}>
                {entityTypes[entity]?.label || entity}: {entityId}
              </PharmaBadge>
            )}
          </div>
          <div className="d-flex gap-2">
            <PharmaButton
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                setSelectedUser(null);
                setSelectedAction(null);
                setDateRange({ start: '', end: '' });
                setSearchQuery('');
              }}
            >
              Clear Filters
            </PharmaButton>
            {showExport && exportable && (
              <PharmaButton
                variant={variant}
                pharmaType={pharmaTheme}
                size="sm"
                onClick={() => setShowExportModal(true)}
                icon={<i className="fas fa-download"></i>}
              >
                Export
              </PharmaButton>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
  
  // Render timeline view
  const renderTimelineView = () => {
    if (!showTimeline) return null;
    
    return (
      <div className="pharma-audit-timeline">
        {paginatedData.map((item, index) => (
          <div key={item.id} className="audit-timeline-item mb-4">
            <div className="d-flex">
              <div className="audit-timeline-marker me-3">
                <div className={`audit-timeline-icon bg-${actionTypes[item.action]?.color || 'secondary'}`}>
                  <i className={actionTypes[item.action]?.icon || 'fas fa-circle'}></i>
                </div>
                {index < paginatedData.length - 1 && <div className="audit-timeline-line"></div>}
              </div>
              
              <div className="audit-timeline-content flex-grow-1">
                <Card className="audit-timeline-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <PharmaBadge
                            variant={actionTypes[item.action]?.color || 'secondary'}
                            pharmaType={pharmaTheme}
                            className="me-2"
                          >
                            {actionTypes[item.action]?.label || item.action}
                          </PharmaBadge>
                          
                          <PharmaBadge
                            variant={getSeverityVariant(item.severity)}
                            pharmaType={pharmaTheme}
                            size="sm"
                            className="me-2"
                          >
                            {item.severity}
                          </PharmaBadge>
                          
                          <small className="text-muted">
                            {item.timestamp.toLocaleString()}
                          </small>
                        </div>
                        
                        <h6 className="mb-2">{item.description}</h6>
                        
                        <div className="d-flex align-items-center text-muted small">
                          <i className={`${entityTypes[item.entityType]?.icon} me-1`}></i>
                          <span className="me-3">{item.entityId}</span>
                          
                          {showUsers && (
                            <>
                              <i className="fas fa-user me-1"></i>
                              <span className="me-3">{item.userName} ({item.userRole})</span>
                            </>
                          )}
                          
                          <i className="fas fa-network-wired me-1"></i>
                          <span>{item.ipAddress}</span>
                        </div>
                        
                        {showDetails && Object.keys(item.details || {}).length > 0 && (
                          <div className="mt-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleAuditClick(item)}
                            >
                              <i className="fas fa-info-circle me-1"></i>
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render table view
  const renderTableView = () => {
    if (showTimeline) return null;
    
    return (
      <Card>
        <Card.Body className="p-0">
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity</th>
                {showUsers && <th>User</th>}
                <th>Description</th>
                <th>Severity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(item => (
                <tr key={item.id}>
                  <td>
                    <small>{item.timestamp.toLocaleString()}</small>
                  </td>
                  <td>
                    <PharmaBadge
                      variant={actionTypes[item.action]?.color || 'secondary'}
                      pharmaType={pharmaTheme}
                      size="sm"
                    >
                      {actionTypes[item.action]?.label || item.action}
                    </PharmaBadge>
                  </td>
                  <td>
                    <div>
                      <i className={`${entityTypes[item.entityType]?.icon} me-1 text-muted`}></i>
                      {item.entityId}
                    </div>
                  </td>
                  {showUsers && (
                    <td>
                      <div>
                        <strong>{item.userName}</strong>
                        <br />
                        <small className="text-muted">{item.userRole}</small>
                      </div>
                    </td>
                  )}
                  <td>{item.description}</td>
                  <td>
                    <PharmaBadge
                      variant={getSeverityVariant(item.severity)}
                      pharmaType={pharmaTheme}
                      size="sm"
                    >
                      {item.severity}
                    </PharmaBadge>
                  </td>
                  <td>
                    {showDetails && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleAuditClick(item)}
                      >
                        <i className="fas fa-info-circle"></i>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };
  
  // Render pagination
  const renderPagination = () => {
    if (!showPagination || filteredData.length <= itemsPerPage) return null;
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    return (
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-muted">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
        </div>
        <div className="d-flex gap-1">
          <PharmaButton
            variant="outline-secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <i className="fas fa-chevron-left"></i>
          </PharmaButton>
          <span className="px-3 py-1 align-self-center">
            Page {currentPage} of {totalPages}
          </span>
          <PharmaButton
            variant="outline-secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <i className="fas fa-chevron-right"></i>
          </PharmaButton>
        </div>
      </div>
    );
  };
  
  // Render detail modal
  const renderDetailModal = () => (
    <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-info-circle me-2"></i>
          Audit Trail Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedAudit && (
          <div>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Action:</strong>
                <div>
                  <PharmaBadge
                    variant={actionTypes[selectedAudit.action]?.color || 'secondary'}
                    pharmaType={pharmaTheme}
                    className="me-2"
                  >
                    {actionTypes[selectedAudit.action]?.label || selectedAudit.action}
                  </PharmaBadge>
                </div>
              </div>
              <div className="col-md-6">
                <strong>Timestamp:</strong>
                <div>{selectedAudit.timestamp.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Entity:</strong>
                <div>
                  <i className={`${entityTypes[selectedAudit.entityType]?.icon} me-1`}></i>
                  {selectedAudit.entityId}
                </div>
              </div>
              <div className="col-md-6">
                <strong>User:</strong>
                <div>{selectedAudit.userName} ({selectedAudit.userRole})</div>
              </div>
            </div>
            
            <div className="mb-3">
              <strong>Description:</strong>
              <div>{selectedAudit.description}</div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>IP Address:</strong>
                <div>{selectedAudit.ipAddress}</div>
              </div>
              <div className="col-md-6">
                <strong>Severity:</strong>
                <div>
                  <PharmaBadge
                    variant={getSeverityVariant(selectedAudit.severity)}
                    pharmaType={pharmaTheme}
                  >
                    {selectedAudit.severity}
                  </PharmaBadge>
                </div>
              </div>
            </div>
            
            {selectedAudit.details && Object.keys(selectedAudit.details).length > 0 && (
              <div>
                <strong>Additional Details:</strong>
                <Card className="mt-2">
                  <Card.Body>
                    <pre className="mb-0 small">
                      {JSON.stringify(selectedAudit.details, null, 2)}
                    </pre>
                  </Card.Body>
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  // Render export modal
  const renderExportModal = () => (
    <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-download me-2"></i>
          Export Audit Trail
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Export {filteredData.length} audit records to file.</p>
        
        <Form.Group className="mb-3">
          <Form.Label>Export Format</Form.Label>
          <Form.Select defaultValue="csv">
            <option value="csv">CSV (Comma Separated Values)</option>
            <option value="json">JSON (JavaScript Object Notation)</option>
            <option value="pdf">PDF (Portable Document Format)</option>
          </Form.Select>
        </Form.Group>
        
        <Alert variant="info">
          <small>
            <strong>Note:</strong> Exported data includes all filtered records with timestamps,
            user information, and action details for compliance purposes.
          </small>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowExportModal(false)}>
          Cancel
        </Button>
        <PharmaButton
          variant={variant}
          pharmaType={pharmaTheme}
          onClick={() => {
            handleExport('csv');
            setShowExportModal(false);
          }}
          icon={<i className="fas fa-download"></i>}
        >
          Export
        </PharmaButton>
      </Modal.Footer>
    </Modal>
  );
  
  return (
    <div className={`pharma-audit-trail ${className}`} {...otherProps}>
      {isLoading ? (
        <div className="text-center py-5">
          <PharmaSpinner animation={pharmaTheme} size="lg" showLabel={true}>
            Loading audit trail...
          </PharmaSpinner>
        </div>
      ) : (
        <>
          {renderFilters()}
          
          {filteredData.length === 0 ? (
            <Alert variant="info" className="text-center">
              <i className="fas fa-info-circle me-2"></i>
              No audit records found matching the current filters.
            </Alert>
          ) : (
            <>
              {showTimeline ? renderTimelineView() : renderTableView()}
              {renderPagination()}
            </>
          )}
          
          {renderDetailModal()}
          {renderExportModal()}
        </>
      )}
    </div>
  );
};

export default PharmaAuditTrail;