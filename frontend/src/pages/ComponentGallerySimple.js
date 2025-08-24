import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Badge, Alert, Button, Form, Table, Breadcrumb } from 'react-bootstrap';
import PharmaButton from '../components/common/PharmaButton';
import PharmaCard, { MedicationPlannerCard, CountingTrayCard } from '../components/common/PharmaCard';
import PharmaDropdown from '../components/common/PharmaDropdown';
import MultiSelectDropdown from '../components/common/MultiSelectDropdown';
import PharmaDataGrid from '../components/common/PharmaDataGrid';
import PharmaBadge, { StatusBadge, DrugStatusBadge, StockStatusBadge, ExpirationBadge } from '../components/common/PharmaBadge';
import PharmaSpinner, { PillSpinner, CapsuleSpinner, TabletSpinner, PrescriptionSpinner } from '../components/common/PharmaSpinner';
import PharmaNavbar, { PharmacyNavbar, AdminNavbar } from '../components/common/PharmaNavbar';
import PharmaPagination, { InventoryPagination, PrescriptionPagination } from '../components/common/PharmaPagination';
import PharmaAccordion, { DrugInfoAccordion, PrescriptionWorkflowAccordion } from '../components/common/PharmaAccordion';
import PharmaOffcanvas, { PrescriptionDetailsOffcanvas, DrugInfoOffcanvas } from '../components/common/PharmaOffcanvas';
import PharmaToast, { PharmaToastProvider, usePharmaToast } from '../components/common/PharmaToast';
import PharmaBarcodeScanner from '../components/common/PharmaBarcodeScanner';
import PharmaAuditTrail from '../components/common/PharmaAuditTrail';

import './ComponentGallery.css';

