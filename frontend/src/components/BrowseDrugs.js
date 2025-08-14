import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { inventoryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DataTable from './common/DataTable';
import SearchFilterBar from './common/SearchFilterBar';
import CardHeader from './common/CardHeader';
import '../css/components.css';

const BrowseDrugs = () => {
  const { user } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDrugs, setFilteredDrugs] = useState([]);

  // Column definitions for DataTable
  const columns = [
    {
      key: 'generic_name',
      label: 'Drug Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <strong>{row.generic_name}</strong>
          {row.brand_name && row.brand_name !== row.generic_name && (
            <div className="text-muted small">({row.brand_name})</div>
          )}
        </div>
      )
    },
    {
      key: 'ndc',
      label: 'NDC',
      sortable: true,
      className: 'font-monospace small'
    },
    {
      key: 'strength',
      label: 'Strength',
      render: (value) => value || 'N/A',
      className: 'small'
    },
    {
      key: 'dosage_form',
      label: 'Dosage Form',
      render: (value) => value || 'N/A',
      className: 'small'
    },
    {
      key: 'route',
      label: 'Route',
      render: (value) => value || 'N/A',
      className: 'small'
    },
    {
      key: 'manufacturer_name',
      label: 'Manufacturer',
      render: (value) => value || 'N/A',
      className: 'small'
    },
    {
      key: 'quantity_on_hand',
      label: 'Quantity',
      render: (value) => (
        <div className="text-center">
          <Badge bg={value > 0 ? 'success' : 'warning'}>
            {value || 0}
          </Badge>
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <Badge bg={value ? 'success' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'date_created',
      label: 'Added',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
      className: 'small text-muted'
    }
  ];

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

      <SearchFilterBar
        searchPlaceholder="Search by name, NDC, or manufacturer..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        additionalActions={
          <Badge bg="secondary" className="fs-6">
            {filteredDrugs.length} of {drugs.length} drugs
          </Badge>
        }
      />

      {/* Drugs Table */}
      <Card>
        <CardHeader
          title="Drugs Database"
          badgeText={`${filteredDrugs.length} drugs`}
        />
        <Card.Body className="p-0">
          <DataTable
            columns={columns}
            data={filteredDrugs}
            striped
            hover
            emptyMessage={
              searchTerm 
                ? "No drugs match your search criteria" 
                : "No drugs in your store inventory yet"
            }
            loading={loading}
            loadingContent="Loading drugs database..."
            responsive
          />
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