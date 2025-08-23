/**
 * PharmaSearch - Advanced Search Component with Autocomplete
 * 
 * A sophisticated search component designed for pharmacy data searching
 * with intelligent autocomplete, fuzzy matching, and pharmacy-specific
 * search patterns (NDC, drug names, manufacturers, etc.).
 * 
 * Features:
 * - Real-time autocomplete with debouncing
 * - Fuzzy search matching
 * - Pharmacy-specific search types
 * - Search history and favorites
 * - Recent searches and suggestions
 * - Keyboard navigation and accessibility
 * - Integration with external APIs
 * - Advanced filtering and scoping
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Form, InputGroup, Dropdown, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { PharmaButton, PharmaCard, PharmaAlert } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaSearch = ({
  // Core search props
  value = '',
  onChange = null,
  onSearch = null,
  onSelect = null,
  
  // Search configuration
  searchType = 'general', // 'drug', 'ndc', 'manufacturer', 'prescription', 'general'
  placeholder = 'Search...',
  debounceMs = 300,
  minSearchLength = 2,
  maxResults = 10,
  
  // Data sources
  dataSource = null, // Function or array
  searchEndpoint = null, // API endpoint for remote search
  
  // Autocomplete features
  showAutocomplete = true,
  showRecentSearches = true,
  showSuggestions = true,
  showCategories = true,
  
  // Search enhancements
  fuzzySearch = true,
  searchHistory = true,
  searchFavorites = false,
  
  // Visual options
  size = 'md',
  variant = 'outline-secondary',
  icon = '🔍',
  clearable = true,
  loading = false,
  
  // Advanced features
  filters = [], // Additional filter options
  scopes = [], // Search scope options (e.g., 'current store', 'all stores')
  
  // Styling
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  
  // Events
  onFocus = null,
  onBlur = null,
  onClear = null,
  onHistorySelect = null,
  
  // Accessibility
  'aria-label': ariaLabel = 'Search input',
  'aria-describedby': ariaDescribedBy,
  
  ...otherProps
}) => {
  
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeScope, setActiveScope] = useState(scopes[0]?.value || 'all');
  const [activeFilters, setActiveFilters] = useState({});
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);
  
  // Load search history and favorites
  useEffect(() => {
    if (searchHistory) {
      const stored = localStorage.getItem(`pharma-search-history-${searchType}`);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    }
    
    if (searchFavorites) {
      const stored = localStorage.getItem(`pharma-search-favorites-${searchType}`);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    }
  }, [searchType, searchHistory, searchFavorites]);
  
  // Get search suggestions based on search type
  const getSearchSuggestions = useMemo(() => {
    const suggestions = {
      drug: [
        'Acetaminophen', 'Ibuprofen', 'Lisinopril', 'Metformin', 'Amlodipine',
        'Atorvastatin', 'Levothyroxine', 'Omeprazole', 'Simvastatin', 'Losartan'
      ],
      ndc: [
        '0003-0090', '0003-0091', '0078-0367', '0078-0368', '0093-0094',
        '50090-1234', '50090-1235', '68382-001', '68382-002', '68382-003'
      ],
      manufacturer: [
        'Pfizer', 'Novartis', 'Merck', 'Abbott', 'Bristol Myers Squibb',
        'Teva', 'Mylan', 'Sandoz', 'Aurobindo', 'Dr. Reddy\'s'
      ],
      prescription: [
        'Recent prescriptions', 'By patient name', 'By prescriber', 
        'By date range', 'By insurance', 'By status'
      ],
      general: [
        'Search all drugs', 'Search by NDC', 'Search by manufacturer',
        'Search prescriptions', 'Search patients', 'Search inventory'
      ]
    };
    
    return suggestions[searchType] || suggestions.general;
  }, [searchType]);
  
  // Fuzzy search function
  const fuzzyMatch = useCallback((needle, haystack) => {
    if (!fuzzySearch) {
      return haystack.toLowerCase().includes(needle.toLowerCase());
    }
    
    const needleLower = needle.toLowerCase();
    const haystackLower = haystack.toLowerCase();
    
    let needleIndex = 0;
    for (let i = 0; i < haystackLower.length; i++) {
      if (needleIndex < needleLower.length && 
          haystackLower[i] === needleLower[needleIndex]) {
        needleIndex++;
      }
    }
    
    return needleIndex === needleLower.length;
  }, [fuzzySearch]);
  
  // Search function with debouncing
  const performSearch = useCallback(async (term) => {
    if (!term || term.length < minSearchLength) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      let searchResults = [];
      
      // Remote search via API
      if (searchEndpoint) {
        const response = await fetch(`${searchEndpoint}?q=${encodeURIComponent(term)}&type=${searchType}&scope=${activeScope}`, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
            ...Object.entries(activeFilters).reduce((acc, [key, value]) => {
              acc[`filter-${key}`] = value;
              return acc;
            }, {})
          }
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        searchResults = data.results || [];
      }
      // Local search with data source
      else if (dataSource) {
        const data = typeof dataSource === 'function' ? await dataSource(term) : dataSource;
        
        searchResults = data.filter(item => {
          const searchFields = getSearchFields(item);
          return searchFields.some(field => fuzzyMatch(term, field));
        }).slice(0, maxResults);
      }
      // Default suggestions
      else {
        searchResults = getSearchSuggestions
          .filter(suggestion => fuzzyMatch(term, suggestion))
          .map(suggestion => ({ id: suggestion, title: suggestion, type: 'suggestion' }))
          .slice(0, maxResults);
      }
      
      setResults(searchResults);
      setSelectedIndex(-1);
      setIsOpen(true);
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchEndpoint, dataSource, searchType, activeScope, activeFilters, minSearchLength, maxResults, fuzzySearch, getSearchSuggestions]);
  
  // Get searchable fields from item based on search type
  const getSearchFields = useCallback((item) => {
    const fields = [];
    
    switch (searchType) {
      case 'drug':
        fields.push(item.generic_name, item.brand_name, item.ndc);
        break;
      case 'ndc':
        fields.push(item.ndc);
        break;
      case 'manufacturer':
        fields.push(item.manufacturer_name, item.labeler_name);
        break;
      case 'prescription':
        fields.push(item.prescription_number, item.patient_name, item.prescriber_name);
        break;
      default:
        Object.values(item).forEach(value => {
          if (typeof value === 'string') fields.push(value);
        });
    }
    
    return fields.filter(Boolean);
  }, [searchType]);
  
  // Debounced search
  const debouncedSearch = useCallback((term) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(term);
    }, debounceMs);
  }, [performSearch, debounceMs]);
  
  // Handle input change
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
    
    if (newValue.length >= minSearchLength) {
      debouncedSearch(newValue);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [onChange, minSearchLength, debouncedSearch]);
  
  // Handle input focus
  const handleFocus = useCallback((e) => {
    if (showRecentSearches && recentSearches.length > 0 && !searchTerm) {
      setResults(recentSearches.map(term => ({ 
        id: term, 
        title: term, 
        type: 'recent' 
      })));
      setIsOpen(true);
    } else if (showSuggestions && !searchTerm) {
      setResults(getSearchSuggestions.slice(0, 5).map(suggestion => ({
        id: suggestion,
        title: suggestion,
        type: 'suggestion'
      })));
      setIsOpen(true);
    }
    
    if (onFocus) {
      onFocus(e);
    }
  }, [showRecentSearches, showSuggestions, recentSearches, searchTerm, getSearchSuggestions, onFocus]);
  
  // Handle result selection
  const handleResultSelect = useCallback((result, index = -1) => {
    setSearchTerm(result.title);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    // Add to search history
    if (searchHistory && result.type !== 'recent') {
      const newHistory = [result.title, ...recentSearches.filter(term => term !== result.title)].slice(0, 10);
      setRecentSearches(newHistory);
      localStorage.setItem(`pharma-search-history-${searchType}`, JSON.stringify(newHistory));
    }
    
    if (onSelect) {
      onSelect(result, index);
    }
    
    if (onSearch) {
      onSearch(result.title, result);
    }
  }, [searchHistory, recentSearches, searchType, onSelect, onSearch]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || results.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleResultSelect(results[selectedIndex], selectedIndex);
        } else if (searchTerm) {
          setIsOpen(false);
          if (onSearch) {
            onSearch(searchTerm);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  }, [isOpen, results, selectedIndex, searchTerm, handleResultSelect, onSearch]);
  
  // Handle clear
  const handleClear = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (onChange) {
      onChange('');
    }
    
    if (onClear) {
      onClear();
    }
    
    inputRef.current?.focus();
  }, [onChange, onClear]);
  
  // Render result item
  const renderResultItem = useCallback((result, index) => {
    const isSelected = index === selectedIndex;
    
    return (
      <ListGroup.Item
        key={result.id}
        action
        active={isSelected}
        onClick={() => handleResultSelect(result, index)}
        className={`pharma-search-result ${isSelected ? 'selected' : ''}`}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="pharma-search-result-content">
            <div className="pharma-search-result-title">
              {result.icon && <span className="me-2">{result.icon}</span>}
              {highlightMatch(result.title, searchTerm)}
            </div>
            {result.subtitle && (
              <div className="pharma-search-result-subtitle text-muted small">
                {result.subtitle}
              </div>
            )}
            {result.category && showCategories && (
              <Badge bg="secondary" className="me-1 pharma-search-category">
                {result.category}
              </Badge>
            )}
          </div>
          
          <div className="pharma-search-result-meta">
            {result.type === 'recent' && (
              <Badge bg="info" style={{ fontSize: '0.6rem' }}>Recent</Badge>
            )}
            {result.type === 'favorite' && (
              <Badge bg="warning" style={{ fontSize: '0.6rem' }}>★</Badge>
            )}
            {result.ndc && (
              <div className="text-muted small font-monospace">
                {result.ndc}
              </div>
            )}
          </div>
        </div>
      </ListGroup.Item>
    );
  }, [selectedIndex, searchTerm, handleResultSelect, showCategories]);
  
  // Highlight matching text
  const highlightMatch = (text, search) => {
    if (!search || !fuzzySearch) return text;
    
    const index = text.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <mark className="pharma-search-highlight">
          {text.substring(index, index + search.length)}
        </mark>
        {text.substring(index + search.length)}
      </>
    );
  };
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const inputClasses = [
    'pharma-search-input',
    inputClassName
  ].filter(Boolean).join(' ');
  
  const containerClasses = [
    'pharma-search',
    `pharma-search-${size}`,
    `pharma-search-${searchType}`,
    isOpen && 'pharma-search-open',
    loading && 'pharma-search-loading',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses} ref={dropdownRef}>
      <InputGroup size={size}>
        {/* Search scope selector */}
        {scopes.length > 0 && (
          <Dropdown>
            <Dropdown.Toggle variant={variant} size={size} className="pharma-search-scope">
              {scopes.find(s => s.value === activeScope)?.label || 'All'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {scopes.map(scope => (
                <Dropdown.Item
                  key={scope.value}
                  active={scope.value === activeScope}
                  onClick={() => setActiveScope(scope.value)}
                >
                  {scope.icon && <span className="me-2">{scope.icon}</span>}
                  {scope.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        )}
        
        {/* Search icon */}
        <InputGroup.Text className="pharma-search-icon">
          {isLoading || loading ? (
            <Spinner size="sm" />
          ) : (
            <span>{icon}</span>
          )}
        </InputGroup.Text>
        
        {/* Main search input */}
        <Form.Control
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          className={inputClasses}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
          {...otherProps}
        />
        
        {/* Clear button */}
        {clearable && searchTerm && (
          <PharmaButton
            variant="outline-secondary"
            size={size}
            onClick={handleClear}
            className="pharma-search-clear"
            aria-label="Clear search"
          >
            ×
          </PharmaButton>
        )}
        
        {/* Search button */}
        <PharmaButton
          variant="primary"
          size={size}
          onClick={() => onSearch && onSearch(searchTerm)}
          disabled={!searchTerm || loading}
          className="pharma-search-submit"
        >
          Search
        </PharmaButton>
      </InputGroup>
      
      {/* Error display */}
      {error && (
        <div className="pharma-search-error mt-1">
          <small className="text-danger">{error}</small>
        </div>
      )}
      
      {/* Results dropdown */}
      {isOpen && (
        <div className={`pharma-search-dropdown ${dropdownClassName}`}>
          <PharmaCard className="pharma-search-results-card">
            {results.length > 0 ? (
              <ListGroup variant="flush">
                {results.map((result, index) => renderResultItem(result, index))}
              </ListGroup>
            ) : searchTerm && !isLoading ? (
              <div className="pharma-search-no-results text-center py-3 text-muted">
                <div>No results found for "{searchTerm}"</div>
                {showSuggestions && (
                  <div className="mt-2 small">
                    Try: {getSearchSuggestions.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>
            ) : null}
          </PharmaCard>
        </div>
      )}
    </div>
  );
};

// Pre-configured search variants
export const DrugSearch = (props) => (
  <PharmaSearch
    searchType="drug"
    placeholder="Search drugs by name, NDC, or manufacturer..."
    icon="💊"
    {...props}
  />
);

export const NDCSearch = (props) => (
  <PharmaSearch
    searchType="ndc"
    placeholder="Enter NDC number (XXXXX-XXXX-XX)..."
    icon="🔢"
    {...props}
  />
);

export const ManufacturerSearch = (props) => (
  <PharmaSearch
    searchType="manufacturer"
    placeholder="Search manufacturers..."
    icon="🏭"
    {...props}
  />
);

export const PrescriptionSearch = (props) => (
  <PharmaSearch
    searchType="prescription"
    placeholder="Search prescriptions..."
    icon="📋"
    {...props}
  />
);

export const PatientSearch = (props) => (
  <PharmaSearch
    searchType="patient"
    placeholder="Search patients..."
    icon="👤"
    {...props}
  />
);

export default PharmaSearch;