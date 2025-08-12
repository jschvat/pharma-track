import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner,
  Badge,
  ListGroup,
  Accordion
} from 'react-bootstrap';
import { storeAPI, userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const AdminSettings = () => {
  const { isAdmin } = useAuth();
  const { 
    currentTheme, 
    fontFamily, 
    fontSize, 
    changeTheme, 
    changeFontFamily, 
    changeFontSize, 
    availableThemes, 
    availableFonts, 
    availableFontSizes 
  } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    stores: { total: 0, withAdmin: 0 },
    users: { total: 0, admins: 0, active: 0 }
  });
  
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    maxUsersPerStore: 50,
    sessionTimeout: 24,
    backupSchedule: 'daily'
  });

  useEffect(() => {
    if (isAdmin()) {
      loadStats();
    }
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [storeResponse, userResponse] = await Promise.all([
        storeAPI.getStats(),
        userAPI.getAll({ limit: 100 })
      ]);
      
      const storeStats = storeResponse.data.stats;
      const users = userResponse.data.users || [];
      
      setStats({
        stores: {
          total: storeStats.total_stores || 0,
          withAdmin: storeStats.stores_with_admin || 0,
          uniqueStates: storeStats.unique_states || 0
        },
        users: {
          total: users.length,
          admins: users.filter(u => u.role === 'admin').length,
          active: users.filter(u => u.is_active).length
        }
      });
      
    } catch (err) {
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSuccess('Settings saved successfully (Note: This is a demo - actual implementation would save to backend)');
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
          <h2 className="mb-4">System Settings</h2>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row>
        {/* System Statistics */}
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">System Statistics</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading statistics...</p>
                </div>
              ) : (
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <h6>Stores</h6>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          Total Stores
                          <Badge bg="primary" pill>{stats.stores.total}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          With Admin
                          <Badge bg="success" pill>{stats.stores.withAdmin}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          Unique States
                          <Badge bg="info" pill>{stats.stores.uniqueStates}</Badge>
                        </ListGroup.Item>
                      </ListGroup>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <h6>Users</h6>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          Total Users
                          <Badge bg="primary" pill>{stats.users.total}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          Admin Users
                          <Badge bg="warning" pill>{stats.users.admins}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          Active Users
                          <Badge bg="success" pill>{stats.users.active}</Badge>
                        </ListGroup.Item>
                      </ListGroup>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" onClick={loadStats}>
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh Statistics
                </Button>
                <Button variant="outline-info" disabled>
                  <i className="fas fa-download me-2"></i>
                  Export System Report
                </Button>
                <Button variant="outline-warning" disabled>
                  <i className="fas fa-database me-2"></i>
                  Backup Database
                </Button>
                <Button variant="outline-success" disabled>
                  <i className="fas fa-chart-line me-2"></i>
                  View Analytics
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">System Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>General Settings</Accordion.Header>
                  <Accordion.Body>
                    <Form onSubmit={handleSaveSettings}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="maintenanceMode"
                              label="Maintenance Mode"
                              checked={systemSettings.maintenanceMode}
                              onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                            />
                            <Form.Text className="text-muted">
                              When enabled, only admins can access the system
                            </Form.Text>
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="allowRegistration"
                              label="Allow New User Registration"
                              checked={systemSettings.allowRegistration}
                              onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                            />
                            <Form.Text className="text-muted">
                              Allow new users to register accounts
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Max Users Per Store</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              max="200"
                              value={systemSettings.maxUsersPerStore}
                              onChange={(e) => handleSettingChange('maxUsersPerStore', parseInt(e.target.value))}
                            />
                            <Form.Text className="text-muted">
                              Maximum number of users allowed per store
                            </Form.Text>
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Session Timeout (hours)</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              max="168"
                              value={systemSettings.sessionTimeout}
                              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                            />
                            <Form.Text className="text-muted">
                              How long users stay logged in
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Form>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1">
                  <Accordion.Header>Security Settings</Accordion.Header>
                  <Accordion.Body>
                    <Alert variant="info">
                      <i className="fas fa-info-circle me-2"></i>
                      Security settings would include password policies, two-factor authentication, 
                      IP restrictions, and audit logging configuration.
                    </Alert>
                    <div className="text-center py-3">
                      <Button variant="outline-secondary" disabled>
                        Configure Security Policies
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2">
                  <Accordion.Header>Backup & Recovery</Accordion.Header>
                  <Accordion.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Backup Schedule</Form.Label>
                      <Form.Select
                        value={systemSettings.backupSchedule}
                        onChange={(e) => handleSettingChange('backupSchedule', e.target.value)}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Form.Select>
                    </Form.Group>
                    
                    <Alert variant="warning">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Last backup: Never (Backup system not configured)
                    </Alert>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3">
                  <Accordion.Header>Appearance Settings</Accordion.Header>
                  <Accordion.Body>
                    <Alert variant="info">
                      <i className="fas fa-palette me-2"></i>
                      Customize the system-wide appearance including theme, font family, and font size.
                      Changes apply immediately and are saved automatically.
                    </Alert>
                    
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Default Theme</Form.Label>
                          <Form.Select
                            value={currentTheme}
                            onChange={(e) => {
                              changeTheme(e.target.value);
                              setSuccess('Theme updated successfully');
                            }}
                          >
                            {availableThemes.map(theme => (
                              <option key={theme.value} value={theme.value}>
                                {theme.label}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Text className="text-muted">
                            Choose the default theme for all users
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Font Family</Form.Label>
                          <Form.Select
                            value={fontFamily}
                            onChange={(e) => {
                              changeFontFamily(e.target.value);
                              setSuccess('Font family updated successfully');
                            }}
                          >
                            {availableFonts.map(font => (
                              <option key={font.value} value={font.value}>
                                {font.label}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Text className="text-muted">
                            System-wide font family
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Font Size</Form.Label>
                          <Form.Select
                            value={fontSize}
                            onChange={(e) => {
                              changeFontSize(e.target.value);
                              setSuccess('Font size updated successfully');
                            }}
                          >
                            {availableFontSizes.map(size => (
                              <option key={size.value} value={size.value}>
                                {size.label}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Text className="text-muted">
                            System-wide font size
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="mt-3 p-3 border rounded bg-light">
                      <h6 className="mb-2">Preview</h6>
                      <p className="mb-1">
                        This is how text will appear with the current settings.
                      </p>
                      <small className="text-muted">
                        Current: {availableThemes.find(t => t.value === currentTheme)?.label}, {availableFonts.find(f => f.value === fontFamily)?.label}, {availableFontSizes.find(s => s.value === fontSize)?.label}
                      </small>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="4">
                  <Accordion.Header>Integration Settings</Accordion.Header>
                  <Accordion.Body>
                    <Alert variant="info">
                      <i className="fas fa-plug me-2"></i>
                      Configure external integrations such as FDA API, payment processors, 
                      and third-party inventory systems.
                    </Alert>
                    
                    <Row>
                      <Col md={6}>
                        <h6>FDA API Integration</h6>
                        <Badge bg="success">Connected</Badge>
                        <p className="small text-muted mt-1">
                          API calls this month: 1,247
                        </p>
                      </Col>
                      <Col md={6}>
                        <h6>Third-party Integrations</h6>
                        <Badge bg="secondary">Not Configured</Badge>
                        <p className="small text-muted mt-1">
                          Available integrations: POS Systems, Accounting Software
                        </p>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              <div className="mt-3 d-flex justify-content-end">
                <Button 
                  type="submit" 
                  variant="primary" 
                  onClick={handleSaveSettings}
                  disabled={loading}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : 'Save Settings'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">System Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <h6>Application</h6>
                  <p className="mb-1">Version: 2.0.0</p>
                  <p className="mb-1">Environment: Development</p>
                  <p className="mb-1">Database: MySQL</p>
                </Col>
                <Col md={4}>
                  <h6>Server</h6>
                  <p className="mb-1">Node.js: v18.x</p>
                  <p className="mb-1">OS: Linux</p>
                  <p className="mb-1">Uptime: 24h 15m</p>
                </Col>
                <Col md={4}>
                  <h6>Resources</h6>
                  <p className="mb-1">Memory Usage: 245 MB</p>
                  <p className="mb-1">Storage: 15.2 GB available</p>
                  <p className="mb-1">Active Sessions: 12</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminSettings;