import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Alert, 
  Spinner, 
  Badge,
  Modal,
  Form,
  InputGroup,
  Pagination,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { drugAPI } from '../services/api';
import CardHeader from './common/CardHeader';
import FormField from './common/FormField';
import ProductLabelingModal from './ProductLabelingModal';

const GlobalDrugManagement = () => {
  const { user, isGodMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drugs, setDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLabelingModal, setShowLabelingModal] = useState(false);
  const [selectedNDC, setSelectedNDC] = useState(null);
  
  // Pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [itemsPerPage] = useState(50);

  // Sorting
  const [sortField, setSortField] = useState('generic_name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Edit form
  const [editForm, setEditForm] = useState({
    generic_name: '',
    brand_name: '',
    dosage_form: '',
    strength: '',
    manufacturer_name: '',
    substance_name: '',
    is_active: true
  });

  // Redirect non-god-mode users
  useEffect(() => {
    if (!isGodMode()) {
      setError('Access Denied: God Mode required for global drug management');
      return;
    }
  }, [isGodMode]);

  // Load drugs on component mount and when filters change
  useEffect(() => {
    if (isGodMode()) {
      loadGlobalDrugs();
    }
  }, [currentPage, searchTerm, activeOnly, isGodMode]);

  const loadGlobalDrugs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        active_only: activeOnly
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await drugAPI.getGlobalDrugs(params);
      setDrugs(response.data.drugs || []);
      setTotalPages(response.data.pagination?.pages || 1);
      
    } catch (error) {
      console.error('Load global drugs error:', error);
      setError('Failed to load global drugs: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const viewDrugDetails = async (drugId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await drugAPI.getGlobalDrug(drugId);
      setSelectedDrug(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Load drug details error:', error);
      setError('Failed to load drug details: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const editDrug = (drug) => {
    setEditForm({
      generic_name: drug.generic_name || '',
      brand_name: drug.brand_name || '',
      dosage_form: drug.dosage_form || '',
      strength: drug.strength || '',
      manufacturer_name: drug.manufacturer_name || '',
      substance_name: drug.substance_name || '',
      is_active: drug.is_active
    });
    setSelectedDrug(drug);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDrug) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await drugAPI.updateGlobalDrug(selectedDrug.id, editForm);
      setSuccess(`Drug "${response.data.drug.generic_name}" updated successfully. ${response.data.affected_stores} stores affected.`);
      setShowEditModal(false);
      loadGlobalDrugs(); // Reload the list
    } catch (error) {
      console.error('Update drug error:', error);
      setError('Failed to update drug: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deactivateDrug = async (drug) => {
    if (!window.confirm(`Are you sure you want to deactivate "${drug.generic_name}"? This will affect all stores using this drug.`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await drugAPI.deactivateGlobalDrug(drug.id);
      setSuccess(`Drug "${drug.generic_name}" deactivated. Impact: ${response.data.impact.affected_stores} stores, ${response.data.impact.inventory_items} inventory items.`);
      loadGlobalDrugs(); // Reload the list
    } catch (error) {
      console.error('Deactivate drug error:', error);
      setError('Failed to deactivate drug: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    loadGlobalDrugs();
  };

  const updateFromFDA = async (drug) => {
    if (!drug.ndc) {
      setError('Cannot update from FDA: Drug has no NDC number');
      return;
    }

    if (!window.confirm(`Update "${drug.generic_name}" with latest FDA data? This will overwrite current drug information.`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Navigate to FDA search with pre-filled NDC for manual verification
      window.open(`/drugs/search?ndc=${encodeURIComponent(drug.ndc)}&update_id=${drug.id}`, '_blank');
      setSuccess(`FDA search opened in new tab for "${drug.generic_name}". Please verify and update the drug data.`);
    } catch (error) {
      console.error('FDA update error:', error);
      setError('Failed to open FDA search: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedDrugs = () => {
    return [...drugs].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      
      const comparison = aVal.toString().localeCompare(bVal.toString(), undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const handleNDCClick = (ndc) => {
    if (!ndc) {
      setError('No NDC available for this drug');
      return;
    }
    
    setSelectedNDC(ndc);
    setShowLabelingModal(true);
  };

  const handleCloseLabelingModal = () => {
    setShowLabelingModal(false);
    setSelectedNDC(null);
  };

  // Don't render if user doesn't have god mode access
  if (!isGodMode()) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <h5>Access Denied</h5>
          <p>God Mode access is required to manage global drugs.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <Card className="shadow-sm">
            <CardHeader 
              title="Global Drug Management"
              subtitle="Manage drugs in the global catalog (affects all stores)"
              variant="danger"
              icon="fas fa-globe"
            />
            <Card.Body>
              
              {/* Search and Filter Controls */}
              <Row className="mb-3">
                <Col md={8}>
                  <Form onSubmit={handleSearch}>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search drugs by name or NDC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button variant="outline-primary" type="submit">
                        <i className="fas fa-search"></i> Search
                      </Button>
                    </InputGroup>
                  </Form>
                </Col>
                <Col md={4}>
                  <Form.Check
                    type="switch"
                    id="active-only-switch"
                    label="Active drugs only"
                    checked={activeOnly}
                    onChange={(e) => {
                      setActiveOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                  />
                </Col>
              </Row>

              {/* Action Buttons Row */}
              <Row className="mb-3 align-items-end">
                <Col>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="success" 
                      onClick={() => window.open('/drugs/add', '_blank')}
                      title="Add a new drug to the global catalog"
                    >
                      <i className="fas fa-plus"></i> Add New Drug
                    </Button>
                  </div>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-3 align-items-center">
                    <small className="text-muted">
                      <strong>Actions:</strong>
                    </small>
                    <small className="text-muted d-flex align-items-center gap-1">
                      <i className="fas fa-eye text-info"></i>
                      <span>View</span>
                    </small>
                    <small className="text-muted d-flex align-items-center gap-1">
                      <i className="fas fa-edit text-primary"></i>
                      <span>Edit</span>
                    </small>
                    <small className="text-muted d-flex align-items-center gap-1">
                      <i className="fas fa-sync-alt text-warning"></i>
                      <span>Update FDA</span>
                    </small>
                    <small className="text-muted d-flex align-items-center gap-1">
                      <i className="fas fa-ban text-danger"></i>
                      <span>Deactivate</span>
                    </small>
                  </div>
                </Col>
              </Row>

              {/* Alert Messages */}
              {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

              {/* Loading Spinner */}
              {loading && (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-2">Loading global drugs...</div>
                </div>
              )}

              {/* Drugs Table */}
              {!loading && drugs.length > 0 && (
                <>
                  <Table striped bordered hover responsive size="sm" className="text-sm compact-table" style={{ fontSize: '0.875rem' }}>
                    <thead className="table-dark">
                      <tr>
                        <th 
                          style={{ cursor: 'pointer', width: '120px' }}
                          onClick={() => handleSort('ndc')}
                          title="Sort by NDC"
                        >
                          NDC {sortField === 'ndc' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', width: '200px' }}
                          onClick={() => handleSort('generic_name')}
                          title="Sort by Generic Name"
                        >
                          Generic Name {sortField === 'generic_name' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', width: '150px' }}
                          onClick={() => handleSort('brand_name')}
                          title="Sort by Brand Name"
                        >
                          Brand Name {sortField === 'brand_name' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', width: '100px' }}
                          onClick={() => handleSort('dosage_form')}
                          title="Sort by Dosage Form"
                        >
                          Form {sortField === 'dosage_form' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', width: '80px' }}
                          onClick={() => handleSort('strength')}
                          title="Sort by Strength"
                        >
                          Strength {sortField === 'strength' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                        </th>
                        <th 
                          style={{ cursor: 'pointer', width: '120px' }}
                          onClick={() => handleSort('manufacturer_name')}
                          title="Sort by Manufacturer"
                        >
                          Manufacturer {sortField === 'manufacturer_name' && <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>}
                        </th>
                        <th style={{ width: '80px' }}>Status</th>
                        <th style={{ width: '160px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedDrugs().map(drug => (
                        <tr key={drug.id}>
                          <td>
                            <strong>
                              <code 
                                className="text-primary fs-6 cursor-pointer" 
                                onClick={() => handleNDCClick(drug.ndc)}
                                title="Click to view FDA product labeling information"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                <i className="fas fa-pills me-1"></i>
                                {drug.ndc}
                              </code>
                            </strong>
                          </td>
                          <td>
                            <div className="fw-bold">{drug.generic_name}</div>
                          </td>
                          <td><small>{drug.brand_name || 'N/A'}</small></td>
                          <td>
                            <Badge bg="info" className="small">{drug.dosage_form}</Badge>
                          </td>
                          <td><small>{drug.strength || 'N/A'}</small></td>
                          <td><small>{drug.manufacturer_name || 'N/A'}</small></td>
                          <td>
                            <Badge bg={drug.is_active ? 'success' : 'danger'} className="small">
                              {drug.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <div className="d-flex gap-1 justify-content-center">
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip>
                                    <strong>View Details</strong><br />
                                    View detailed drug information including usage statistics across all stores
                                  </Tooltip>
                                }
                              >
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => viewDrugDetails(drug.id)}
                                  style={{ minWidth: '32px' }}
                                >
                                  <i className="fas fa-eye"></i>
                                </Button>
                              </OverlayTrigger>
                              
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip>
                                    <strong>Edit Drug</strong><br />
                                    Edit drug information in the global catalog (affects all stores using this drug)
                                  </Tooltip>
                                }
                              >
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => editDrug(drug)}
                                  style={{ minWidth: '32px' }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </OverlayTrigger>
                              
                              <OverlayTrigger
                                placement="top"
                                overlay={
                                  <Tooltip>
                                    <strong>Update from FDA</strong><br />
                                    Update drug information with latest FDA data by searching with the NDC number
                                  </Tooltip>
                                }
                              >
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => updateFromFDA(drug)}
                                  style={{ minWidth: '32px' }}
                                >
                                  <i className="fas fa-sync-alt"></i>
                                </Button>
                              </OverlayTrigger>
                              
                              {drug.is_active && (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={
                                    <Tooltip>
                                      <strong>Deactivate Drug</strong><br />
                                      Deactivate this drug across all stores (will affect inventory in all locations)
                                    </Tooltip>
                                  }
                                >
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => deactivateDrug(drug)}
                                    style={{ minWidth: '32px' }}
                                  >
                                    <i className="fas fa-ban"></i>
                                  </Button>
                                </OverlayTrigger>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <Pagination>
                        <Pagination.Prev 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        />
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                          const page = currentPage > 5 ? currentPage - 5 + i : i + 1;
                          if (page > totalPages) return null;
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        <Pagination.Next 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!loading && drugs.length === 0 && (
                <div className="text-center py-5">
                  <i className="fas fa-pills fa-3x text-muted mb-3"></i>
                  <h5>No drugs found</h5>
                  <p className="text-muted">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No drugs available in the global catalog'}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Drug Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Global Drug</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <FormField
                  label="Generic Name"
                  type="text"
                  value={editForm.generic_name}
                  onChange={(e) => setEditForm({...editForm, generic_name: e.target.value})}
                  required
                />
              </Col>
              <Col md={6}>
                <FormField
                  label="Brand Name"
                  type="text"
                  value={editForm.brand_name}
                  onChange={(e) => setEditForm({...editForm, brand_name: e.target.value})}
                />
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormField
                  label="Dosage Form"
                  type="text"
                  value={editForm.dosage_form}
                  onChange={(e) => setEditForm({...editForm, dosage_form: e.target.value})}
                />
              </Col>
              <Col md={6}>
                <FormField
                  label="Strength"
                  type="text"
                  value={editForm.strength}
                  onChange={(e) => setEditForm({...editForm, strength: e.target.value})}
                />
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <FormField
                  label="Manufacturer"
                  type="text"
                  value={editForm.manufacturer_name}
                  onChange={(e) => setEditForm({...editForm, manufacturer_name: e.target.value})}
                />
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <FormField
                  label="Active Substance"
                  type="text"
                  value={editForm.substance_name}
                  onChange={(e) => setEditForm({...editForm, substance_name: e.target.value})}
                />
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Check
                  type="switch"
                  id="edit-is-active"
                  label="Active Drug"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Drug Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Global Drug Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDrug && (
            <Row>
              <Col md={8}>
                <Card>
                  <Card.Header><h6>Drug Information</h6></Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <strong>NDC:</strong> <code>{selectedDrug.drug?.ndc}</code><br/>
                        <strong>Generic Name:</strong> {selectedDrug.drug?.generic_name}<br/>
                        <strong>Brand Name:</strong> {selectedDrug.drug?.brand_name || 'N/A'}<br/>
                        <strong>Dosage Form:</strong> {selectedDrug.drug?.dosage_form}<br/>
                      </Col>
                      <Col md={6}>
                        <strong>Strength:</strong> {selectedDrug.drug?.strength || 'N/A'}<br/>
                        <strong>Manufacturer:</strong> {selectedDrug.drug?.manufacturer_name || 'N/A'}<br/>
                        <strong>Status:</strong> <Badge bg={selectedDrug.drug?.is_active ? 'success' : 'danger'}>
                          {selectedDrug.drug?.is_active ? 'Active' : 'Inactive'}
                        </Badge><br/>
                        <strong>Substance:</strong> {selectedDrug.drug?.substance_name || 'N/A'}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card>
                  <Card.Header><h6>Usage Statistics</h6></Card.Header>
                  <Card.Body>
                    <div className="text-center">
                      <h4 className="text-primary">{selectedDrug.usage_stats?.total_stores_using || 0}</h4>
                      <small>Stores Using</small>
                    </div>
                    <div className="text-center mt-2">
                      <h5 className="text-info">{selectedDrug.usage_stats?.total_inventory_items || 0}</h5>
                      <small>Inventory Items</small>
                    </div>
                    <div className="text-center mt-2">
                      <h5 className="text-success">{selectedDrug.usage_stats?.total_quantity_across_stores || 0}</h5>
                      <small>Total Quantity</small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          {selectedDrug?.usage_stats?.stores?.length > 0 && (
            <Card className="mt-3">
              <Card.Header><h6>Store Breakdown</h6></Card.Header>
              <Card.Body>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Store Name</th>
                      <th>Inventory Items</th>
                      <th>Total Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDrug.usage_stats.stores.map(store => (
                      <tr key={store.store_id}>
                        <td>{store.store_name}</td>
                        <td>
                          <Badge bg="info">{store.inventory_items}</Badge>
                        </td>
                        <td>
                          <Badge bg="success">{store.total_quantity}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Product Labeling Modal */}
      <ProductLabelingModal 
        ndc={selectedNDC}
        isOpen={showLabelingModal}
        onClose={handleCloseLabelingModal}
      />
    </Container>
  );
};

export default GlobalDrugManagement;