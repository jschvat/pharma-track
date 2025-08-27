/**
 * Product Labeling Modal Component
 * 
 * Displays comprehensive FDA product labeling information in a modal format.
 * Features intelligent loading, structured clinical data display, and responsive design.
 * 
 * Features:
 * - Automatic FDA labeling data fetching by NDC
 * - Structured clinical information display
 * - Loading states and error handling
 * - Responsive modal design
 * - Cache status indication
 * - Print-friendly formatting
 * 
 * @component ProductLabelingModal
 * @param {string} ndc - National Drug Code to fetch labeling for
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler function
 * 
 * @author PharmaTraK Development Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Card, Badge } from 'react-bootstrap';

const ProductLabelingModal = ({ ndc, isOpen, onClose }) => {
  const [labelingData, setLabelingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch labeling data when modal opens
  useEffect(() => {
    if (isOpen && ndc) {
      fetchLabelingData();
    }
  }, [isOpen, ndc]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLabelingData(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchLabelingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `/api/drugs/labeling/${encodeURIComponent(ndc)}`;
      
      console.log('🔍 ProductLabelingModal API Call:', {
        ndc: ndc,
        url: apiUrl,
        fullUrl: `${window.location.origin}${apiUrl}`,
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
      });
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('📡 ProductLabelingModal Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          contentType: response.headers.get('content-type')
        }
      });

      if (!response.ok) {
        // Try to get the actual error message from the response body
        let errorMessage = `Failed to fetch labeling data: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.message) {
            // Backend returned a structured error (like "No drugs found matching the search criteria")
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error body, use the default message
        }
        
        if (response.status === 404) {
          throw new Error('No FDA labeling information available for this NDC');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ ProductLabelingModal Success:', {
        hasData: !!data,
        ndc: data?.ndc,
        genericName: data?.product_info?.generic_name,
        fromCache: data?.cache_info?.from_cache
      });
      setLabelingData(data);

    } catch (err) {
      console.error('Error fetching labeling data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return 'Not available';
    
    // Split on common delimiters and create paragraphs
    return text
      .split(/\n+/)
      .filter(paragraph => paragraph.trim())
      .map((paragraph, index) => (
        <p key={index} className="mb-2">
          {paragraph.trim()}
        </p>
      ));
  };

  const formatProductInfo = (productInfo) => {
    if (!productInfo) return null;

    return (
      <div className="row">
        <div className="col-md-6">
          <strong>Generic Name:</strong> {productInfo.generic_name || 'N/A'}<br />
          <strong>Brand Name:</strong> {productInfo.brand_name || 'N/A'}<br />
          <strong>Manufacturer:</strong> {productInfo.manufacturer || 'N/A'}
        </div>
        <div className="col-md-6">
          <strong>Dosage Form:</strong> {productInfo.dosage_form || 'N/A'}<br />
          <strong>Route:</strong> {Array.isArray(productInfo.route) ? productInfo.route.join(', ') : (productInfo.route || 'N/A')}<br />
          <strong>Product Type:</strong> {productInfo.product_type || 'N/A'}
        </div>
      </div>
    );
  };

  const getCacheStatusBadge = (cacheInfo) => {
    if (!cacheInfo) return null;

    return (
      <Badge 
        bg={cacheInfo.from_cache ? 'success' : 'info'} 
        className="ms-2"
        title={cacheInfo.from_cache 
          ? `Cached at: ${new Date(cacheInfo.cached_at).toLocaleString()}`
          : 'Fresh from FDA API'
        }
      >
        {cacheInfo.from_cache ? 'Cached' : 'Fresh'}
      </Badge>
    );
  };

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="xl" 
      scrollable 
      className="product-labeling-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-pills me-2 text-primary"></i>
          FDA Product Labeling Information
          {labelingData?.cache_info && getCacheStatusBadge(labelingData.cache_info)}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">Loading FDA labeling information...</div>
          </div>
        )}

        {error && (
          <Alert variant="warning" className="mb-3">
            <Alert.Heading>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Labeling Information Not Available
            </Alert.Heading>
            <p className="mb-0">{error}</p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button 
                variant="outline-warning" 
                size="sm" 
                onClick={fetchLabelingData}
                disabled={loading}
              >
                <i className="fas fa-redo me-1"></i>
                Try Again
              </Button>
            </div>
          </Alert>
        )}

        {labelingData && (
          <div className="labeling-content">
            {/* Product Information */}
            <Card className="mb-3">
              <Card.Header className="bg-primary text-white">
                <i className="fas fa-info-circle me-2"></i>
                Product Information - NDC: {ndc}
              </Card.Header>
              <Card.Body>
                {formatProductInfo(labelingData.product_info)}
              </Card.Body>
            </Card>

            {/* Indications and Usage */}
            {labelingData.indications_and_usage && (
              <Card className="mb-3">
                <Card.Header className="bg-success text-white">
                  <i className="fas fa-check-circle me-2"></i>
                  Indications and Usage
                </Card.Header>
                <Card.Body>
                  <div className="formatted-text">
                    {formatText(labelingData.indications_and_usage)}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Warnings */}
            {labelingData.warnings && (
              <Card className="mb-3">
                <Card.Header className="bg-warning text-dark">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Warnings and Precautions
                </Card.Header>
                <Card.Body>
                  <div className="formatted-text">
                    {formatText(labelingData.warnings)}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Contraindications */}
            {labelingData.contraindications && (
              <Card className="mb-3">
                <Card.Header className="bg-danger text-white">
                  <i className="fas fa-ban me-2"></i>
                  Contraindications
                </Card.Header>
                <Card.Body>
                  <div className="formatted-text">
                    {formatText(labelingData.contraindications)}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Dosage and Administration */}
            {labelingData.dosage_and_administration && (
              <Card className="mb-3">
                <Card.Header className="bg-info text-white">
                  <i className="fas fa-prescription-bottle-alt me-2"></i>
                  Dosage and Administration
                </Card.Header>
                <Card.Body>
                  <div className="formatted-text">
                    {formatText(labelingData.dosage_and_administration)}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Storage and Handling */}
            {labelingData.storage_and_handling && (
              <Card className="mb-3">
                <Card.Header className="bg-secondary text-white">
                  <i className="fas fa-box me-2"></i>
                  Storage and Handling
                </Card.Header>
                <Card.Body>
                  <div className="formatted-text">
                    {formatText(labelingData.storage_and_handling)}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* FDA Metadata */}
            {labelingData.fda_metadata && (
              <Card className="mb-3">
                <Card.Header className="bg-dark text-white">
                  <i className="fas fa-database me-2"></i>
                  FDA Metadata
                </Card.Header>
                <Card.Body>
                  <div className="row small text-muted">
                    <div className="col-md-6">
                      <strong>Set ID:</strong> {labelingData.fda_metadata.set_id || 'N/A'}<br />
                      <strong>Product ID:</strong> {labelingData.fda_metadata.product_id || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Effective Date:</strong> {labelingData.fda_metadata.effective_time || 'N/A'}<br />
                      <strong>Version:</strong> {labelingData.fda_metadata.version || 'N/A'}
                    </div>
                  </div>
                  {labelingData.cache_info && (
                    <div className="mt-2 pt-2 border-top">
                      <small className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        {labelingData.cache_info.from_cache 
                          ? `Cached: ${new Date(labelingData.cache_info.cached_at).toLocaleString()}`
                          : 'Retrieved fresh from FDA API'
                        }
                        {labelingData.response_time && ` • Response time: ${labelingData.response_time}ms`}
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div className="text-muted small">
            <i className="fas fa-shield-alt me-1"></i>
            Information provided by FDA OpenFDA API
          </div>
          <div>
            {labelingData && (
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-2"
                onClick={() => window.print()}
              >
                <i className="fas fa-print me-1"></i>
                Print
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductLabelingModal;