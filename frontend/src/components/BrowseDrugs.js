import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { inventoryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../css/components.css';

const BrowseDrugs = () => {
  const { user } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDrugs, setFilteredDrugs] = useState([]);

  useEffect(() => {
    loadDrugsData();
  }, []);

  useEffect(() => {
    // Filter drugs based on search term
    if (searchTerm.trim() === '') {
      setFilteredDrugs(drugs);
    } else {
      const filtered = drugs.filter(drug => 
        drug.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.ndc?.includes(searchTerm) ||
        drug.manufacturer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDrugs(filtered);
    }
  }, [searchTerm, drugs]);

  const loadDrugsData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user?.store_id && !user?.active_store_id) {
        setError('No store selected. Please select a store to view drugs.');
        return;
      }

      const storeId = user?.active_store_id || user?.store_id;

      // Load drugs from current store's inventory
      let allDrugs = [];
      let page = 1;
      const limit = 100;
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await inventoryAPI.getByStore(storeId, { 
          page, 
          limit,
          active: true 
        });
        
        const inventoryData = response.data.inventory || [];
        // Transform inventory data to drug data format
        const drugData = inventoryData.map(item => ({
          id: item.drug_id || item.id,
          ndc: item.ndc,
          generic_name: item.generic_name,
          brand_name: item.brand_name,
          dosage_form: item.dosage_form,
          route: item.route,
          strength: item.strength,
          manufacturer_name: item.manufacturer_name,
          is_active: item.is_active,
          created_at: item.date_created,
          // Add inventory-specific fields
          quantity_on_hand: item.quantity_on_hand,
          reorder_level: item.reorder_level,
          expiration_date: item.expiration_date,
          lot_number: item.lot_number
        }));
        
        allDrugs = [...allDrugs, ...drugData];
        
        // Check if there are more pages
        hasMoreData = inventoryData.length === limit;
        page++;
        
        // Safety check to prevent infinite loops
        if (page > 50) break;
      }
      
      setDrugs(allDrugs);
      setFilteredDrugs(allDrugs);
      
    } catch (err) {
      console.error('Failed to load store drugs data:', err);
      setError(err.response?.data?.error || 'Failed to load store drugs data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading drugs database...</span>
      </div>
    );
  }

  return (
    <div className="browse-drugs-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Browse Store Drugs</h2>
          <p className="text-muted">View all drugs in your store's inventory</p>
        </div>
        <Button variant="outline-primary" onClick={loadDrugsData}>
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, NDC, or manufacturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <Badge bg="secondary" className="fs-6">
                {filteredDrugs.length} of {drugs.length} drugs
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Drugs Table */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Drugs Database</h5>
            <Badge bg="secondary">{filteredDrugs.length} drugs</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>NDC</th>
                  <th>Strength</th>
                  <th>Dosage Form</th>
                  <th>Route</th>
                  <th>Manufacturer</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.map((drug, index) => (
                  <tr key={drug.id || index}>
                    <td>
                      <div>
                        <strong>{drug.generic_name}</strong>
                        {drug.brand_name && drug.brand_name !== drug.generic_name && (
                          <div className="text-muted small">({drug.brand_name})</div>
                        )}
                      </div>
                    </td>
                    <td className="font-monospace small">{drug.ndc}</td>
                    <td className="small">{drug.strength || 'N/A'}</td>
                    <td className="small">{drug.dosage_form || 'N/A'}</td>
                    <td className="small">{drug.route || 'N/A'}</td>
                    <td className="small">{drug.manufacturer_name || 'N/A'}</td>
                    <td className="text-center">
                      <Badge bg={drug.quantity_on_hand <= (drug.reorder_level || 0) ? 'warning' : 'success'}>
                        {drug.quantity_on_hand || 0}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={drug.is_active ? 'success' : 'secondary'}>
                        {drug.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-muted small">
                      {formatDate(drug.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          {filteredDrugs.length === 0 && !loading && (
            <div className="text-center py-5">
              <i className="fas fa-pills fa-3x text-muted mb-3"></i>
              <h5>No Drugs Found</h5>
              <p className="text-muted">
                {searchTerm ? 'No drugs match your search criteria.' : 'No drugs in the database.'}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Store Information */}
      {user?.active_store_name && (
        <Card className="mt-4">
          <Card.Body>
            <div className="d-flex align-items-center">
              <i className="fas fa-info-circle text-primary me-3"></i>
              <div>
                <h6 className="mb-1">Database Overview</h6>
                <small className="text-muted">
                  Showing all drugs available in the system. Use "Search FDA" to add new drugs from the FDA database.
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default BrowseDrugs;