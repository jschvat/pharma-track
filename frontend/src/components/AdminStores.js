import React, { useState, useEffect } from 'react';
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
  Pagination,
  Dropdown
} from 'react-bootstrap';
import { storeAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import FormField from './common/FormField';
import FormModal from './common/FormModal';
import ActionButtonGroup from './common/ActionButtonGroup';
import CardHeader from './common/CardHeader';
import DraggableDialog from './DraggableDialog';
import PharmaDropdown from './common/PharmaDropdown';

// Custom CSS for professional solid buttons and dropdown styling
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

  /* Custom dropdown menu styling for state selection */
  .pharma-dropdown-states .dropdown-menu {
    max-height: 200px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }
  
  /* Custom scrollbar for dropdown */
  .pharma-dropdown-states .dropdown-menu::-webkit-scrollbar {
    width: 6px;
  }
  
  .pharma-dropdown-states .dropdown-menu::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .pharma-dropdown-states .dropdown-menu::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  
  .pharma-dropdown-states .dropdown-menu::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('[data-store-gradient-buttons]');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleElement = document.createElement('style');
  styleElement.textContent = buttonStyles;
  styleElement.setAttribute('data-store-gradient-buttons', 'true');
  document.head.appendChild(styleElement);
}

const AdminStores = () => {
  const { isAdmin, isGodMode } = useAuth();
  
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  
  const [createForm, setCreateForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    phone: '',
    fax: '',
    dea_registration_number: '',
    npi: '',
    admin_user_id: ''
  });
  
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    phone: '',
    fax: '',
    dea_registration_number: '',
    npi: '',
    admin_user_id: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const storesPerPage = 10;

  useEffect(() => {
    loadStores();
    loadUsers();
  }, [currentPage]);

  const loadStores = async () => {
    if (!isAdmin()) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: storesPerPage
      };
      
      // Only filter to admin-managed stores for regular admin users
      // God mode users should see ALL stores
      if (!isGodMode()) {
        params.admin_only = true;  // Only show stores this admin manages
      }

      const response = await storeAPI.getAll(params);
      setStores(response.data.stores || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      console.error('Store loading error:', err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(`Network error: ${err.message}`);
      } else {
        setError('Failed to load stores - Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔄 DEBUG: Starting to load users...', new Date().toISOString());
      // God mode users should see ALL users system-wide for admin assignment
      // Regular admins see only users from their store
      console.log('🔍 DEBUG: Loading users, isGodMode:', isGodMode());
      const response = isGodMode() ? 
        await userAPI.getAllUsers({ limit: 100 }) : // Use /all endpoint for god_mode
        await userAPI.getAll({ limit: 100 });       // Use regular endpoint for admin
      console.log('🔍 DEBUG: Raw response:', response);
      console.log('🔍 DEBUG: Response data:', response.data);
      // Handle both possible response structures
      const usersData = response.data.users || response.data || [];
      console.log('🔍 DEBUG: Final users data:', usersData);
      console.log('🔍 DEBUG: Admin/god_mode users in final data:', usersData.filter(u => u.role === 'admin' || u.role === 'god_mode').length);
      setUsers(usersData);
      console.log('✅ DEBUG: Users state updated with', usersData.length, 'users at', new Date().toISOString());
    } catch (err) {
      console.error('❌ Failed to load users:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await storeAPI.create(createForm);
      
      setSuccess('Store created successfully');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        address: '',
        state: '',
        zipcode: '',
        phone: '',
        fax: '',
        dea_registration_number: '',
        npi: '',
        admin_user_id: ''
      });
      loadStores();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to create store');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditStore = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await storeAPI.update(selectedStore.id, editForm);
      setSuccess('Store updated successfully');
      setShowEditModal(false);
      loadStores();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to update store');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async () => {
    try {
      setLoading(true);
      await storeAPI.delete(selectedStore.id);
      setSuccess('Store deleted successfully');
      setShowDeleteModal(false);
      loadStores();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.map(e => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to delete store');
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setError('');
  };

  // Debug function to test users state
  const forceTestUsers = () => {
    console.log('🧪 DEBUG: Forcing test user data');
    const testUsers = [
      { id: 1, name: 'Demo Admin', email: 'admin@pharmatrak.com', role: 'god_mode', store_id: 1, store_name: 'Demo Store' },
      { id: 13, name: 'Store 2 Admin', email: 'admin2@pharmatrak.com', role: 'admin', store_id: 2, store_name: 'Store 2' },
      { id: 15, name: 'Store 3 Admin', email: 'admin3@pharmatrak.com', role: 'admin', store_id: 3, store_name: 'Store 3' }
    ];
    setUsers(testUsers);
    console.log('✅ DEBUG: Test users set:', testUsers);
  };

  const openEditModal = (store) => {
    console.log('🚀 DEBUG: Opening edit modal for store:', store);
    console.log('🚀 DEBUG: Current users array length:', users.length);
    console.log('🚀 DEBUG: Current users array:', users);
    console.log('🚀 DEBUG: Admin/god_mode users available:', users.filter(u => u.role === 'admin' || u.role === 'god_mode').length);
    
    setSelectedStore(store);
    setEditForm({
      name: store.name,
      address: store.address,
      city: store.city || '',
      state: store.state,
      zipcode: store.zipcode,
      phone: store.phone,
      fax: store.fax || '',
      dea_registration_number: store.dea_registration_number,
      npi: store.npi,
      admin_user_id: store.admin_user_id || ''
    });
    setShowEditModal(true);
    setError('');
  };

  const openDeleteModal = (store) => {
    setSelectedStore(store);
    setShowDeleteModal(true);
    setError('');
  };

  // Helper functions for form handling
  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to generate action buttons for each store row
  const getStoreActions = (store) => {
    return [
      {
        label: 'Edit',
        icon: 'fas fa-edit',
        onClick: () => openEditModal(store),
        variant: 'edit',
        title: 'Edit Store'
      },
      {
        label: 'Delete',
        icon: 'fas fa-trash',
        onClick: () => openDeleteModal(store),
        variant: 'delete',
        title: 'Delete Store'
      }
    ];
  };

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

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

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
            <CardHeader
              title={isGodMode() ? "System-Wide Store Management" : "My Store Management"}
              subtitle={isGodMode() ? "Manage all stores in the system" : "Manage stores you administer"}
              action={{
                label: "Add Store",
                icon: "fas fa-plus",
                onClick: openCreateModal,
                variant: "primary"
              }}
            />
            
            <Card.Body>
              {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
              
              {/* Debug button - remove after testing */}
              <div className="mb-3">
                <Button variant="warning" size="sm" onClick={forceTestUsers}>
                  🧪 DEBUG: Force Test Users ({users.length} current)
                </Button>
              </div>
              

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading stores...</p>
                </div>
              ) : (
                <>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Store Name</th>
                        <th>Address</th>
                        <th>State</th>
                        <th>Phone</th>
                        <th>DEA Number</th>
                        <th>NPI</th>
                        <th>Admin</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((store) => (
                        <tr key={store.id}>
                          <td>
                            <strong>{store.name}</strong>
                          </td>
                          <td>{store.address}{store.city && `, ${store.city}`}, {store.zipcode}</td>
                          <td>
                            <Badge bg="secondary">{store.state}</Badge>
                          </td>
                          <td>{store.phone}</td>
                          <td>{store.dea_registration_number}</td>
                          <td>{store.npi}</td>
                          <td>
                            {store.admin_name ? (
                              <span>
                                {store.admin_name}
                                <br />
                                <small className="text-muted">{store.admin_email}</small>
                              </span>
                            ) : (
                              <Badge bg="warning">No Admin</Badge>
                            )}
                          </td>
                          <td>
                            <ActionButtonGroup actions={getStoreActions(store)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {stores.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted">No stores found</p>
                    </div>
                  )}

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

      {/* Create Store Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Store</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateStore}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Store Name *</Form.Label>
              <Form.Control
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                required
              />
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
              <Col md={9}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({...createForm, city: e.target.value})}
                    placeholder="Enter city"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>State *</Form.Label>
                  <PharmaDropdown
                    options={[
                      { value: '', label: 'Select State' },
                      ...states.map(state => ({ value: state, label: state }))
                    ]}
                    selectedValue={createForm.state || ''}
                    onSelectionChange={(value) => setCreateForm({...createForm, state: value})}
                    placeholder="Select State"
                    variant="outline-secondary"
                    className="pharma-dropdown-states-compact"
                    size="md"
                    autoSize={true}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Zip Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={createForm.zipcode}
                    onChange={(e) => setCreateForm({...createForm, zipcode: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
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
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Fax</Form.Label>
                  <Form.Control
                    type="tel"
                    value={createForm.fax}
                    onChange={(e) => setCreateForm({...createForm, fax: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>DEA Registration Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={createForm.dea_registration_number}
                    onChange={(e) => setCreateForm({...createForm, dea_registration_number: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>NPI Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={createForm.npi}
                    onChange={(e) => setCreateForm({...createForm, npi: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Store Admin</Form.Label>
              <Form.Select
                value={createForm.admin_user_id}
                onChange={(e) => setCreateForm({...createForm, admin_user_id: e.target.value})}
              >
                <option value="">Select Store Admin</option>
                {users.filter(user => user.role === 'admin' || user.role === 'god_mode').map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Create Store'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Store Dialog */}
      <DraggableDialog
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        title={`Edit Store: ${selectedStore?.name || ''}`}
        size="lg"
        maxWidth="900px"
        width="90vw"
      >
        <Form onSubmit={handleEditStore}>
          <div className="p-3">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold mb-2">Store Name *</Form.Label>
              <Form.Control
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                required
              />
            </Form.Group>
            
            <hr className="my-3" />
            <h6 className="text-muted mb-3 d-flex align-items-center">
              <span className="me-2">📍</span> Location Information
            </h6>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold mb-2">Address *</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                required
              />
            </Form.Group>
            <Row className="mb-3 g-3">
              <Col lg={9}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold mb-2">City</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    placeholder="Enter city"
                  />
                </Form.Group>
              </Col>
              <Col lg={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold mb-2">State *</Form.Label>
                  <PharmaDropdown
                    options={[
                      { value: '', label: 'Select State' },
                      ...states.map(state => ({ value: state, label: state }))
                    ]}
                    selectedValue={editForm.state || ''}
                    onSelectionChange={(value) => setEditForm({...editForm, state: value})}
                    placeholder="Select State"
                    variant="outline-secondary"
                    className="pharma-dropdown-states-compact"
                    size="md"
                    autoSize={true}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3 g-3">
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold mb-2">Zip Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.zipcode}
                    onChange={(e) => setEditForm({...editForm, zipcode: e.target.value})}
                    required
                    placeholder="90210"
                  />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold mb-2">Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    required
                    placeholder="(555) 123-4567"
                  />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold mb-2">Fax</Form.Label>
                  <Form.Control
                    type="tel"
                    value={editForm.fax}
                    onChange={(e) => setEditForm({...editForm, fax: e.target.value})}
                    placeholder="(555) 123-4568"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <hr className="my-3" />
            <h6 className="text-muted mb-3 d-flex align-items-center">
              <span className="me-2">🏥</span> Registration Information
            </h6>
            
            <Row className="mb-3 g-3">
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold mb-2">DEA Registration Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.dea_registration_number}
                    onChange={(e) => setEditForm({...editForm, dea_registration_number: e.target.value})}
                    required
                    placeholder="AB1234567"
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold mb-2">NPI Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.npi}
                    onChange={(e) => setEditForm({...editForm, npi: e.target.value})}
                    required
                    placeholder="1234567890"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <hr className="my-3" />
            <h6 className="text-muted mb-3 d-flex align-items-center">
              <span className="me-2">👤</span> Administrative Settings
            </h6>
            
            <Row className="mb-3">
              <Col lg={8}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold mb-2">Store Admin</Form.Label>
                  {(() => {
                    console.log('🎯 DEBUG: Rendering edit form dropdown');
                    console.log('🎯 DEBUG: Total users:', users.length);
                    console.log('🎯 DEBUG: Users array:', users);
                    const filtered = users.filter(user => user.role === 'admin' || user.role === 'god_mode');
                    console.log('🎯 DEBUG: Filtered admin/god_mode users:', filtered);
                    
                    // Create options for PharmaDropdown
                    const adminOptions = [
                      { value: '', label: 'No Admin Assigned' },
                      ...filtered.map(user => ({
                        value: user.id.toString(),
                        label: `${user.name}${user.role === 'god_mode' ? ' (God Mode)' : ''}`,
                        subtitle: isGodMode() && user.store_name ? `${user.email} • ${user.store_name}` : user.email
                      }))
                    ];
                    
                    console.log('🎯 DEBUG: Created dropdown options:', adminOptions);
                    
                    return (
                      <PharmaDropdown
                        options={adminOptions}
                        selectedValue={editForm.admin_user_id || ''}
                        onSelectionChange={(value) => setEditForm({...editForm, admin_user_id: value})}
                        placeholder="Select Store Admin"
                        variant="outline-secondary"
                        className="w-100"
                        size="md"
                        customOptionRenderer={(option, isSelected) => (
                          <div>
                            <strong>{option.label}</strong>
                            {option.subtitle && <div className="small text-muted">{option.subtitle}</div>}
                          </div>
                        )}
                      />
                    );
                  })()}
                </Form.Group>
              </Col>
            </Row>
          </div>
          
          <div className="d-flex justify-content-end gap-3 mt-3 pt-3 border-top">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowEditModal(false)}
              className="px-4"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
              className="px-4"
            >
              {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              {loading ? 'Updating...' : 'Update Store'}
            </Button>
          </div>
        </Form>
      </DraggableDialog>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Are you sure you want to delete store <strong>{selectedStore?.name}</strong>?
            This action cannot be undone and will affect all associated users and inventory.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteStore} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Delete Store'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminStores;