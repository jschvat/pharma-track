import React from 'react';

/**
 * ActionButtonGroup Component
 * 
 * A reusable component for displaying action buttons (Edit, Delete, etc.) 
 * with consistent styling and behavior across the application.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.actions - Array of action button configurations
 * @param {string} props.actions[].label - Button label text
 * @param {string} props.actions[].icon - FontAwesome icon class
 * @param {function} props.actions[].onClick - Click handler function
 * @param {string} [props.actions[].variant='primary'] - Button variant (edit, delete, password, etc.)
 * @param {boolean} [props.actions[].disabled=false] - Whether button is disabled
 * @param {string} [props.actions[].title] - Button title/tooltip text
 * @param {boolean} [props.actions[].loading=false] - Whether button shows loading state
 * @param {Object} [props.actions[].style] - Additional button styles
 * @param {string} [props.className='d-flex gap-2 flex-wrap'] - Container CSS classes
 * @param {string} [props.size='sm'] - Button size
 */
const ActionButtonGroup = ({
  actions = [],
  className = 'd-flex gap-2 flex-wrap',
  size = 'sm',
  ...otherProps
}) => {
  const getButtonClass = (variant) => {
    const baseClasses = 'btn';
    
    switch (variant) {
      case 'edit':
        return 'btn-gradient-edit';
      case 'delete':
        return 'btn-gradient-delete';
      case 'password':
        return 'btn-gradient-password';
      case 'view':
        return 'btn-gradient-view';
      case 'primary':
        return 'btn btn-primary';
      case 'secondary':
        return 'btn btn-secondary';
      case 'success':
        return 'btn btn-success';
      case 'warning':
        return 'btn btn-warning';
      case 'danger':
        return 'btn btn-danger';
      case 'info':
        return 'btn btn-info';
      case 'light':
        return 'btn btn-light';
      case 'dark':
        return 'btn btn-dark';
      default:
        return 'btn btn-outline-secondary';
    }
  };

  const renderButton = (action, index) => {
    const {
      label,
      icon,
      onClick,
      variant = 'primary',
      disabled = false,
      title,
      loading = false,
      style = {},
      ...actionProps
    } = action;

    const buttonClass = getButtonClass(variant);
    const buttonTitle = title || label;
    
    return (
      <button
        key={`${label}-${index}`}
        type="button"
        className={buttonClass}
        onClick={onClick}
        disabled={disabled || loading}
        title={buttonTitle}
        style={style}
        {...actionProps}
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin me-1"></i>
            {label}
          </>
        ) : (
          <>
            {icon && <i className={`${icon} me-1`}></i>}
            {label}
          </>
        )}
      </button>
    );
  };

  if (!actions.length) {
    return null;
  }

  return (
    <div className={className} {...otherProps}>
      {actions.map(renderButton)}
    </div>
  );
};

export default ActionButtonGroup;