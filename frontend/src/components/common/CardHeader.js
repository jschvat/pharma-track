import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';

/**
 * CardHeader Component
 * 
 * A reusable card header component with consistent title, subtitle, 
 * and action button layout across the application.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Main title text
 * @param {string} [props.subtitle] - Subtitle/description text
 * @param {Object|React.ReactNode} [props.action] - Action button configuration or custom element
 * @param {string} [props.action.label] - Button label text
 * @param {string} [props.action.icon] - FontAwesome icon class
 * @param {function} [props.action.onClick] - Button click handler
 * @param {string} [props.action.variant='primary'] - Button variant
 * @param {boolean} [props.action.disabled=false] - Whether button is disabled
 * @param {boolean} [props.action.loading=false] - Whether button shows loading state
 * @param {Array} [props.actions] - Array of multiple action buttons
 * @param {React.ReactNode} [props.badge] - Badge component to display
 * @param {string} [props.badgeText] - Text for a simple badge
 * @param {string} [props.badgeVariant='secondary'] - Badge variant
 * @param {React.ReactNode} [props.children] - Additional content in header
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.titleStyle] - Custom styles for title
 * @param {Object} [props.subtitleStyle] - Custom styles for subtitle
 * @param {boolean} [props.centerContent=false] - Whether to center the content
 */
const CardHeader = ({
  title,
  subtitle,
  action,
  actions = [],
  badge,
  badgeText,
  badgeVariant = 'secondary',
  children,
  className = 'd-flex justify-content-between align-items-center',
  titleStyle = {},
  subtitleStyle = {},
  centerContent = false,
  ...otherProps
}) => {
  const renderActionButton = (actionConfig, index = 0) => {
    const {
      label,
      icon,
      onClick,
      variant = 'primary',
      disabled = false,
      loading = false,
      size,
      ...buttonProps
    } = actionConfig;

    return (
      <Button
        key={`action-${index}`}
        variant={variant}
        onClick={onClick}
        disabled={disabled || loading}
        size={size}
        {...buttonProps}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            {typeof loading === 'string' ? loading : 'Loading...'}
          </>
        ) : (
          <>
            {icon && <i className={`${icon} me-2`}></i>}
            {label}
          </>
        )}
      </Button>
    );
  };

  const renderActions = () => {
    // Handle single action prop
    if (action && typeof action === 'object' && !React.isValidElement(action)) {
      return renderActionButton(action);
    }

    // Handle custom action element
    if (React.isValidElement(action)) {
      return action;
    }

    // Handle multiple actions
    if (actions.length > 0) {
      return (
        <div className="d-flex gap-2">
          {actions.map((actionConfig, index) => renderActionButton(actionConfig, index))}
        </div>
      );
    }

    return null;
  };

  const renderBadge = () => {
    if (badge) {
      return badge;
    }

    if (badgeText) {
      return (
        <Badge bg={badgeVariant} className="ms-2">
          {badgeText}
        </Badge>
      );
    }

    return null;
  };

  const headerClassName = centerContent 
    ? 'd-flex justify-content-center align-items-center text-center'
    : className;

  return (
    <Card.Header className={headerClassName} {...otherProps}>
      <div className={centerContent ? 'text-center' : ''}>
        <h4 className="mb-0" style={titleStyle}>
          {title}
          {renderBadge()}
        </h4>
        {subtitle && (
          <small className="text-muted" style={subtitleStyle}>
            {subtitle}
          </small>
        )}
        {children}
      </div>
      
      {!centerContent && renderActions()}
    </Card.Header>
  );
};

export default CardHeader;