const ComponentGallerySimple = () => {
  const [activeCategory, setActiveCategory] = useState('buttons');

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Development Only</Alert.Heading>
          <p>The Component Gallery is only available in development mode.</p>
        </Alert>
      </Container>
    );
  }

  const categories = {
    buttons: {
      title: 'Buttons & Actions',
      icon: 'fas fa-mouse-pointer',
      components: [
        {
          name: 'Basic Buttons',
          description: 'Standard Bootstrap buttons with pharmacy-specific styling',
          examples: [
            {
              title: 'Button Variants',
              component: (
                <div className="d-flex gap-2 flex-wrap">
                  <Button variant="primary">Primary</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="outline-primary">Outline</Button>
                </div>
              )
            },
            {
              title: 'Buttons with Icons',
              component: (
                <div className="d-flex gap-2">
                  <Button variant="success">
                    <i className="fas fa-pills me-2"></i>
                    Fill Prescription
                  </Button>
                  <Button variant="danger">
                    <i className="fas fa-trash me-2"></i>
                    Delete
                  </Button>
                </div>
              )
            },
            {
              title: 'Button Sizes',
              component: (
                <div className="d-flex gap-2 align-items-center">
                  <Button size="sm">Small</Button>
                  <Button>Normal</Button>
                  <Button size="lg">Large</Button>
                </div>
              )
            }
          ]
        },
        {
          name: 'PharmaButton Effects',
          description: 'Enhanced PharmaButton with controllable hover and click effects',
          examples: [
            {
              title: 'Effect Intensity Levels',
              component: (
                <div className="d-flex gap-3 flex-wrap">
                  <PharmaButton variant="primary" effectIntensity="subtle">
                    Subtle Effect
                  </PharmaButton>
                  <PharmaButton variant="success" effectIntensity="medium">
                    Medium Effect
                  </PharmaButton>
                  <PharmaButton variant="warning" effectIntensity="strong">
                    Strong Effect
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'Effect Controls',
              component: (
                <div className="d-flex gap-3 flex-wrap">
                  <PharmaButton variant="primary" hoverEffect={true} clickEffect={true}>
                    All Effects On
                  </PharmaButton>
                  <PharmaButton variant="secondary" hoverEffect={true} clickEffect={false}>
                    Hover Only
                  </PharmaButton>
                  <PharmaButton variant="info" hoverEffect={false} clickEffect={true}>
                    Click Only
                  </PharmaButton>
                  <PharmaButton variant="danger" hoverEffect={false} clickEffect={false}>
                    No Effects
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'With Icons and Loading',
              component: (
                <div className="d-flex gap-3 flex-wrap">
                  <PharmaButton 
                    variant="success" 
                    effectIntensity="strong"
                    icon={<i className="fas fa-pills"></i>}
                  >
                    Fill Prescription
                  </PharmaButton>
                  <PharmaButton 
                    variant="primary" 
                    effectIntensity="medium"
                    loading={true}
                    loadingText="Saving..."
                  >
                    Save Changes
                  </PharmaButton>
                  <PharmaButton 
                    variant="warning" 
                    effectIntensity="strong"
                    outline={true}
                    icon={<i className="fas fa-exclamation-triangle"></i>}
                  >
                    Warning Action
                  </PharmaButton>
                </div>
              )
            }
          ]
        },
        {
          name: 'Pill & Capsule Themes',
          description: 'Pharmacy-themed buttons that look like real medications',
          examples: [
            {
              title: 'Pill Theme (Tablet-like)',
              component: (
                <div className="d-flex gap-3 flex-wrap">
                  <PharmaButton variant="primary" theme="pill">
                    Primary Pill
                  </PharmaButton>
                  <PharmaButton variant="success" theme="pill">
                    Success Pill
                  </PharmaButton>
                  <PharmaButton variant="danger" theme="pill">
                    Danger Pill
                  </PharmaButton>
                  <PharmaButton variant="warning" theme="pill">
                    Warning Pill
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'Capsule Theme (Two-toned)',
              component: (
                <div className="d-flex gap-3 flex-wrap">
                  <PharmaButton variant="primary" theme="capsule">
                    Primary Capsule
                  </PharmaButton>
                  <PharmaButton variant="success" theme="capsule">
                    Success Capsule
                  </PharmaButton>
                  <PharmaButton variant="danger" theme="capsule">
                    Danger Capsule
                  </PharmaButton>
                  <PharmaButton variant="info" theme="capsule">
                    Info Capsule
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'Themed Buttons with Icons',
              component: (
                <div className="d-flex gap-3 flex-wrap">
                  <PharmaButton 
                    variant="success" 
                    theme="pill"
                    icon={<i className="fas fa-pills"></i>}
                    effectIntensity="strong"
                  >
                    Fill Prescription
                  </PharmaButton>
                  <PharmaButton 
                    variant="primary" 
                    theme="capsule"
                    icon={<i className="fas fa-capsules"></i>}
                    effectIntensity="strong"
                  >
                    Manage Inventory
                  </PharmaButton>
                  <PharmaButton 
                    variant="warning" 
                    theme="pill"
                    icon={<i className="fas fa-exclamation-triangle"></i>}
                    size="sm"
                  >
                    Low Stock
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'Tablet Theme (Scored, Flat)',
              component: (
                <div className="d-flex gap-3 flex-wrap">
                  <PharmaButton variant="primary" theme="tablet">
                    Primary Tablet
                  </PharmaButton>
                  <PharmaButton variant="success" theme="tablet">
                    Success Tablet
                  </PharmaButton>
                  <PharmaButton variant="danger" theme="tablet">
                    Danger Tablet
                  </PharmaButton>
                  <PharmaButton variant="warning" theme="tablet">
                    Warning Tablet
                  </PharmaButton>
                  <PharmaButton variant="info" theme="tablet">
                    Info Tablet
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'All Themes Comparison',
              component: (
                <div className="d-flex gap-3 flex-wrap align-items-center">
                  <PharmaButton variant="primary" theme="default">
                    Default
                  </PharmaButton>
                  <PharmaButton variant="primary" theme="pill">
                    Pill
                  </PharmaButton>
                  <PharmaButton variant="primary" theme="capsule">
                    Capsule
                  </PharmaButton>
                  <PharmaButton variant="primary" theme="tablet">
                    Tablet
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'Tablet Imprints',
              component: (
                <div className="d-flex gap-3 flex-wrap align-items-center">
                  <PharmaButton variant="primary" theme="tablet" imprint="500">
                    500mg Tablet
                  </PharmaButton>
                  <PharmaButton variant="success" theme="tablet" imprint="250">
                    250mg Tablet
                  </PharmaButton>
                  <PharmaButton variant="warning" theme="tablet" imprint="125">
                    125mg Tablet
                  </PharmaButton>
                  <PharmaButton variant="info" theme="tablet" imprint="PT">
                    Default Imprint
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'Different Sizes',
              component: (
                <div className="d-flex gap-3 flex-wrap align-items-center">
                  <PharmaButton variant="primary" theme="pill" size="sm">
                    Small Pill
                  </PharmaButton>
                  <PharmaButton variant="success" theme="capsule" size="md">
                    Medium Capsule
                  </PharmaButton>
                  <PharmaButton variant="danger" theme="tablet" size="lg" imprint="XL">
                    Large Tablet
                  </PharmaButton>
                </div>
              )
            }
          ]
        }
      ]
    },
    forms: {
      title: 'Forms & Inputs',
      icon: 'fas fa-edit',
      components: [
        {
          name: 'Dropdown Positioning Test',
          description: 'Test PharmaDropdown positioning compared to MultiSelectDropdown',
          examples: [
            {
              title: 'Dropdown Positioning Comparison',
              component: (
                <div className="mb-4">
                  <Alert variant="info" className="mb-3">
                    <strong>Positioning Test:</strong> Both dropdowns should position identically without clipping issues.
                    Try opening them in various scroll positions and table contexts.
                  </Alert>
                  
                  <Table striped bordered className="mb-4">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Single Select</th>
                        <th>Multi Select</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Standard</strong></td>
                        <td>
                          <PharmaDropdown
                            options={[
                              { value: 'acetaminophen', label: 'Acetaminophen 500mg' },
                              { value: 'ibuprofen', label: 'Ibuprofen 200mg' },
                              { value: 'amoxicillin', label: 'Amoxicillin 250mg Capsules' },
                              { value: 'lisinopril', label: 'Lisinopril 10mg Tablets' },
                              { value: 'metformin', label: 'Metformin Extended Release 500mg' }
                            ]}
                            selectedValue={null}
                            onSelectionChange={(value) => {/* Handle selection */}}
                            placeholder="Select medication..."
                            variant="outline-primary"
                            autoSize={true}
                          />
                        </td>
                        <td>
                          <MultiSelectDropdown
                            options={[
                              { value: 'acetaminophen', label: 'Acetaminophen 500mg' },
                              { value: 'ibuprofen', label: 'Ibuprofen 200mg' },
                              { value: 'amoxicillin', label: 'Amoxicillin 250mg Capsules' },
                              { value: 'lisinopril', label: 'Lisinopril 10mg Tablets' },
                              { value: 'metformin', label: 'Metformin Extended Release 500mg' }
                            ]}
                            selectedValues={[]}
                            onSelectionChange={(values) => {/* Handle selections */}}
                            placeholder="Select medications..."
                            variant="outline-primary"
                            autoSize={true}
                          />
                        </td>
                        <td><Badge bg="success">Fixed</Badge></td>
                      </tr>
                      <tr>
                        <td><strong>Searchable</strong></td>
                        <td>
                          <PharmaDropdown
                            options={[
                              { value: 'atorvastatin', label: 'Atorvastatin 20mg' },
                              { value: 'amlodipine', label: 'Amlodipine 5mg' },
                              { value: 'omeprazole', label: 'Omeprazole 20mg' },
                              { value: 'sertraline', label: 'Sertraline 50mg' },
                              { value: 'gabapentin', label: 'Gabapentin 300mg' }
                            ]}
                            selectedValue={null}
                            onSelectionChange={(value) => {/* Handle selection */}}
                            placeholder="Search medications..."
                            variant="outline-secondary"
                            searchable={true}
                            clearable={true}
                            autoSize={true}
                          />
                        </td>
                        <td>
                          <MultiSelectDropdown
                            options={[
                              { value: 'atorvastatin', label: 'Atorvastatin 20mg' },
                              { value: 'amlodipine', label: 'Amlodipine 5mg' },
                              { value: 'omeprazole', label: 'Omeprazole 20mg' },
                              { value: 'sertraline', label: 'Sertraline 50mg' },
                              { value: 'gabapentin', label: 'Gabapentin 300mg' }
                            ]}
                            selectedValues={[]}
                            onSelectionChange={(values) => {/* Handle selections */}}
                            placeholder="Select multiple medications..."
                            variant="outline-secondary"
                            autoSize={true}
                            showClearAll={true}
                          />
                        </td>
                        <td><Badge bg="success">Fixed</Badge></td>
                      </tr>
                      <tr>
                        <td><strong>Long Labels</strong></td>
                        <td>
                          <PharmaDropdown
                            options={[
                              { value: 'long1', label: 'Very Long Medication Name That Could Cause Width Issues 500mg Extended Release Tablets' },
                              { value: 'long2', label: 'Another Extremely Long Drug Name With Multiple Strength Designations 250mg/5ml Oral Suspension' },
                              { value: 'long3', label: 'Super Long Pharmaceutical Product Name With Brand and Generic Information 10mg Capsules' }
                            ]}
                            selectedValue={null}
                            onSelectionChange={(value) => {/* Handle selection */}}
                            placeholder="Select long-named medication..."
                            variant="outline-warning"
                            autoSize={true}
                            maxMenuWidth="500px"
                          />
                        </td>
                        <td>
                          <MultiSelectDropdown
                            options={[
                              { value: 'long1', label: 'Very Long Medication Name That Could Cause Width Issues 500mg Extended Release Tablets' },
                              { value: 'long2', label: 'Another Extremely Long Drug Name With Multiple Strength Designations 250mg/5ml Oral Suspension' },
                              { value: 'long3', label: 'Super Long Pharmaceutical Product Name With Brand and Generic Information 10mg Capsules' }
                            ]}
                            selectedValues={[]}
                            onSelectionChange={(values) => {/* Handle selections */}}
                            placeholder="Select multiple long-named medications..."
                            variant="outline-warning"
                            autoSize={true}
                            maxMenuWidth="500px"
                          />
                        </td>
                        <td><Badge bg="success">Fixed</Badge></td>
                      </tr>
                    </tbody>
                  </Table>
                  
                  <div className="row">
                    <div className="col-6">
                      <h6 className="text-primary">Positioning Features:</h6>
                      <ul className="small">
                        <li>Fixed positioning prevents clipping</li>
                        <li>Portal rendering escapes table constraints</li>
                        <li>Auto-sizing based on content width</li>
                        <li>Scroll detection closes dropdowns</li>
                        <li>High z-index prevents overlap issues</li>
                      </ul>
                    </div>
                    <div className="col-6">
                      <h6 className="text-success">Fixes Applied:</h6>
                      <ul className="small">
                        <li>✅ Consistent width calculation (90px padding)</li>
                        <li>✅ Removed hidden measurement element</li>
                        <li>✅ Added 10ms setTimeout for DOM readiness</li>
                        <li>✅ Matching positioning logic</li>
                        <li>✅ Identical CSS escape classes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          name: 'Form Components',
          description: 'Form inputs and controls for pharmacy data entry',
          examples: [
            {
              title: 'Basic Form',
              component: (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Patient Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter patient name"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control 
                      type="email" 
                      placeholder="patient@example.com"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control 
                      type="tel" 
                      placeholder="(555) 123-4567"
                    />
                  </Form.Group>
                  <div className="d-flex gap-2">
                    <Button variant="primary">Submit</Button>
                    <Button variant="secondary">Cancel</Button>
                  </div>
                </Form>
              )
            },
            {
              title: 'Select and Checkbox',
              component: (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Medication Type</Form.Label>
                    <Form.Select>
                      <option>Choose medication type...</option>
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="liquid">Liquid</option>
                      <option value="injection">Injection</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Check 
                    type="checkbox"
                    label="Patient has allergies"
                  />
                  <Form.Check 
                    type="checkbox"
                    label="Generic substitution allowed"
                  />
                </Form>
              )
            }
          ]
        }
      ]
    },
    display: {
      title: 'Data Display',
      icon: 'fas fa-table',
      components: [
        {
          name: 'Data Tables',
          description: 'Tables for displaying pharmacy inventory and prescription data',
          examples: [
            {
              title: 'Basic Table',
              component: (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>NDC</th>
                      <th>Quantity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Amoxicillin 500mg</td>
                      <td>12345-678-90</td>
                      <td>100</td>
                      <td><Badge bg="success">Active</Badge></td>
                    </tr>
                    <tr>
                      <td>Ibuprofen 200mg</td>
                      <td>98765-432-10</td>
                      <td>50</td>
                      <td><Badge bg="warning">Low Stock</Badge></td>
                    </tr>
                    <tr>
                      <td>Metformin 500mg</td>
                      <td>11111-222-33</td>
                      <td>200</td>
                      <td><Badge bg="success">Active</Badge></td>
                    </tr>
                  </tbody>
                </Table>
              )
            }
          ]
        },
        {
          name: 'Cards',
          description: 'Card components for displaying pharmacy information',
          examples: [
            {
              title: 'Information Cards',
              component: (
                <Row>
                  <Col md={6}>
                    <Card>
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">Patient Information</h6>
                      </Card.Header>
                      <Card.Body>
                        <p><strong>Name:</strong> John Doe</p>
                        <p><strong>DOB:</strong> 01/15/1980</p>
                        <p><strong>Allergies:</strong> Penicillin, Sulfa</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <Card.Header className="bg-info text-white">
                        <h6 className="mb-0">Prescription Details</h6>
                      </Card.Header>
                      <Card.Body>
                        <p><strong>RX Number:</strong> RX123456</p>
                        <p><strong>Drug:</strong> Amoxicillin 500mg</p>
                        <p><strong>Quantity:</strong> 30 capsules</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]
        },
        {
          name: 'Counting Tray Cards',
          description: 'Realistic pharmacy counting tray appearance for medication handling',
          examples: [
            {
              title: 'Basic Counting Tray',
              component: (
                <Row>
                  <Col md={6}>
                    <CountingTrayCard
                      title="Prescription Counting"
                      subtitle="Count and verify medication quantities"
                    >
                      <div className="text-center">
                        <div className="mb-3">
                          <h4 className="text-primary">30 <small className="text-muted">tablets</small></h4>
                          <p className="mb-1"><strong>Amoxicillin 500mg</strong></p>
                          <p className="text-muted small">NDC: 12345-678-90</p>
                        </div>
                        <div className="d-flex justify-content-center gap-2">
                          <PharmaButton variant="success" size="sm">
                            <i className="fas fa-check me-2"></i>
                            Verified
                          </PharmaButton>
                          <PharmaButton variant="outline-secondary" size="sm">
                            <i className="fas fa-redo me-2"></i>
                            Recount
                          </PharmaButton>
                        </div>
                      </div>
                    </CountingTrayCard>
                  </Col>
                  <Col md={6}>
                    <CountingTrayCard
                      title="Multi-Drug Count"
                      variant="primary"
                    >
                      <div className="row text-center">
                        <div className="col-6">
                          <h5>25</h5>
                          <small>Ibuprofen</small>
                        </div>
                        <div className="col-6">
                          <h5>15</h5>
                          <small>Acetaminophen</small>
                        </div>
                      </div>
                      <div className="text-center mt-3">
                        <PharmaButton variant="primary" size="sm" className="w-100">
                          <i className="fas fa-clipboard-check me-2"></i>
                          Complete Count
                        </PharmaButton>
                      </div>
                    </CountingTrayCard>
                  </Col>
                </Row>
              )
            },
            {
              title: 'Different Variants',
              component: (
                <Row>
                  <Col md={4}>
                    <CountingTrayCard
                      title="Standard Tray"
                      variant="default"
                    >
                      <div className="text-center">
                        <i className="fas fa-pills fa-2x text-secondary mb-2"></i>
                        <p className="mb-1">Ready for counting</p>
                      </div>
                    </CountingTrayCard>
                  </Col>
                  <Col md={4}>
                    <CountingTrayCard
                      title="Active Count"
                      variant="success"
                    >
                      <div className="text-center">
                        <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                        <p className="mb-1">Count verified</p>
                      </div>
                    </CountingTrayCard>
                  </Col>
                  <Col md={4}>
                    <CountingTrayCard
                      title="Needs Attention"
                      variant="warning"
                    >
                      <div className="text-center">
                        <i className="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                        <p className="mb-1">Recount required</p>
                      </div>
                    </CountingTrayCard>
                  </Col>
                </Row>
              )
            }
          ]
        },
        {
          name: 'Medication Planner Cards',
          description: 'Organized grid layout for medication scheduling and dosing',
          examples: [
            {
              title: 'Daily Medication Planner',
              component: (
                <Row>
                  <Col md={10}>
                    <MedicationPlannerCard
                      title="Daily Medication Schedule"
                      subtitle="Organize medications by time and dosage"
                      plannerSize="medium"
                      plannerCompartments={[
                        { value: '2 tablets', label: 'Metformin', time: '8:00 AM', icon: <i className="fas fa-pills"></i> },
                        { value: '1 capsule', label: 'Vitamin D', time: '8:00 AM', icon: <i className="fas fa-capsules"></i> },
                        { value: '1 tablet', label: 'Lisinopril', time: '12:00 PM', icon: <i className="fas fa-pills"></i> },
                        { value: '1 tablet', label: 'Aspirin', time: '12:00 PM', icon: <i className="fas fa-tablets"></i> },
                        { value: '2 tablets', label: 'Metformin', time: '6:00 PM', icon: <i className="fas fa-pills"></i> },
                        { value: '1 tablet', label: 'Omega-3', time: '6:00 PM', icon: <i className="fas fa-capsules"></i> }
                      ]}
                    >
                      <div className="text-center mt-3">
                        <PharmaButton variant="success" size="sm" className="me-2">
                          <i className="fas fa-check me-2"></i>
                          Mark Complete
                        </PharmaButton>
                        <PharmaButton variant="outline-primary" size="sm">
                          <i className="fas fa-plus me-2"></i>
                          Add Medication
                        </PharmaButton>
                      </div>
                    </MedicationPlannerCard>
                  </Col>
                </Row>
              )
            },
            {
              title: 'Weekly Planner Sizes',
              component: (
                <Row>
                  <Col md={4}>
                    <MedicationPlannerCard
                      title="Simple Plan"
                      plannerSize="small"
                      plannerCompartments={[
                        { value: '1', label: 'Morning', time: '8 AM' },
                        { value: '2', label: 'Noon', time: '12 PM' },
                        { value: '1', label: 'Evening', time: '6 PM' }
                      ]}
                    />
                  </Col>
                  <Col md={4}>
                    <MedicationPlannerCard
                      title="Daily Schedule" 
                      plannerSize="medium"
                      plannerCompartments={[
                        { value: '2', label: 'Breakfast' },
                        { value: '1', label: 'Lunch' },
                        { value: '3', label: 'Dinner' },
                        { value: '1', label: 'Bedtime' }
                      ]}
                    />
                  </Col>
                  <Col md={4}>
                    <MedicationPlannerCard
                      title="Weekly Overview"
                      plannerSize="large"
                      plannerCompartments={[
                        { value: 'Mon', label: '✓' },
                        { value: 'Tue', label: '✓' },
                        { value: 'Wed', label: '⏰' },
                        { value: 'Thu', label: '⏰' },
                        { value: 'Fri', label: '⏰' },
                        { value: 'Sat', label: '⏰' }
                      ]}
                    />
                  </Col>
                </Row>
              )
            }
          ]
        }
      ]
    },
    navigation: {
      title: 'Navigation',
      icon: 'fas fa-route',
      components: [
        {
          name: 'Breadcrumbs',
          description: 'Navigation breadcrumbs for pharmacy workflows',
          examples: [
            {
              title: 'Basic Breadcrumbs',
              component: (
                <Breadcrumb>
                  <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                  <Breadcrumb.Item href="/inventory">Inventory</Breadcrumb.Item>
                  <Breadcrumb.Item href="/inventory/medications">Medications</Breadcrumb.Item>
                  <Breadcrumb.Item active>Edit Amoxicillin</Breadcrumb.Item>
                </Breadcrumb>
              )
            }
          ]
        }
      ]
    },
    feedback: {
      title: 'Feedback & Alerts',
      icon: 'fas fa-bell',
      components: [
        {
          name: 'Alerts',
          description: 'Alert messages for user feedback and notifications',
          examples: [
            {
              title: 'Alert Variants',
              component: (
                <div className="d-flex flex-column gap-2">
                  <Alert variant="success" dismissible>
                    <i className="fas fa-check-circle me-2"></i>
                    Prescription filled successfully!
                  </Alert>
                  <Alert variant="warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Low stock alert for Amoxicillin
                  </Alert>
                  <Alert variant="danger">
                    <i className="fas fa-times-circle me-2"></i>
                    Drug interaction detected
                  </Alert>
                  <Alert variant="info">
                    <i className="fas fa-info-circle me-2"></i>
                    Information message
                  </Alert>
                </div>
              )
            }
          ]
        },
        {
          name: 'Badges',
          description: 'Status indicators and labels',
          examples: [
            {
              title: 'Status Badges',
              component: (
                <div className="d-flex gap-2 flex-wrap">
                  <Badge bg="success">Active</Badge>
                  <Badge bg="warning">Low Stock</Badge>
                  <Badge bg="danger">Expired</Badge>
                  <Badge bg="info">Pending</Badge>
                  <Badge bg="secondary">Inactive</Badge>
                  <Badge bg="primary">Processing</Badge>
                </div>
              )
            }
          ]
        }
      ]
    },
    tables: {
      title: 'Data Tables',
      icon: 'fas fa-table',
      components: [
        {
          name: 'PharmaDataGrid',
          description: 'Advanced data grid with resizable columns, filtering, sorting, and pagination',
          examples: [
            {
              title: 'Resizable Columns Demo',
              component: (
                <div className="mb-4">
                  <Alert variant="info" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-arrows-alt-h me-2"></i>
                      Column Resizing Instructions
                    </h6>
                    <ul className="mb-0 small">
                      <li><strong>✋ Hover</strong> over the right edge of any column header to see the blue resize handle</li>
                      <li><strong>🖱️ Click and drag</strong> the blue handle to adjust column width</li>
                      <li><strong>📏 Minimum width</strong> is 50px to ensure readability</li>
                      <li><strong>🔒 Last column</strong> doesn't have a resize handle (fixed)</li>
                      <li><strong>📱 Open browser console</strong> to see resize events logged</li>
                    </ul>
                  </Alert>
                  
                  <Alert variant="warning" className="mb-3">
                    <strong>🔍 Look for the blue resize handles!</strong> They appear when you hover over the right edge of column headers.
                  </Alert>
                  
                  <PharmaDataGrid
                    data={[
                      {
                        id: 1,
                        drug_name: 'Amoxicillin',
                        strength: '500mg',
                        quantity: 150,
                        unit_cost: 0.45,
                        status: 'Active'
                      },
                      {
                        id: 2,
                        drug_name: 'Lisinopril',
                        strength: '10mg',
                        quantity: 300,
                        unit_cost: 0.12,
                        status: 'Active'
                      },
                      {
                        id: 3,
                        drug_name: 'Metformin',
                        strength: '1000mg',
                        quantity: 85,
                        unit_cost: 0.25,
                        status: 'Low Stock'
                      },
                      {
                        id: 4,
                        drug_name: 'Atorvastatin',
                        strength: '20mg',
                        quantity: 225,
                        unit_cost: 0.35,
                        status: 'Active'
                      },
                      {
                        id: 5,
                        drug_name: 'Hydrochlorothiazide',
                        strength: '25mg',
                        quantity: 75,
                        unit_cost: 0.08,
                        status: 'Low Stock'
                      }
                    ]}
                    columns={[
                      { 
                        field: 'drug_name', 
                        label: 'Drug Name',
                        width: '250px',
                        minWidth: '150px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'strength', 
                        label: 'Strength',
                        width: '120px',
                        minWidth: '100px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'quantity', 
                        label: 'Stock',
                        type: 'number',
                        width: '100px',
                        minWidth: '80px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'unit_cost', 
                        label: 'Unit Cost',
                        type: 'currency',
                        width: '120px',
                        minWidth: '100px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'status', 
                        label: 'Status',
                        width: '120px',
                        minWidth: '100px',
                        sortable: true,
                        resizable: false // Last column - no resize handle
                      }
                    ]}
                    resizable={true}
                    sortable={true}
                    filterable={false}
                    searchable={false}
                    paginated={false}
                    striped={true}
                    hover={true}
                    size="sm"
                    onColumnResize={(columnField, newWidth) => {
                      // Column resized - could store in state if needed
                    }}
                    className="border rounded"
                    style={{ minWidth: '600px' }}
                  />
                </div>
              )
            },
            {
              title: 'Column Resize Features',
              component: (
                <Row>
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-cogs me-2"></i>
                          Resize Features
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <ul className="list-unstyled mb-0">
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Visual Feedback:</strong> Blue highlight on hover and drag
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Minimum Width:</strong> Prevents columns from becoming too narrow
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Smooth Animation:</strong> Smooth transitions and cursor changes
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Event Callback:</strong> onColumnResize handler for state management
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Configurable:</strong> Enable/disable per column or entire grid
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-secondary text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-code me-2"></i>
                          Implementation
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <pre className="small mb-0" style={{ fontSize: '11px' }}>
{`<PharmaDataGrid
  resizable={true}
  columns={[
    {
      field: 'drug_name',
      label: 'Drug Name',
      width: '200px',
      minWidth: '150px',
      resizable: true
    }
  ]}
  onColumnResize={(field, width) => {
    // Handle column resize
  }}
/>`}
                        </pre>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              title: 'Fixed Width Columns (fillContainer=false)',
              component: (
                <div className="mb-4">
                  <Alert variant="info" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-ruler me-2"></i>
                      Fixed Width Columns Demo
                    </h6>
                    <p className="mb-0 small">
                      This demo shows the same data grid with <code>fillContainer=false</code>, 
                      meaning columns keep their defined widths and don't expand to fill the container width.
                      Compare with the demo above to see the difference.
                    </p>
                  </Alert>
                  
                  <PharmaDataGrid
                    data={[
                      {
                        id: 1,
                        drug_name: 'Amoxicillin',
                        strength: '500mg',
                        quantity: 150,
                        unit_cost: 0.45,
                        status: 'Active'
                      },
                      {
                        id: 2,
                        drug_name: 'Lisinopril',
                        strength: '10mg',
                        quantity: 300,
                        unit_cost: 0.12,
                        status: 'Active'
                      },
                      {
                        id: 3,
                        drug_name: 'Metformin',
                        strength: '1000mg',
                        quantity: 85,
                        unit_cost: 0.25,
                        status: 'Low Stock'
                      },
                      {
                        id: 4,
                        drug_name: 'Atorvastatin',
                        strength: '20mg',
                        quantity: 225,
                        unit_cost: 0.35,
                        status: 'Active'
                      }
                    ]}
                    columns={[
                      { 
                        field: 'drug_name', 
                        label: 'Drug Name',
                        width: '200px',
                        minWidth: '150px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'strength', 
                        label: 'Strength',
                        width: '100px',
                        minWidth: '80px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'quantity', 
                        label: 'Stock',
                        type: 'number',
                        width: '80px',
                        minWidth: '60px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'unit_cost', 
                        label: 'Unit Cost',
                        type: 'currency',
                        width: '100px',
                        minWidth: '80px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'status', 
                        label: 'Status',
                        width: '100px',
                        minWidth: '80px',
                        sortable: true,
                        resizable: false
                      }
                    ]}
                    resizable={true}
                    sortable={true}
                    filterable={false}
                    searchable={false}
                    paginated={false}
                    striped={true}
                    hover={true}
                    size="sm"
                    fillContainer={false}
                    onColumnResize={(columnField, newWidth) => {
                      // Column resized - could store in state if needed
                    }}
                    className="border rounded"
                    style={{ minWidth: '600px' }}
                  />
                  
                  <Alert variant="success" className="mt-3">
                    <strong>Notice:</strong> Columns maintain their exact specified widths (200px, 100px, 80px, etc.) 
                    and don't stretch to fill the container width. This gives you precise control over column sizing.
                  </Alert>
                </div>
              )
            },
            {
              title: 'Hardcoded Header Colors',
              component: (
                <div className="mb-4">
                  <Alert variant="info" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-palette me-2"></i>
                      Consistent Header Styling
                    </h6>
                    <p className="mb-0 small">
                      PharmaDataGrid uses hardcoded colors for consistent appearance: 
                      dark blue-gray header background (#2c3e50) with white text (#ffffff) for reliable, professional styling.
                    </p>
                  </Alert>
                  
                  <PharmaDataGrid
                    data={[
                      {
                        id: 1,
                        drug_name: 'Theme Test Drug',
                        strength: '100mg',
                        quantity: 50,
                        unit_cost: 1.25,
                        status: 'Active'
                      },
                      {
                        id: 2,
                        drug_name: 'Color Inheritance Demo',
                        strength: '200mg',
                        quantity: 75,
                        unit_cost: 2.50,
                        status: 'Active'
                      }
                    ]}
                    columns={[
                      { 
                        field: 'drug_name', 
                        label: 'Drug Name',
                        width: '200px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'strength', 
                        label: 'Strength',
                        width: '100px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'quantity', 
                        label: 'Stock',
                        type: 'number',
                        width: '80px',
                        sortable: true,
                        resizable: true
                      },
                      { 
                        field: 'unit_cost', 
                        label: 'Unit Cost',
                        type: 'currency',
                        width: '100px',
                        sortable: true,
                        resizable: false
                      }
                    ]}
                    resizable={true}
                    sortable={true}
                    striped={true}
                    hover={true}
                    size="sm"
                    className="border rounded"
                  />
                  
                  <Alert variant="success" className="mt-3">
                    <strong>🎨 Theme Integration:</strong> Headers automatically inherit from <code>--bs-primary</code> and related CSS custom properties. 
                    Perfect for multi-theme applications!
                  </Alert>
                </div>
              )
            },
            {
              title: 'Autofill Columns Toggle',
              component: (
                <div className="mb-4">
                  <Alert variant="info" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-expand-alt me-2"></i>
                      Column Autofill Toggle
                    </h6>
                    <p className="mb-0 small">
                      Toggle between auto-fitting columns to available space or using explicit pixel widths. 
                      Look for the <strong>toggle button</strong> in the toolbar next to the Export button.
                    </p>
                  </Alert>
                  
                  <Alert variant="success" className="mb-3">
                    <strong>🔧 Interactive Demo:</strong>
                    <ul className="mb-0 mt-2 small">
                      <li><strong>📐 Fill Width mode</strong> (blue button): Columns expand to fill container</li>
                      <li><strong>📏 Fit Columns mode</strong> (gray button): Fixed pixel widths</li>
                      <li><strong>📱 Responsive</strong>: Button text hidden on small screens</li>
                      <li><strong>🎯 Try it</strong>: Click the toggle and resize your browser window!</li>
                    </ul>
                  </Alert>
                  
                  <PharmaDataGrid
                    data={[
                      {
                        id: 1,
                        drug_name: 'Metformin HCL',
                        strength: '500mg',
                        quantity: 500,
                        unit_cost: 0.12,
                        status: 'Active'
                      },
                      {
                        id: 2,
                        drug_name: 'Lisinopril',
                        strength: '10mg',
                        quantity: 300,
                        unit_cost: 0.08,
                        status: 'Active'
                      },
                      {
                        id: 3,
                        drug_name: 'Amlodipine Besylate',
                        strength: '5mg',
                        quantity: 250,
                        unit_cost: 0.15,
                        status: 'Low Stock'
                      },
                      {
                        id: 4,
                        drug_name: 'Atorvastatin Calcium',
                        strength: '20mg',
                        quantity: 400,
                        unit_cost: 0.25,
                        status: 'Active'
                      },
                      {
                        id: 5,
                        drug_name: 'Simvastatin',
                        strength: '40mg',
                        quantity: 180,
                        unit_cost: 0.18,
                        status: 'Active'
                      }
                    ]}
                    columns={[
                      {
                        field: 'drug_name',
                        label: 'Drug Name',
                        width: '200px',
                        minWidth: '150px',
                        sortable: true,
                        resizable: true
                      },
                      {
                        field: 'strength',
                        label: 'Strength',
                        width: '120px',
                        minWidth: '100px',
                        sortable: true
                      },
                      {
                        field: 'quantity',
                        label: 'Quantity',
                        width: '100px',
                        minWidth: '80px',
                        sortable: true,
                        type: 'number'
                      },
                      {
                        field: 'unit_cost',
                        label: 'Unit Cost',
                        width: '120px',
                        minWidth: '100px',
                        sortable: true,
                        type: 'currency'
                      },
                      {
                        field: 'status',
                        label: 'Status',
                        width: '100px',
                        minWidth: '80px',
                        sortable: true
                      }
                    ]}
                    showAutofillToggle={true}  // Enable the toggle button
                    defaultAutofill={true}     // Start in autofill mode
                    exportable={true}
                    searchable={true}
                    paginated={true}
                    pageSize={10}
                    striped={true}
                    hover={true}
                    resizable={true}
                    className="border rounded"
                  />
                  
                  <Row className="mt-3">
                    <Col md={6}>
                      <Alert variant="primary">
                        <strong>🔧 Implementation:</strong>
                        <pre className="mt-2 mb-0 small" style={{ fontSize: '11px' }}>
{`<PharmaDataGrid
  showAutofillToggle={true}
  defaultAutofill={true}
  columns={[
    {
      field: 'name',
      minWidth: '120px',
      maxWidth: '1fr'  // For autofill
    }
  ]}
/>`}
                        </pre>
                      </Alert>
                    </Col>
                    <Col md={6}>
                      <Alert variant="info">
                        <strong>💡 Pro Tips:</strong>
                        <ul className="mb-0 small">
                          <li>Set <code>minWidth</code> to prevent columns from becoming too narrow</li>
                          <li>Use <code>maxWidth: '1fr'</code> for flexible sizing in autofill mode</li>
                          <li>Combine with <code>exportable={true}</code> for full functionality</li>
                        </ul>
                      </Alert>
                    </Col>
                  </Row>
                </div>
              )
            }
          ]
        }
      ]
    },
    badges: {
      title: 'Pharmacy Badges',
      icon: 'fas fa-tags',
      components: [
        {
          name: 'Basic Pharmacy Badges',
          description: 'Pharmacy-themed badges with pill, capsule, and tablet styling',
          examples: [
            {
              title: 'Pharmacy Theme Types',
              component: (
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <PharmaBadge pharmaType="pill" variant="success">Active</PharmaBadge>
                  <PharmaBadge pharmaType="capsule" variant="primary">Prescription</PharmaBadge>
                  <PharmaBadge pharmaType="tablet" variant="secondary">Generic</PharmaBadge>
                  <PharmaBadge pharmaType="default" variant="info">Standard</PharmaBadge>
                </div>
              )
            },
            {
              title: 'Status Badges',
              component: (
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <StatusBadge status="active">Active Drug</StatusBadge>
                  <StatusBadge status="expired">Expired</StatusBadge>
                  <StatusBadge status="low-stock">Low Stock</StatusBadge>
                  <StatusBadge status="out-of-stock">Out of Stock</StatusBadge>
                  <StatusBadge status="recalled">Recalled</StatusBadge>
                </div>
              )
            },
            {
              title: 'Specialized Pharmacy Badges',
              component: (
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <DrugStatusBadge active={true} />
                  <DrugStatusBadge active={false} />
                  <StockStatusBadge quantity={25} reorderLevel={10} />
                  <StockStatusBadge quantity={5} reorderLevel={10} />
                  <StockStatusBadge quantity={0} reorderLevel={10} />
                  <ExpirationBadge expirationDate="2025-12-31" />
                  <ExpirationBadge expirationDate="2025-09-15" warningDays={30} />
                </div>
              )
            }
          ]
        }
      ]
    },
    spinners: {
      title: 'Pharmacy Spinners',
      icon: 'fas fa-spinner',
      components: [
        {
          name: 'Pharmacy Loading Spinners',
          description: 'Custom loading spinners with pharmacy themes',
          examples: [
            {
              title: 'Basic Pharmacy Spinners',
              component: (
                <div className="d-flex justify-content-around align-items-center" style={{ minHeight: '120px' }}>
                  <div className="text-center">
                    <PillSpinner size="lg" />
                    <p className="mt-2 small">Pill Spinner</p>
                  </div>
                  <div className="text-center">
                    <CapsuleSpinner size="lg" />
                    <p className="mt-2 small">Capsule Spinner</p>
                  </div>
                  <div className="text-center">
                    <TabletSpinner size="lg" />
                    <p className="mt-2 small">Tablet Spinner</p>
                  </div>
                  <div className="text-center">
                    <PrescriptionSpinner size="lg" />
                    <p className="mt-2 small">Prescription Spinner</p>
                  </div>
                </div>
              )
            },
            {
              title: 'Sizes and Labels',
              component: (
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-around align-items-center">
                    <PillSpinner size="sm" showLabel={true}>Small</PillSpinner>
                    <CapsuleSpinner size="md" showLabel={true}>Medium</CapsuleSpinner>
                    <TabletSpinner size="lg" showLabel={true}>Large</TabletSpinner>
                    <PrescriptionSpinner size="xl" showLabel={true}>Extra Large</PrescriptionSpinner>
                  </div>
                </div>
              )
            },
            {
              title: 'Context-Specific Spinners',
              component: (
                <div className="d-flex flex-wrap gap-3 justify-content-center">
                  <div className="text-center p-3 border rounded">
                    <PharmaSpinner animation="pill" showLabel={true}>Loading inventory...</PharmaSpinner>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <PharmaSpinner animation="prescription" showLabel={true}>Processing prescription...</PharmaSpinner>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <PharmaSpinner animation="capsule" showLabel={true}>Searching drugs...</PharmaSpinner>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    navigation: {
      title: 'Navigation',
      icon: 'fas fa-compass',
      components: [
        {
          name: 'Pharmacy Navigation Bars',
          description: 'Navigation bars with pharmacy theming and specialized features',
          examples: [
            {
              title: 'Basic Pharmacy Navbar',
              component: (
                <div style={{ position: 'relative', height: '100px', overflow: 'hidden', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                  <PharmaNavbar
                    brand="PharmaTraK"
                    pharmaTheme="capsule"
                    user={{ name: "Dr. Smith", email: "smith@example.com" }}
                    userRole="pharmacist"
                    navItems={[
                      { title: 'Dashboard', icon: 'fas fa-tachometer-alt', href: '#dashboard' },
                      { title: 'Inventory', icon: 'fas fa-boxes', href: '#inventory' },
                      { title: 'Prescriptions', icon: 'fas fa-prescription', href: '#prescriptions' }
                    ]}
                    notifications={[
                      { title: 'Low Stock Alert', message: 'Aspirin 325mg running low', time: '5 min ago' }
                    ]}
                    unreadCount={3}
                    searchable={true}
                    style={{ position: 'relative' }}
                  />
                </div>
              )
            }
          ]
        },
        {
          name: 'Pagination Controls',
          description: 'Pharmacy-themed pagination with advanced features',
          examples: [
            {
              title: 'Inventory Pagination',
              component: (
                <InventoryPagination
                  currentPage={3}
                  totalPages={15}
                  totalItems={750}
                  itemsPerPage={50}
                  onPageChange={(page) => console.log('Page changed to:', page)}
                  onItemsPerPageChange={(items) => console.log('Items per page:', items)}
                />
              )
            },
            {
              title: 'Prescription Pagination',
              component: (
                <PrescriptionPagination
                  currentPage={1}
                  totalPages={8}
                  totalItems={150}
                  itemsPerPage={20}
                  pharmaTheme="capsule"
                />
              )
            }
          ]
        }
      ]
    },
    layout: {
      title: 'Layout & Containers',
      icon: 'fas fa-th-large',
      components: [
        {
          name: 'Accordion Components',
          description: 'Expandable content sections with pharmacy theming',
          examples: [
            {
              title: 'Drug Information Accordion',
              component: (
                <DrugInfoAccordion
                  drug={{
                    ndc: '12345-678-90',
                    generic_name: 'Amoxicillin',
                    brand_name: 'Augmentin',
                    strength: '500mg',
                    dosage_form: 'Capsule',
                    manufacturer_name: 'GSK',
                    route: 'Oral',
                    dea_schedule: null,
                    product_type: 'HUMAN PRESCRIPTION DRUG',
                    warnings: 'May cause allergic reactions in patients sensitive to penicillin.',
                    contraindications: 'History of penicillin allergy'
                  }}
                />
              )
            },
            {
              title: 'Basic Pharmacy Accordion',
              component: (
                <PharmaAccordion
                  items={[
                    {
                      title: 'Patient Safety',
                      icon: 'fas fa-shield-alt',
                      badge: { text: 'Critical', variant: 'danger' },
                      content: 'Patient safety protocols and medication verification procedures.'
                    },
                    {
                      title: 'Inventory Management',
                      icon: 'fas fa-boxes',
                      badge: { text: 'Active', variant: 'success' },
                      content: 'Stock levels, reorder points, and expiration date monitoring.'
                    },
                    {
                      title: 'Prescription Processing',
                      icon: 'fas fa-prescription',
                      status: 'active',
                      content: 'Workflow for prescription intake, verification, and dispensing.'
                    }
                  ]}
                  pharmaTheme="tablet"
                  defaultActiveKey="0"
                />
              )
            }
          ]
        },
        {
          name: 'Offcanvas Panels',
          description: 'Side panels for detailed information and actions',
          examples: [
            {
              title: 'Offcanvas Demo Controls',
              component: (
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      // In a real app, you'd set state to show the offcanvas
                      console.log('Show prescription details offcanvas');
                    }}
                  >
                    <i className="fas fa-prescription me-2"></i>
                    Show Prescription Details
                  </Button>
                  <Button 
                    variant="info" 
                    onClick={() => {
                      console.log('Show drug info offcanvas');
                    }}
                  >
                    <i className="fas fa-info-circle me-2"></i>
                    Show Drug Information
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      console.log('Show quick actions');
                    }}
                  >
                    <i className="fas fa-bolt me-2"></i>
                    Quick Actions
                  </Button>
                </div>
              )
            }
          ]
        }
      ]
    },
    feedback: {
      title: 'Feedback & Notifications',
      icon: 'fas fa-bell',
      components: [
        {
          name: 'Toast Notifications',
          description: 'Pharmacy-themed notifications for user feedback',
          examples: [
            {
              title: 'Toast Examples',
              component: (
                <div className="d-flex flex-column gap-2">
                  <Alert variant="info">
                    <strong>Note:</strong> These buttons demonstrate toast types. In a real application, 
                    toasts would appear automatically based on user actions.
                  </Alert>
                  <div className="d-flex flex-wrap gap-2">
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => console.log('Show success toast')}
                    >
                      <i className="fas fa-check me-1"></i>
                      Success Toast
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => console.log('Show error toast')}
                    >
                      <i className="fas fa-exclamation-circle me-1"></i>
                      Error Toast
                    </Button>
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={() => console.log('Show warning toast')}
                    >
                      <i className="fas fa-exclamation-triangle me-1"></i>
                      Warning Toast
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => console.log('Show prescription alert')}
                    >
                      <i className="fas fa-prescription me-1"></i>
                      Prescription Alert
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => console.log('Show inventory alert')}
                    >
                      <i className="fas fa-boxes me-1"></i>
                      Inventory Alert
                    </Button>
                  </div>
                  
                  {/* Static toast examples */}
                  <div className="mt-3">
                    <h6>Static Toast Examples:</h6>
                    <div style={{ position: 'relative', minHeight: '200px' }}>
                      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
                        <PharmaToast
                          title="Prescription Filled"
                          message="Amoxicillin 500mg for John Doe has been successfully filled."
                          variant="success"
                          pharmaType="capsule"
                          icon="fas fa-check-circle"
                          show={true}
                          autohide={false}
                          data={{ drugName: 'Amoxicillin 500mg', patientName: 'John Doe' }}
                          timestamp={new Date()}
                        />
                      </div>
                      <div style={{ position: 'absolute', top: '100px', right: '10px', zIndex: 999 }}>
                        <PharmaToast
                          title="Low Stock Warning"
                          message="Aspirin 325mg is running low (5 units remaining)."
                          variant="warning"
                          pharmaType="tablet"
                          icon="fas fa-exclamation-triangle"
                          show={true}
                          autohide={false}
                          data={{ drugName: 'Aspirin 325mg', quantity: 5 }}
                          timestamp={new Date()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    scanning: {
      title: 'Barcode & Scanning',
      icon: 'fas fa-barcode',
      components: [
        {
          name: 'PharmaBarcodeScanner',
          description: 'Advanced barcode scanning with camera and manual entry for pharmacy operations',
          examples: [
            {
              title: 'NDC Code Scanner',
              component: (
                <div className="mb-4">
                  <Alert variant="info" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-pills me-2"></i>
                      NDC Code Scanning Demo
                    </h6>
                    <p className="mb-0 small">
                      This scanner validates NDC (National Drug Code) format and provides real-time feedback.
                      Try entering: <code>12345-678-90</code> in the manual input.
                    </p>
                  </Alert>
                  
                  <PharmaBarcodeScanner
                    scanTypes={['ndc']}
                    defaultScanType="ndc"
                    camera={true}
                    manualEntry={true}
                    validateFormat={true}
                    showHistory={true}
                    maxHistory={5}
                    onScanSuccess={(value, type, source) => {
                      console.log(`✅ NDC Scan Success: ${value} (${type}, ${source})`);
                    }}
                    onScanError={(error, value, type) => {
                      console.log(`❌ NDC Scan Error: ${error}`);
                    }}
                  />
                </div>
              )
            },
            {
              title: 'Multi-Type Scanner',
              component: (
                <div className="mb-4">
                  <Alert variant="success" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-barcode me-2"></i>
                      Multi-Format Scanner Demo
                    </h6>
                    <p className="mb-0 small">
                      Supports multiple barcode types commonly used in pharmacy operations.
                      Switch between NDC, Lot Numbers, Patient IDs, and Prescription Numbers.
                    </p>
                  </Alert>
                  
                  <PharmaBarcodeScanner
                    scanTypes={['ndc', 'lot', 'patient_id', 'rx_number']}
                    defaultScanType="ndc"
                    camera={true}
                    manualEntry={true}
                    validateFormat={true}
                    strictValidation={false}
                    showHistory={true}
                    maxHistory={10}
                    pharmaTheme="capsule"
                    variant="success"
                    onScanSuccess={(value, type, source) => {
                      console.log(`✅ Multi-Scan Success: ${value} (${type}, ${source})`);
                    }}
                    onScanError={(error, value, type) => {
                      console.log(`❌ Multi-Scan Error: ${error}`);
                    }}
                    onScanTypeChange={(newType) => {
                      console.log(`🔄 Scan type changed to: ${newType}`);
                    }}
                  />
                </div>
              )
            },
            {
              title: 'Scanner Features Demo',
              component: (
                <Row>
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-camera me-2"></i>
                          Camera Features
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <ul className="list-unstyled mb-0">
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Live Camera Scanning:</strong> Real-time barcode detection
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Camera Selection:</strong> Front/back camera support
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Auto-Focus:</strong> Automatic focusing on barcodes
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Visual Feedback:</strong> Scanning overlay and indicators
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-secondary text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-keyboard me-2"></i>
                          Manual Entry Features
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <ul className="list-unstyled mb-0">
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Format Validation:</strong> Real-time barcode validation
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Auto-Formatting:</strong> NDC codes formatted automatically
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Type-Specific Input:</strong> Customized for each barcode type
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <strong>Scan History:</strong> Recent scans with timestamps
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]
        }
      ]
    },
    audit: {
      title: 'Audit & Compliance',
      icon: 'fas fa-clipboard-list',
      components: [
        {
          name: 'PharmaAuditTrail',
          description: 'Comprehensive audit trail for regulatory compliance and activity tracking',
          examples: [
            {
              title: 'Prescription Audit Trail',
              component: (
                <div className="mb-4">
                  <Alert variant="info" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-prescription me-2"></i>
                      Prescription Activity Tracking
                    </h6>
                    <p className="mb-0 small">
                      Timeline view of all prescription-related activities with user tracking,
                      action categorization, and detailed audit information for regulatory compliance.
                    </p>
                  </Alert>
                  
                  <PharmaAuditTrail
                    entity="prescription"
                    entityId="RX123456"
                    showTimeline={true}
                    showUsers={true}
                    showActions={true}
                    showDetails={true}
                    showExport={true}
                    itemsPerPage={5}
                    pharmaTheme="capsule"
                    variant="primary"
                    onAuditClick={(audit) => console.log('Audit clicked:', audit)}
                    onUserClick={(user) => console.log('User clicked:', user)}
                    onExport={(data) => console.log('Export requested:', data)}
                  />
                </div>
              )
            },
            {
              title: 'Inventory Audit Trail',
              component: (
                <div className="mb-4">
                  <Alert variant="success" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-boxes me-2"></i>
                      Inventory Activity Tracking
                    </h6>
                    <p className="mb-0 small">
                      Track all inventory adjustments, cycle counts, and stock movements
                      with detailed user attribution and change history.
                    </p>
                  </Alert>
                  
                  <PharmaAuditTrail
                    entity="inventory"
                    entityId="INV-AMX-001"
                    showTimeline={true}
                    showUsers={true}
                    showActions={true}
                    showDetails={true}
                    itemsPerPage={5}
                    pharmaTheme="tablet"
                    variant="success"
                    filterByAction="adjust"
                    onAuditClick={(audit) => console.log('Inventory audit clicked:', audit)}
                  />
                </div>
              )
            },
            {
              title: 'Audit Features Demo',
              component: (
                <Row>
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-warning text-dark">
                        <h6 className="mb-0">
                          <i className="fas fa-filter me-2"></i>
                          Filtering & Search
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <ul className="list-unstyled mb-0">
                          <li className="mb-2">
                            <i className="fas fa-search text-primary me-2"></i>
                            <strong>Full-Text Search:</strong> Search across all audit fields
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-user text-info me-2"></i>
                            <strong>User Filtering:</strong> Filter by specific users
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-calendar text-success me-2"></i>
                            <strong>Date Range:</strong> Custom date range selection
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-tags text-warning me-2"></i>
                            <strong>Action Types:</strong> Filter by action categories
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-info text-white">
                        <h6 className="mb-0">
                          <i className="fas fa-download me-2"></i>
                          Export & Compliance
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <ul className="list-unstyled mb-0">
                          <li className="mb-2">
                            <i className="fas fa-file-csv text-success me-2"></i>
                            <strong>CSV Export:</strong> Spreadsheet-compatible format
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-file-pdf text-danger me-2"></i>
                            <strong>PDF Reports:</strong> Formatted audit reports
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-shield-alt text-primary me-2"></i>
                            <strong>Compliance Ready:</strong> Meets regulatory requirements
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-clock text-secondary me-2"></i>
                            <strong>Real-Time:</strong> Live updates and notifications
                          </li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              title: 'System-Wide Audit View',
              component: (
                <div className="mb-4">
                  <Alert variant="warning" className="mb-3">
                    <h6 className="mb-2">
                      <i className="fas fa-server me-2"></i>
                      System-Wide Activity Monitoring
                    </h6>
                    <p className="mb-0 small">
                      Comprehensive view of all system activities across different entities.
                      Useful for administrators monitoring overall system usage and security.
                    </p>
                  </Alert>
                  
                  <PharmaAuditTrail
                    entity="system"
                    showTimeline={false}
                    showUsers={true}
                    showActions={true}
                    showDetails={true}
                    showExport={true}
                    itemsPerPage={8}
                    pharmaTheme="pill"
                    variant="warning"
                    realTimeUpdates={true}
                    autoRefresh={true}
                    refreshInterval={30000}
                    onAuditClick={(audit) => console.log('System audit clicked:', audit)}
                  />
                </div>
              )
            }
          ]
        }
      ]
    }
  };

  const renderComponent = (component) => (
    <Card className="mb-4 component-card">
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{component.name}</h5>
          <Badge bg="secondary">Component</Badge>
        </div>
        <small className="text-muted">{component.description}</small>
      </Card.Header>
      <Card.Body>
        {component.examples.map((example, index) => (
          <div key={index} className="example-section">
            <h6 className="text-primary">{example.title}</h6>
            <div className="example-preview p-3 border rounded bg-light mb-3">
              {example.component}
            </div>
          </div>
        ))}
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid className="component-gallery py-4">
      <Row>
        <Col md={3}>
          <div className="gallery-sidebar">
            <div className="gallery-header mb-4">
              <h2><i className="fas fa-palette me-2"></i>Component Gallery</h2>
              <Badge bg="warning">Development Only</Badge>
            </div>
            
            <Nav variant="pills" className="flex-column">
              {Object.entries(categories).map(([key, category]) => (
                <Nav.Item key={key}>
                  <Nav.Link 
                    active={activeCategory === key}
                    onClick={() => setActiveCategory(key)}
                    className="d-flex align-items-center"
                  >
                    <i className={`${category.icon} me-2`}></i>
                    {category.title}
                    <Badge bg="light" text="dark" className="ms-auto">
                      {category.components.length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            <div className="mt-4 p-3 bg-light rounded">
              <h6><i className="fas fa-info-circle me-2"></i>About</h6>
              <p className="small mb-0">
                This gallery showcases React Bootstrap components with pharmacy-specific examples. 
                Use this page to test components during development.
              </p>
            </div>
          </div>
        </Col>
        
        <Col md={9}>
          <div className="gallery-content">
            <div className="category-header mb-4">
              <h3>
                <i className={`${categories[activeCategory].icon} me-2`}></i>
                {categories[activeCategory].title}
              </h3>
              <p className="text-muted">
                Interactive examples of {categories[activeCategory].title.toLowerCase()} components
              </p>
            </div>

            {categories[activeCategory].components.map((component, index) => (
              <div key={index}>
                {renderComponent(component)}
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ComponentGallerySimple;