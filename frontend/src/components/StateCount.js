import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { inventoryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../css/components.css';

const StateCount = () => {
  const { user } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDrugData();
  }, []);

  const loadDrugData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!user?.active_store_id) {
        setError('No active store selected. Please select a store to continue.');
        return;
      }

      // Load all drugs by paginating through results
      let allDrugs = [];
      let page = 1;
      const limit = 100;
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await inventoryAPI.getByStore(user.active_store_id, { 
          page, 
          limit,
          active: true 
        });
        
        const drugData = response.data.inventory || [];
        allDrugs = [...allDrugs, ...drugData];
        
        // Check if there are more pages
        hasMoreData = drugData.length === limit;
        page++;
        
        // Safety check to prevent infinite loops
        if (page > 50) break;
      }
      
      setDrugs(allDrugs);
      
      // Initialize counts with current stock levels
      const initialCounts = {};
      allDrugs.forEach(drug => {
        initialCounts[drug.id] = drug.current_stock || '';
      });
      setCounts(initialCounts);
      
    } catch (err) {
      console.error('Failed to load drug data:', err);
      setError(err.response?.data?.error || 'Failed to load drug data');
    } finally {
      setLoading(false);
    }
  };

  const handleCountChange = (drugId, value) => {
    setCounts(prev => ({
      ...prev,
      [drugId]: value
    }));
  };

  const saveAuditEntries = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Prepare audit entries for drugs with count changes
      const auditEntries = [];
      
      drugs.forEach(drug => {
        const currentStock = parseInt(drug.current_stock) || 0;
        const countedStock = parseInt(counts[drug.id]) || 0;
        const difference = countedStock - currentStock;
        
        if (difference !== 0) {
          auditEntries.push({
            drug_id: drug.id,
            ndc: drug.ndc,
            transaction_type: 'audit',
            quantity_change: difference,
            reason: `Physical count adjustment: Counted ${countedStock}, System showed ${currentStock}`,
            reference_number: `AUDIT-${new Date().getTime()}-${drug.id}`,
            notes: notes || `State count performed on ${countDate}`,
            transaction_date: countDate
          });
        }
      });

      if (auditEntries.length === 0) {
        setError('No count changes detected. Enter different counts to create audit entries.');
        return;
      }

      // Save audit entries using the inventory audit endpoint
      for (const entry of auditEntries) {
        const drug = drugs.find(d => d.id === entry.drug_id);
        const actualQuantity = parseInt(counts[entry.drug_id]) || 0;
        
        await inventoryAPI.audit(drug.id, {
          actual_quantity: actualQuantity,
          reason: entry.reason
        });
      }

      setSuccess(`Successfully created ${auditEntries.length} audit entries for count adjustments.`);
      
      // Reload drug data to reflect new stock levels
      await loadDrugData();
      
    } catch (err) {
      console.error('Failed to save audit entries:', err);
      setError(err.response?.data?.error || 'Failed to save audit entries');
    } finally {
      setSaving(false);
    }
  };

  const getVariance = (drugId, originalStock) => {
    const countedStock = parseInt(counts[drugId]) || 0;
    const original = parseInt(originalStock) || 0;
    return countedStock - original;
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return 'text-success';
    if (variance < 0) return 'text-danger';
    return 'text-muted';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading inventory state count...</span>
      </div>
    );
  }

  return (
    <div className="state-count-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Physical Inventory Count</h2>
          <p className="text-muted">Enter actual on-hand counts for each drug to create audit adjustments</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={loadDrugData} disabled={saving}>
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </Button>
          <Button 
            variant="success" 
            onClick={saveAuditEntries} 
            disabled={saving || drugs.length === 0}
          >
            {saving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Save Count
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Count Parameters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Count Date</Form.Label>
                <Form.Control
                  type="date"
                  value={countDate}
                  onChange={(e) => setCountDate(e.target.value)}
                  disabled={saving}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Enter any notes about this physical count..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={saving}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Drug Count Table */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Drug Inventory Count</h5>
            <Badge bg="secondary">{drugs.length} drugs</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>NDC</th>
                  <th>System Count</th>
                  <th>Physical Count</th>
                  <th>Variance</th>
                  <th>Unit Cost</th>
                </tr>
              </thead>
              <tbody>
                {drugs.map((drug, index) => {
                  const variance = getVariance(drug.id, drug.current_stock);
                  const varianceColor = getVarianceColor(variance);
                  
                  return (
                    <tr key={drug.id || index} className={variance !== 0 ? 'table-warning' : ''}>
                      <td>
                        <div>
                          <strong>{drug.generic_name}</strong>
                          {drug.brand_name && drug.brand_name !== drug.generic_name && (
                            <div className="text-muted small">({drug.brand_name})</div>
                          )}
                        </div>
                      </td>
                      <td className="font-monospace small">{drug.ndc}</td>
                      <td>
                        <Badge bg="secondary">{drug.current_stock || 0}</Badge>
                        {drug.unit_of_measure && (
                          <span className="text-muted ms-1 small">{drug.unit_of_measure}</span>
                        )}
                      </td>
                      <td>
                        <InputGroup size="sm" style={{ width: '120px' }}>
                          <Form.Control
                            type="number"
                            min="0"
                            step="1"
                            value={counts[drug.id] || ''}
                            onChange={(e) => handleCountChange(drug.id, e.target.value)}
                            disabled={saving}
                            placeholder="Count"
                          />
                        </InputGroup>
                      </td>
                      <td>
                        <span className={`fw-bold ${varianceColor}`}>
                          {variance > 0 && '+'}
                          {variance !== 0 ? variance : '—'}
                        </span>
                      </td>
                      <td className="small">{formatCurrency(drug.unit_cost || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          
          {drugs.length === 0 && !loading && (
            <div className="text-center py-5">
              <i className="fas fa-pills fa-3x text-muted mb-3"></i>
              <h5>No Drugs Found</h5>
              <p className="text-muted">Add some drugs to inventory to perform a physical count.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Instructions */}
      <Card className="mt-4">
        <Card.Body>
          <div className="d-flex align-items-start">
            <i className="fas fa-info-circle text-primary me-3 mt-1"></i>
            <div>
              <h6 className="mb-2">Instructions:</h6>
              <ul className="mb-0 small">
                <li>Enter the actual physical count for each drug in the "Physical Count" column</li>
                <li>Drugs with variances (differences between system and physical counts) are highlighted in yellow</li>
                <li>Positive variances (+) indicate more stock than the system shows</li>
                <li>Negative variances (-) indicate less stock than the system shows</li>
                <li>Click "Save Count" to create audit entries for all drugs with variances</li>
                <li>The system inventory will be automatically updated to match your physical counts</li>
              </ul>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Store Information */}
      {user?.active_store_name && (
        <Card className="mt-3">
          <Card.Body>
            <div className="d-flex align-items-center">
              <i className="fas fa-store text-primary me-3"></i>
              <div>
                <h6 className="mb-1">Store: {user.active_store_name}</h6>
                <small className="text-muted">
                  Count session started: {new Date().toLocaleString()}
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default StateCount;