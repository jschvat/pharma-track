import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { auditAPI } from '../services/api';

const NDCAuditReport = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  
  const [formData, setFormData] = useState({
    store_id: user.store_id || '',
    ndc: '',
    audit_point_date: '',
    restrict_to_future_date: '',
    include_inactive: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const generateReport = async () => {
    if (!formData.ndc || !formData.store_id) {
      setError('NDC and Store are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = {};
      if (formData.audit_point_date) params.audit_point_date = formData.audit_point_date;
      if (formData.restrict_to_future_date) params.restrict_to_future_date = formData.restrict_to_future_date;
      if (formData.include_inactive) params.include_inactive = formData.include_inactive;

      const response = await auditAPI.getNDCReport(formData.store_id, formData.ndc.replace(/[^\d]/g, ''), params);
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = 'csv') => {
    if (!reportData) return;

    try {
      setLoading(true);
      const params = {
        format,
        audit_point_date: formData.audit_point_date || undefined,
        restrict_to_future_date: formData.restrict_to_future_date || undefined,
        include_inactive: formData.include_inactive || undefined
      };

      const response = await auditAPI.exportNDCReport(formData.store_id, formData.ndc.replace(/[^\d]/g, ''), params);
      
      // Create download link
      const blob = new Blob([format === 'csv' ? response.data : JSON.stringify(response.data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ndc-${formData.ndc}-audit-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionBadge = (type) => {
    const badges = {
      prescription_fill: { bg: 'primary', text: 'Prescription' },
      return_to_stock: { bg: 'success', text: 'Return' },
      expire: { bg: 'danger', text: 'Expired' },
      audit: { bg: 'warning', text: 'Audit' },
      adjustment: { bg: 'info', text: 'Adjustment' },
      initial_inventory: { bg: 'secondary', text: 'Initial' }
    };
    const badge = badges[type] || { bg: 'secondary', text: type };
    return <Badge bg={badge.bg}>{badge.text}</Badge>;
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>NDC Audit Report</h2>
          <p className="text-muted">Generate comprehensive audit reports for specific drugs</p>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Report Form */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Report Parameters</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Store</Form.Label>
                <Form.Select
                  name="store_id"
                  value={formData.store_id}
                  onChange={handleInputChange}
                  required
                  disabled={!isAdmin()}
                >
                  {!isAdmin() && user.store_id && (
                    <option value={user.store_id}>{user.store_name}</option>
                  )}
                  {isAdmin() && (
                    <>
                      <option value="">Select Store...</option>
                      {/* Would need to load stores list for admin */}
                    </>
                  )}
                </Form.Select>
                {!isAdmin() && (
                  <Form.Text className="text-muted">
                    You can only generate reports for your assigned store
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>NDC (National Drug Code)</Form.Label>
                <Form.Control
                  type="text"
                  name="ndc"
                  value={formData.ndc}
                  onChange={handleInputChange}
                  placeholder="e.g., 12345-678-90 or 1234567890"
                  required
                />
                <Form.Text className="text-muted">
                  Enter NDC with or without dashes
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="include_inactive"
                  checked={formData.include_inactive}
                  onChange={handleInputChange}
                  label="Include inactive inventory items"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Audit Point Date (Start Date)</Form.Label>
                <Form.Control
                  type="date"
                  name="audit_point_date"
                  value={formData.audit_point_date}
                  onChange={handleInputChange}
                />
                <Form.Text className="text-muted">
                  Leave blank to include all historical data
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Restrict to Future Date (End Date)</Form.Label>
                <Form.Control
                  type="date"
                  name="restrict_to_future_date"
                  value={formData.restrict_to_future_date}
                  onChange={handleInputChange}
                  min={formData.audit_point_date || undefined}
                />
                <Form.Text className="text-muted">
                  Leave blank for no end date restriction
                </Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button
                  variant="primary"
                  onClick={generateReport}
                  disabled={loading || !formData.ndc || !formData.store_id}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Generating Report...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Report Results */}
      {reportData && (
        <>
          {/* Drug & Store Information */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Drug Information</h6>
                </Card.Header>
                <Card.Body>
                  <div><strong>Generic Name:</strong> {reportData.drug_info.generic_name}</div>
                  <div><strong>Brand Name:</strong> {reportData.drug_info.brand_name || 'N/A'}</div>
                  <div><strong>NDC:</strong> <code>{reportData.drug_info.ndc}</code></div>
                  <div><strong>Manufacturer:</strong> {reportData.drug_info.manufacturer_name || 'N/A'}</div>
                  <div><strong>Dosage Form:</strong> {reportData.drug_info.dosage_form || 'N/A'}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h6 className="mb-0">Store Information</h6>
                </Card.Header>
                <Card.Body>
                  {reportData.store_info ? (
                    <>
                      <div><strong>Name:</strong> {reportData.store_info.name}</div>
                      <div><strong>Address:</strong> {reportData.store_info.address}, {reportData.store_info.state} {reportData.store_info.zipcode}</div>
                      <div><strong>DEA:</strong> {reportData.store_info.dea_registration_number}</div>
                      <div><strong>NPI:</strong> {reportData.store_info.npi}</div>
                    </>
                  ) : (
                    <div className="text-muted">Store information not available</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Audit Summary */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Audit Summary</h6>
              <div>
                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => exportReport('csv')}>
                  Export CSV
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => exportReport('json')}>
                  Export JSON
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <div className="text-center">
                    <h4 className="text-primary">{reportData.audit_summary.total_transactions}</h4>
                    <div className="text-muted">Total Transactions</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <h4 className="text-success">{reportData.audit_summary.final_running_total}</h4>
                    <div className="text-muted">Final Stock Level</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <h4 className="text-warning">{reportData.audit_summary.transaction_breakdown.prescription_fills}</h4>
                    <div className="text-muted">Prescriptions Filled</div>
                  </div>
                </Col>
              </Row>

              {reportData.audit_summary.audit_point_date && (
                <div className="mt-3 text-muted small">
                  <strong>Report Period:</strong> {reportData.audit_summary.audit_point_date} 
                  {reportData.audit_summary.restriction_end_date && ` to ${reportData.audit_summary.restriction_end_date}`}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Transaction Breakdown */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Transaction Breakdown</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2}>
                  <div className="text-center">
                    <div className="h5">{reportData.audit_summary.transaction_breakdown.prescription_fills}</div>
                    <Badge bg="primary">Prescriptions</Badge>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <div className="h5">{reportData.audit_summary.transaction_breakdown.returns_to_stock}</div>
                    <Badge bg="success">Returns</Badge>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <div className="h5">{reportData.audit_summary.transaction_breakdown.expired_medications}</div>
                    <Badge bg="danger">Expired</Badge>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <div className="h5">{reportData.audit_summary.transaction_breakdown.audit_adjustments}</div>
                    <Badge bg="warning">Audits</Badge>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <div className="h5">{reportData.audit_summary.transaction_breakdown.other_adjustments}</div>
                    <Badge bg="info">Adjustments</Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Detailed Transactions */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">Detailed Transaction History</h6>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Qty Change</th>
                      <th>Before</th>
                      <th>After</th>
                      <th>Running Total</th>
                      <th>User</th>
                      <th>Reason</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.audit_entries.map((entry, index) => (
                      <tr key={index}>
                        <td className="small">
                          {new Date(entry.transaction_date).toLocaleDateString()}
                        </td>
                        <td>{getTransactionBadge(entry.transaction_type)}</td>
                        <td>
                          <span className={entry.quantity_change < 0 ? 'text-danger' : 'text-success'}>
                            {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change}
                          </span>
                        </td>
                        <td>{entry.quantity_before}</td>
                        <td>{entry.quantity_after}</td>
                        <td><strong>{entry.running_total}</strong></td>
                        <td className="small">
                          {entry.performed_by_name}
                          <div className="text-muted">{entry.performed_by_role}</div>
                        </td>
                        <td className="small" style={{ maxWidth: '200px' }}>
                          <div className="text-truncate" title={entry.reason}>
                            {entry.reason}
                          </div>
                        </td>
                        <td className="small">
                          {entry.reference_number || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {reportData.audit_entries.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    No transactions found for the specified criteria
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          <div className="mt-3 text-muted small">
            Report generated on: {new Date(reportData.generated_at).toLocaleString()}
          </div>
        </>
      )}
    </Container>
  );
};

export default NDCAuditReport;