/**
 * PharmaFileUpload - Advanced File Upload Component
 * 
 * A comprehensive file upload component designed for pharmacy document
 * management with drag-and-drop, file validation, progress tracking,
 * and pharmacy-specific file type handling.
 * 
 * Features:
 * - Drag-and-drop interface
 * - Multiple file upload
 * - File type validation
 * - File size validation
 * - Upload progress tracking
 * - Preview generation
 * - Pharmacy document types
 * - Accessibility support
 * - Error handling and recovery
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Form, Alert, ProgressBar, Card, ListGroup, Badge, Image } from 'react-bootstrap';
import { PharmaButton, PharmaCard, PharmaAlert, PharmaProgressBar } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaFileUpload = ({
  // Core upload props
  onUpload = null,
  onFileSelect = null,
  onFileRemove = null,
  onError = null,
  
  // File constraints
  accept = '*/*',
  multiple = true,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = null, // Array of allowed MIME types
  
  // Upload configuration
  uploadEndpoint = null,
  uploadMethod = 'POST',
  uploadHeaders = {},
  uploadData = {},
  
  // Pharmacy-specific types
  documentType = 'general', // 'prescription', 'invoice', 'report', 'image', 'general'
  requireMetadata = false,
  
  // UI options
  variant = 'default', // 'default', 'compact', 'minimal'
  showPreviews = true,
  showProgress = true,
  showFileList = true,
  dragAndDrop = true,
  
  // Validation options
  validateOnSelect = true,
  showValidationErrors = true,
  
  // Initial files
  initialFiles = [],
  
  // Styling
  className = '',
  dropZoneClassName = '',
  height = '200px',
  
  // States
  disabled = false,
  loading = false,
  
  // Events
  onDragEnter = null,
  onDragLeave = null,
  onDrop = null,
  
  // Accessibility
  'aria-label': ariaLabel = 'File upload area',
  
  ...otherProps
}) => {
  
  const [files, setFiles] = useState(initialFiles);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const uploadAbortControllers = useRef(new Map());
  
  // File type configurations for pharmacy documents
  const documentTypeConfigs = {
    prescription: {
      accept: '.pdf,.jpg,.jpeg,.png,.tiff',
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      icon: '💊',
      description: 'Prescription documents (PDF, images)'
    },
    invoice: {
      accept: '.pdf,.csv,.xlsx,.xls',
      allowedTypes: ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      icon: '🧾',
      description: 'Invoice documents (PDF, Excel, CSV)'
    },
    report: {
      accept: '.pdf,.docx,.doc,.txt',
      allowedTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      maxFileSize: 20 * 1024 * 1024, // 20MB
      icon: '📊',
      description: 'Report documents (PDF, Word, Text)'
    },
    image: {
      accept: '.jpg,.jpeg,.png,.gif,.webp',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxFileSize: 2 * 1024 * 1024, // 2MB
      icon: '🖼️',
      description: 'Images (JPEG, PNG, GIF, WebP)'
    },
    general: {
      accept: '*/*',
      allowedTypes: null,
      maxFileSize: maxFileSize,
      icon: '📄',
      description: 'All file types'
    }
  };
  
  const config = documentTypeConfigs[documentType] || documentTypeConfigs.general;
  const effectiveAccept = accept !== '*/*' ? accept : config.accept;
  const effectiveAllowedTypes = allowedTypes || config.allowedTypes;
  const effectiveMaxFileSize = Math.min(maxFileSize, config.maxFileSize);
  
  // Validate file
  const validateFile = useCallback((file) => {
    const errors = [];
    
    // File size validation
    if (file.size > effectiveMaxFileSize) {
      errors.push(`File size exceeds limit (${formatFileSize(effectiveMaxFileSize)})`);
    }
    
    // File type validation
    if (effectiveAllowedTypes && !effectiveAllowedTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${effectiveAllowedTypes.join(', ')}`);
    }
    
    // File name validation
    if (file.name.length > 255) {
      errors.push('File name too long (max 255 characters)');
    }
    
    // Pharmacy-specific validations
    if (documentType === 'prescription') {
      // Additional prescription document validation
      if (!file.name.match(/\.(pdf|jpe?g|png|tiff?)$/i)) {
        errors.push('Prescription documents must be PDF or image files');
      }
    }
    
    return errors;
  }, [effectiveMaxFileSize, effectiveAllowedTypes, documentType]);
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Generate file preview
  const generatePreview = useCallback((file) => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    });
  }, []);
  
  // Add files to state
  const addFiles = useCallback(async (newFiles) => {
    const validFiles = [];
    const fileErrors = [];
    
    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      fileErrors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    for (const file of newFiles) {
      const validationErrors = validateOnSelect ? validateFile(file) : [];
      
      if (validationErrors.length === 0) {
        const fileData = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: null,
          status: 'pending', // 'pending', 'uploading', 'success', 'error'
          progress: 0,
          error: null
        };
        
        // Generate preview if needed
        if (showPreviews) {
          fileData.preview = await generatePreview(file);
        }
        
        validFiles.push(fileData);
      } else {
        fileErrors.push(`${file.name}: ${validationErrors.join(', ')}`);
      }
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      if (onFileSelect) {
        onFileSelect(validFiles);
      }
    }
    
    if (fileErrors.length > 0) {
      setErrors(prev => [...prev, ...fileErrors]);
      
      if (onError) {
        onError(fileErrors);
      }
    }
  }, [files.length, maxFiles, validateOnSelect, validateFile, showPreviews, generatePreview, onFileSelect, onError]);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [addFiles]);
  
  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
    
    if (onDragEnter) {
      onDragEnter(e);
    }
  }, [onDragEnter]);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragOver to false if leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setDragOver(false);
      
      if (onDragLeave) {
        onDragLeave(e);
      }
    }
  }, [onDragLeave]);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (disabled || loading) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
    
    if (onDrop) {
      onDrop(e, droppedFiles);
    }
  }, [disabled, loading, addFiles, onDrop]);
  
  // Remove file
  const handleFileRemove = useCallback((fileId) => {
    // Cancel upload if in progress
    const controller = uploadAbortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
      uploadAbortControllers.current.delete(fileId);
    }
    
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    
    if (onFileRemove) {
      const removedFile = files.find(f => f.id === fileId);
      if (removedFile) {
        onFileRemove(removedFile);
      }
    }
  }, [files, onFileRemove]);
  
  // Upload single file
  const uploadFile = useCallback(async (fileData) => {
    if (!uploadEndpoint) {
      throw new Error('Upload endpoint not configured');
    }
    
    const formData = new FormData();
    formData.append('file', fileData.file);
    
    // Add metadata
    formData.append('documentType', documentType);
    formData.append('fileName', fileData.name);
    formData.append('fileSize', fileData.size.toString());
    
    // Add custom upload data
    Object.entries(uploadData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Create abort controller
    const controller = new AbortController();
    uploadAbortControllers.current.set(fileData.id, controller);
    
    try {
      const response = await fetch(uploadEndpoint, {
        method: uploadMethod,
        headers: {
          ...uploadHeaders
        },
        body: formData,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
      
    } finally {
      uploadAbortControllers.current.delete(fileData.id);
    }
  }, [uploadEndpoint, uploadMethod, uploadHeaders, uploadData, documentType]);
  
  // Upload all files
  const handleUploadAll = useCallback(async () => {
    const filesToUpload = files.filter(f => f.status === 'pending');
    
    if (filesToUpload.length === 0) return;
    
    setUploading(true);
    
    try {
      const results = await Promise.allSettled(
        filesToUpload.map(async (fileData) => {
          // Update file status
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, status: 'uploading' } : f
          ));
          
          try {
            const result = await uploadFile(fileData);
            
            // Update file status to success
            setFiles(prev => prev.map(f => 
              f.id === fileData.id ? { ...f, status: 'success' } : f
            ));
            
            return { fileId: fileData.id, success: true, result };
            
          } catch (error) {
            // Update file status to error
            setFiles(prev => prev.map(f => 
              f.id === fileData.id ? { ...f, status: 'error', error: error.message } : f
            ));
            
            return { fileId: fileData.id, success: false, error: error.message };
          }
        })
      );
      
      setUploadResults(results.map(r => r.value));
      
      if (onUpload) {
        onUpload(results.map(r => r.value));
      }
      
    } finally {
      setUploading(false);
    }
  }, [files, uploadFile, onUpload]);
  
  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // Clear all files
  const clearAllFiles = useCallback(() => {
    // Cancel all ongoing uploads
    uploadAbortControllers.current.forEach(controller => controller.abort());
    uploadAbortControllers.current.clear();
    
    setFiles([]);
    setUploadProgress({});
    setUploadResults([]);
    setErrors([]);
  }, []);
  
  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      uploadAbortControllers.current.forEach(controller => controller.abort());
    };
  }, []);
  
  // Render file list item
  const renderFileItem = (fileData) => {
    const { id, name, size, type, preview, status, progress, error } = fileData;
    
    return (
      <ListGroup.Item key={id} className="pharma-file-item d-flex align-items-center">
        {/* File preview/icon */}
        <div className="pharma-file-preview me-3">
          {preview ? (
            <Image src={preview} rounded className="pharma-file-preview-image" />
          ) : (
            <div className="pharma-file-icon">
              {config.icon}
            </div>
          )}
        </div>
        
        {/* File info */}
        <div className="flex-grow-1">
          <div className="pharma-file-name fw-bold">{name}</div>
          <div className="pharma-file-meta text-muted small">
            {formatFileSize(size)} • {type}
          </div>
          
          {/* Upload progress */}
          {status === 'uploading' && showProgress && (
            <PharmaProgressBar
              value={progress}
              size="sm"
              showPercentage={true}
              className="mt-2"
            />
          )}
          
          {/* Error message */}
          {status === 'error' && error && (
            <div className="text-danger small mt-1">
              Error: {error}
            </div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="pharma-file-status me-2">
          <Badge bg={
            status === 'pending' ? 'secondary' :
            status === 'uploading' ? 'primary' :
            status === 'success' ? 'success' : 'danger'
          }>
            {status === 'pending' ? 'Ready' :
             status === 'uploading' ? 'Uploading...' :
             status === 'success' ? 'Uploaded' : 'Failed'}
          </Badge>
        </div>
        
        {/* Remove button */}
        <PharmaButton
          variant="outline-danger"
          size="sm"
          onClick={() => handleFileRemove(id)}
          disabled={status === 'uploading'}
        >
          ×
        </PharmaButton>
      </ListGroup.Item>
    );
  };
  
  const dropZoneClasses = [
    'pharma-file-upload',
    `pharma-file-upload-${variant}`,
    `pharma-file-upload-${documentType}`,
    dragAndDrop && 'pharma-file-upload-draggable',
    dragOver && 'pharma-file-upload-drag-over',
    disabled && 'pharma-file-upload-disabled',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={dropZoneClasses}>
      {/* Hidden file input */}
      <Form.Control
        ref={fileInputRef}
        type="file"
        accept={effectiveAccept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="d-none"
        disabled={disabled}
        aria-label={ariaLabel}
        {...otherProps}
      />
      
      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        className={`pharma-file-drop-zone ${dropZoneClassName}`}
        style={{ minHeight: height }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        aria-label={`${ariaLabel} - Click to select files or drag and drop`}
      >
        <div className="pharma-file-drop-zone-content text-center">
          <div className="pharma-file-drop-icon mb-3">
            {config.icon}
          </div>
          
          <div className="pharma-file-drop-text">
            <h5 className="mb-2">
              {dragAndDrop ? 'Drop files here or click to upload' : 'Click to select files'}
            </h5>
            <p className="text-muted mb-2">
              {config.description}
            </p>
            <p className="text-muted small">
              Max {maxFiles} files • Up to {formatFileSize(effectiveMaxFileSize)} each
            </p>
          </div>
          
          <PharmaButton
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
            disabled={disabled || loading}
          >
            Select Files
          </PharmaButton>
        </div>
      </div>
      
      {/* Error messages */}
      {errors.length > 0 && showValidationErrors && (
        <PharmaAlert
          variant="danger"
          className="mt-3"
          dismissible
          onClose={clearErrors}
        >
          <strong>Upload Errors:</strong>
          <ul className="mb-0 mt-2">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </PharmaAlert>
      )}
      
      {/* File list */}
      {showFileList && files.length > 0 && (
        <PharmaCard className="mt-3" title={`Selected Files (${files.length})`}>
          <ListGroup variant="flush">
            {files.map(renderFileItem)}
          </ListGroup>
          
          {/* Upload controls */}
          <div className="pharma-file-upload-controls mt-3 d-flex justify-content-between">
            <div>
              <PharmaButton
                variant="outline-secondary"
                size="sm"
                onClick={clearAllFiles}
                disabled={uploading}
              >
                Clear All
              </PharmaButton>
            </div>
            
            <div>
              {uploadEndpoint && (
                <PharmaButton
                  variant="success"
                  onClick={handleUploadAll}
                  loading={uploading}
                  disabled={files.filter(f => f.status === 'pending').length === 0}
                >
                  Upload All ({files.filter(f => f.status === 'pending').length})
                </PharmaButton>
              )}
            </div>
          </div>
        </PharmaCard>
      )}
    </div>
  );
};

// Pre-configured upload variants
export const PrescriptionUpload = (props) => (
  <PharmaFileUpload
    documentType="prescription"
    maxFiles={5}
    accept=".pdf,.jpg,.jpeg,.png,.tiff"
    {...props}
  />
);

export const InvoiceUpload = (props) => (
  <PharmaFileUpload
    documentType="invoice"
    maxFiles={10}
    accept=".pdf,.csv,.xlsx,.xls"
    {...props}
  />
);

export const ReportUpload = (props) => (
  <PharmaFileUpload
    documentType="report"
    maxFiles={3}
    accept=".pdf,.docx,.doc,.txt"
    {...props}
  />
);

export const ImageUpload = (props) => (
  <PharmaFileUpload
    documentType="image"
    maxFiles={20}
    accept=".jpg,.jpeg,.png,.gif,.webp"
    showPreviews={true}
    {...props}
  />
);

export default PharmaFileUpload;