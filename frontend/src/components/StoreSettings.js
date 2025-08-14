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
  Accordion,
  Modal,
  Table
} from 'react-bootstrap';
import { storeSettingsAPI } from '../services/storeSettingsAPI';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import FormField from './common/FormField';
import FormModal from './common/FormModal';
import CardHeader from './common/CardHeader';
import ActionButtonGroup from './common/ActionButtonGroup';
import DataTable from './common/DataTable';
import '../css/components.css';

const StoreSettings = () => {
  const { user, isStoreAdmin } = useAuth();
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
  const [settings, setSettings] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedSetting, setSelectedSetting] = useState(null);
  
  // Local state for setting values
  const [settingValues, setSettingValues] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user?.active_store_id && isStoreAdmin(user.active_store_id)) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const response = await storeSettingsAPI.getAll(user.active_store_id);
      const settingsData = response.data.settings || [];
      
      setSettings(settingsData);
      
      // Initialize local state with current values
      const values = {};
      settingsData.forEach(setting => {
        values[setting.setting_key] = setting.setting_value;
      });
      setSettingValues(values);
      
    } catch (err) {
      setError('Failed to load store settings');
      console.error('Load settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingKey, value, dataType) => {
    let processedValue = value;
    
    // Convert value based on data type
    if (dataType === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (dataType === 'boolean') {
      processedValue = value === 'true' || value === true;
    }
    
    setSettingValues(prev => ({
      ...prev,
      [settingKey]: processedValue
    }));
    
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Prepare bulk update data
      const settingsToUpdate = [];
      
      settings.forEach(setting => {
        const currentValue = settingValues[setting.setting_key];
        if (currentValue !== setting.setting_value) {
          settingsToUpdate.push({
            setting_key: setting.setting_key,
            setting_value: currentValue
          });
        }
      });
      
      if (settingsToUpdate.length === 0) {
        setSuccess('No changes to save');
        return;
      }
      
      await storeSettingsAPI.bulkUpdate(user.active_store_id, settingsToUpdate);
      
      setSuccess(`Successfully updated ${settingsToUpdate.length} settings`);
      setHasChanges(false);
      
      // Reload settings to get updated data
      await loadSettings();
      
    } catch (err) {
      setError('Failed to save settings');
      console.error('Save settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setLoading(true);
      
      await storeSettingsAPI.initialize(user.active_store_id);
      setSuccess('Default settings initialized successfully');
      
      await loadSettings();
      
    } catch (err) {
      setError('Failed to initialize default settings');
      console.error('Initialize settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowHistory = async (setting) => {
    try {
      setLoading(true);
      setSelectedSetting(setting);
      
      const response = await storeSettingsAPI.getHistory(
        user.active_store_id, 
        setting ? setting.setting_key : 'all'
      );
      
      setHistory(response.data.history || []);
      setShowHistory(true);
      
    } catch (err) {
      setError('Failed to load setting history');
      console.error('Load history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSettingInput = (setting) => {
    const value = settingValues[setting.setting_key] ?? setting.setting_value;
    
    switch (setting.data_type) {
      case 'boolean':
        return (
          <Form.Check
            type="switch"
            id={`setting-${setting.id}`}
            checked={value === true}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.checked, 'boolean')}
          />
        );
        
      case 'number':
        return (
          <Form.Control
            type="number"
            value={value || 0}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value, 'number')}
          />
        );
        
      case 'string':
        // Special handling for theme/font settings
        if (setting.setting_key === 'default_theme') {
          return (
            <Form.Select
              value={value || 'bootstrap'}
              onChange={(e) => {
                handleSettingChange(setting.setting_key, e.target.value, 'string');
                changeTheme(e.target.value);
              }}
            >
              {availableThemes.map(theme => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </Form.Select>
          );
        } else if (setting.setting_key === 'default_font_family') {
          return (
            <Form.Select
              value={value || 'system'}
              onChange={(e) => {
                handleSettingChange(setting.setting_key, e.target.value, 'string');
                changeFontFamily(e.target.value);
              }}
            >
              {availableFonts.map(font => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </Form.Select>
          );
        } else if (setting.setting_key === 'default_font_size') {
          return (
            <Form.Select
              value={value || 'medium'}
              onChange={(e) => {
                handleSettingChange(setting.setting_key, e.target.value, 'string');
                changeFontSize(e.target.value);
              }}
            >
              {availableFontSizes.map(size => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </Form.Select>
          );
        }
        
        return (
          <Form.Control
            type="text"
            value={value || ''}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value, 'string')}
          />
        );
        
      default:
        return (
          <Form.Control
            type="text"
            value={JSON.stringify(value) || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(setting.setting_key, parsed, setting.data_type);
              } catch (err) {
                handleSettingChange(setting.setting_key, e.target.value, setting.data_type);
              }
            }}
          />
        );
    }
  };

  // Column definitions for history table
  const historyColumns = [
    {
      key: 'changed_at',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
      className: 'small'
    },
    {
      key: 'setting_key',
      label: 'Setting',
      sortable: true,
      className: 'small'
    },
    {
      key: 'changed_by_name',
      label: 'Changed By',
      sortable: true,
      className: 'small'
    },
    {
      key: 'old_value',
      label: 'Old Value',
      render: (value) => <code className="small">{JSON.stringify(value)}</code>,
      className: 'small'
    },
    {
      key: 'new_value',
      label: 'New Value',
      render: (value) => <code className="small">{JSON.stringify(value)}</code>,
      className: 'small'
    },
    {
      key: 'change_reason',
      label: 'Reason',
      render: (value) => value || '-',
      className: 'small'
    }
  ];

  // Auto-clear alerts
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

  if (!user?.active_store_id) {
    return (
      <Container fluid className="p-4">
        <Alert variant="warning">
          Please select a store to access store settings.
        </Alert>
      </Container>
    );
  }

  if (!isStoreAdmin(user.active_store_id)) {
    return (
      <Container fluid className="p-4">
        <Alert variant="danger">
          Access denied. You must be a store admin to access store settings.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <h2 className="mb-4">Store Settings</h2>
          <p className="text-muted">
            Configure settings for <strong>{user.active_store_name || 'your store'}</strong>. 
            These settings will be the default for all users in this store.
          </p>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row>
        <Col>
          <Card>
            <CardHeader
              title="Store Configuration"
              actions={[
                {
                  type: 'custom',
                  icon: 'fas fa-history',
                  label: 'View History',
                  variant: 'outline-secondary',
                  onClick: () => handleShowHistory(null)
                },
                {
                  type: 'custom',
                  icon: 'fas fa-cog',
                  label: 'Initialize Defaults',
                  variant: 'outline-info',
                  disabled: loading,
                  onClick: handleInitializeDefaults
                }
              ]}
            />
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading settings...</p>
                </div>
              ) : settings.length === 0 ? (
                <div className="text-center py-4">
                  <p>No settings configured for this store.</p>
                  <Button variant="primary" onClick={handleInitializeDefaults}>
                    Initialize Default Settings
                  </Button>
                </div>
              ) : (
                <>
                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Appearance Settings</Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          {settings
                            .filter(s => ['default_theme', 'default_font_family', 'default_font_size'].includes(s.setting_key))
                            .map(setting => (
                              <Col md={4} key={setting.id} className="mb-3">
                                <FormField
                                  label={setting.description || setting.setting_key}
                                  name={setting.setting_key}
                                  type={setting.data_type === 'boolean' ? 'switch' : 
                                       setting.data_type === 'number' ? 'number' : 
                                       setting.setting_key === 'default_theme' ? 'select' :
                                       setting.setting_key === 'default_font_family' ? 'select' :
                                       setting.setting_key === 'default_font_size' ? 'select' : 'text'}
                                  value={settingValues[setting.setting_key] ?? setting.setting_value}
                                  onChange={(e) => {
                                    const value = setting.data_type === 'boolean' ? e.target.checked : e.target.value;
                                    handleSettingChange(setting.setting_key, value, setting.data_type);
                                    if (setting.setting_key === 'default_theme') changeTheme(value);
                                    if (setting.setting_key === 'default_font_family') changeFontFamily(value);
                                    if (setting.setting_key === 'default_font_size') changeFontSize(value);
                                  }}
                                  options={setting.setting_key === 'default_theme' ? availableThemes :
                                          setting.setting_key === 'default_font_family' ? availableFonts :
                                          setting.setting_key === 'default_font_size' ? availableFontSizes : []}
                                  helpText={`Type: ${setting.data_type}`}
                                />
                              </Col>
                            ))}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1">
                      <Accordion.Header>Session & Security</Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          {settings
                            .filter(s => ['session_timeout_hours', 'require_prescription_verification'].includes(s.setting_key))
                            .map(setting => (
                              <Col md={6} key={setting.id} className="mb-3">
                                <FormField
                                  label={setting.description || setting.setting_key}
                                  name={setting.setting_key}
                                  type={setting.data_type === 'boolean' ? 'switch' : 
                                       setting.data_type === 'number' ? 'number' : 'text'}
                                  value={settingValues[setting.setting_key] ?? setting.setting_value}
                                  onChange={(e) => {
                                    const value = setting.data_type === 'boolean' ? e.target.checked : e.target.value;
                                    handleSettingChange(setting.setting_key, value, setting.data_type);
                                  }}
                                  helpText={`Type: ${setting.data_type}`}
                                />
                              </Col>
                            ))}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="2">
                      <Accordion.Header>Inventory Settings</Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          {settings
                            .filter(s => ['low_stock_threshold', 'expiration_alert_days'].includes(s.setting_key))
                            .map(setting => (
                              <Col md={6} key={setting.id} className="mb-3">
                                <FormField
                                  label={setting.description || setting.setting_key}
                                  name={setting.setting_key}
                                  type={setting.data_type === 'boolean' ? 'switch' : 
                                       setting.data_type === 'number' ? 'number' : 'text'}
                                  value={settingValues[setting.setting_key] ?? setting.setting_value}
                                  onChange={(e) => {
                                    const value = setting.data_type === 'boolean' ? e.target.checked : e.target.value;
                                    handleSettingChange(setting.setting_key, value, setting.data_type);
                                  }}
                                  helpText={`Type: ${setting.data_type}`}
                                />
                              </Col>
                            ))}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="3">
                      <Accordion.Header>Backup Settings</Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          {settings
                            .filter(s => ['auto_backup_enabled'].includes(s.setting_key))
                            .map(setting => (
                              <Col md={6} key={setting.id} className="mb-3">
                                <FormField
                                  label={setting.description || setting.setting_key}
                                  name={setting.setting_key}
                                  type={setting.data_type === 'boolean' ? 'switch' : 
                                       setting.data_type === 'number' ? 'number' : 'text'}
                                  value={settingValues[setting.setting_key] ?? setting.setting_value}
                                  onChange={(e) => {
                                    const value = setting.data_type === 'boolean' ? e.target.checked : e.target.value;
                                    handleSettingChange(setting.setting_key, value, setting.data_type);
                                  }}
                                  helpText={`Type: ${setting.data_type}`}
                                />
                              </Col>
                            ))}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="4">
                      <Accordion.Header>All Settings</Accordion.Header>
                      <Accordion.Body>
                        <Table responsive striped>
                          <thead>
                            <tr>
                              <th>Setting</th>
                              <th>Description</th>
                              <th>Value</th>
                              <th>Type</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {settings.map(setting => (
                              <tr key={setting.id}>
                                <td>
                                  <strong>{setting.setting_key}</strong>
                                  {setting.is_system && (
                                    <Badge bg="secondary" className="ms-1">System</Badge>
                                  )}
                                </td>
                                <td>{setting.description}</td>
                                <td className="store-settings-table-cell">
                                  {renderSettingInput(setting)}
                                </td>
                                <td>
                                  <Badge bg="info">{setting.data_type}</Badge>
                                </td>
                                <td>
                                  <ActionButtonGroup
                                    actions={[{
                                      type: 'custom',
                                      icon: 'fas fa-history',
                                      variant: 'outline-secondary',
                                      onClick: () => handleShowHistory(setting)
                                    }]}
                                    size="sm"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  <div className="mt-3 d-flex justify-content-end">
                    <Button 
                      variant="primary" 
                      onClick={handleSaveSettings}
                      disabled={loading || !hasChanges}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : 'Save Settings'}
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* History Modal */}
      <Modal show={showHistory} onHide={() => setShowHistory(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Setting History {selectedSetting && `- ${selectedSetting.setting_key}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DataTable
            columns={historyColumns}
            data={history}
            striped
            hover
            responsive
            size="sm"
            emptyMessage="No history available."
            sorting
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistory(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StoreSettings;