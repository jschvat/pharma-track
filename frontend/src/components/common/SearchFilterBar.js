import React from 'react';
import { Card, Row, Col, InputGroup, Form } from 'react-bootstrap';

/**
 * SearchFilterBar Component
 * 
 * A reusable search and filter bar component that combines search input
 * with multiple filter dropdowns in a consistent layout.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.searchPlaceholder='Search...'] - Placeholder text for search input
 * @param {string} props.searchValue - Current search value
 * @param {function} props.onSearchChange - Search input change handler
 * @param {Array} [props.filters=[]] - Array of filter configurations
 * @param {string} props.filters[].label - Filter label
 * @param {string} props.filters[].value - Current filter value
 * @param {function} props.filters[].onChange - Filter change handler
 * @param {Array} props.filters[].options - Filter options array
 * @param {string} props.filters[].options[].value - Option value
 * @param {string} props.filters[].options[].label - Option label
 * @param {boolean} [props.filters[].options[].disabled] - Whether option is disabled
 * @param {string} [props.filters[].placeholder] - Filter placeholder text
 * @param {boolean} [props.filters[].disabled=false] - Whether filter is disabled
 * @param {string} [props.searchIcon='fas fa-search'] - Search icon class
 * @param {React.ReactNode} [props.additionalActions] - Additional action buttons/components
 * @param {boolean} [props.showCard=true] - Whether to wrap in Card component
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.searchProps] - Additional props for search input
 * @param {string} [props.size] - Input size ('sm' or 'lg')
 */
const SearchFilterBar = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
  searchIcon = 'fas fa-search',
  additionalActions,
  showCard = true,
  className = 'mb-4',
  searchProps = {},
  size,
  ...otherProps
}) => {
  const handleSearchChange = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const handleFilterChange = (filter, value) => {
    if (filter.onChange) {
      filter.onChange(value);
    }
  };

  const renderSearchInput = () => (
    <InputGroup size={size}>
      <InputGroup.Text>
        <i className={searchIcon}></i>
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder={searchPlaceholder}
        value={searchValue || ''}
        onChange={handleSearchChange}
        {...searchProps}
      />
    </InputGroup>
  );

  const renderFilter = (filter, index) => {
    const {
      label,
      value,
      onChange,
      options = [],
      placeholder,
      disabled = false,
      ...filterProps
    } = filter;

    return (
      <div key={`filter-${index}`}>
        {label && (
          <Form.Label className="mb-1 small text-muted">
            {label}
          </Form.Label>
        )}
        <Form.Select
          value={value || ''}
          onChange={(e) => handleFilterChange(filter, e.target.value)}
          disabled={disabled}
          size={size}
          {...filterProps}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option, optIndex) => (
            <option
              key={option.value || optIndex}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </Form.Select>
      </div>
    );
  };

  const renderContent = () => (
    <Row className="align-items-end">
      <Col md={4} className="mb-3">
        {renderSearchInput()}
      </Col>
      
      {filters.map((filter, index) => (
        <Col 
          key={`filter-col-${index}`}
          md={filters.length > 2 ? 2 : 3} 
          className="mb-3"
        >
          {renderFilter(filter, index)}
        </Col>
      ))}
      
      {additionalActions && (
        <Col className="mb-3 text-end">
          {additionalActions}
        </Col>
      )}
    </Row>
  );

  if (showCard) {
    return (
      <Card className={className} {...otherProps}>
        <Card.Body>
          {renderContent()}
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className={className} {...otherProps}>
      {renderContent()}
    </div>
  );
};

export default SearchFilterBar;