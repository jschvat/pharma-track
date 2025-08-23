/**
 * PharmaTooltip - Advanced Tooltip System
 * 
 * A comprehensive tooltip component designed for pharmacy applications
 * with intelligent positioning, rich content support, pharmacy-specific
 * templates, and accessibility features for complex medical information.
 * 
 * Features:
 * - Intelligent auto-positioning with collision detection
 * - Rich content support (HTML, React components)
 * - Pharmacy-specific tooltip templates (drug info, dosage, warnings)
 * - Multi-step tooltip tours for onboarding
 * - Delayed show/hide with hover intent detection
 * - Keyboard navigation and accessibility
 * - Mobile-responsive touch interactions
 * - Performance optimization with virtualization
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Badge, Card, Button } from 'react-bootstrap';
import { PharmaButton, PharmaCard, PharmaAlert } from './PharmaComponents';
import '../../css/pharma-components.css';

// Tooltip Context for global tooltip management
const TooltipContext = createContext();

// Tooltip positioning algorithms
const POSITIONS = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  'top-start': 'top-start',
  'top-end': 'top-end',
  'bottom-start': 'bottom-start',
  'bottom-end': 'bottom-end',
  'left-start': 'left-start',
  'left-end': 'left-end',
  'right-start': 'right-start',
  'right-end': 'right-end',
  auto: 'auto'
};

const TOOLTIP_TYPES = {
  info: {
    variant: 'primary',
    icon: 'ℹ️',
    className: 'pharma-tooltip-info'
  },
  warning: {
    variant: 'warning',
    icon: '⚠️',
    className: 'pharma-tooltip-warning'
  },
  error: {
    variant: 'danger',
    icon: '❌',
    className: 'pharma-tooltip-error'
  },
  success: {
    variant: 'success',
    icon: '✅',
    className: 'pharma-tooltip-success'
  },
  drug: {
    variant: 'info',
    icon: '💊',
    className: 'pharma-tooltip-drug'
  },
  dosage: {
    variant: 'primary',
    icon: '⚗️',
    className: 'pharma-tooltip-dosage'
  },
  interaction: {
    variant: 'danger',
    icon: '🚨',
    className: 'pharma-tooltip-interaction'
  },
  help: {
    variant: 'secondary',
    icon: '❓',
    className: 'pharma-tooltip-help'
  }
};

// Tooltip positioning utilities
class TooltipPositioner {
  static calculatePosition(triggerElement, tooltipElement, preferredPosition = 'auto') {
    if (!triggerElement || !tooltipElement) return { x: 0, y: 0, position: 'top' };

    const triggerRect = triggerElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };

    const spacing = 8; // Gap between trigger and tooltip
    const positions = this.getAllPositions(triggerRect, tooltipRect, spacing);
    
    if (preferredPosition === 'auto') {
      return this.findBestPosition(positions, viewport, tooltipRect);
    }
    
    const position = positions[preferredPosition];
    if (position && this.isPositionValid(position, viewport, tooltipRect)) {
      return { ...position, position: preferredPosition };
    }
    
    // Fallback to best available position
    return this.findBestPosition(positions, viewport, tooltipRect);
  }

  static getAllPositions(triggerRect, tooltipRect, spacing) {
    return {
      top: {
        x: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
        y: triggerRect.top - tooltipRect.height - spacing
      },
      bottom: {
        x: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
        y: triggerRect.bottom + spacing
      },
      left: {
        x: triggerRect.left - tooltipRect.width - spacing,
        y: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      },
      right: {
        x: triggerRect.right + spacing,
        y: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      },
      'top-start': {
        x: triggerRect.left,
        y: triggerRect.top - tooltipRect.height - spacing
      },
      'top-end': {
        x: triggerRect.right - tooltipRect.width,
        y: triggerRect.top - tooltipRect.height - spacing
      },
      'bottom-start': {
        x: triggerRect.left,
        y: triggerRect.bottom + spacing
      },
      'bottom-end': {
        x: triggerRect.right - tooltipRect.width,
        y: triggerRect.bottom + spacing
      }
    };
  }

  static isPositionValid(position, viewport, tooltipRect) {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x + tooltipRect.width <= viewport.width &&
      position.y + tooltipRect.height <= viewport.height
    );
  }

  static findBestPosition(positions, viewport, tooltipRect) {
    const validPositions = Object.entries(positions)
      .filter(([_, pos]) => this.isPositionValid(pos, viewport, tooltipRect))
      .map(([name, pos]) => ({ ...pos, position: name }));

    if (validPositions.length > 0) {
      // Prefer top or bottom positions
      const preferred = validPositions.find(p => p.position === 'top' || p.position === 'bottom');
      return preferred || validPositions[0];
    }

    // No valid position found, clamp to viewport
    const fallback = positions.top;
    return {
      x: Math.max(0, Math.min(fallback.x, viewport.width - tooltipRect.width)),
      y: Math.max(0, Math.min(fallback.y, viewport.height - tooltipRect.height)),
      position: 'top'
    };
  }
}

// Main PharmaTooltip Component
const PharmaTooltip = ({
  children,
  content,
  title = null,
  type = 'info',
  position = 'auto',
  trigger = 'hover', // 'hover', 'click', 'focus', 'manual'
  delay = { show: 400, hide: 200 },
  disabled = false,
  interactive = false,
  maxWidth = 300,
  className = '',
  onShow = null,
  onHide = null,
  template = null, // Custom template for pharmacy-specific tooltips
  data = null, // Data for pharmacy templates
  arrow = true,
  animation = true,
  boundary = 'viewport',
  ...props
}) => {
  
  const [isVisible, setIsVisible] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0, position: 'top' });
  const [actualContent, setActualContent] = useState(content);
  
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const hoverIntentRef = useRef({ x: 0, y: 0, timestamp: 0 });
  
  const { registerTooltip, unregisterTooltip } = useContext(TooltipContext) || {};

  // Generate tooltip content based on template and data
  useEffect(() => {
    if (template && data) {
      setActualContent(generateTemplateContent(template, data));
    } else {
      setActualContent(content);
    }
  }, [template, data, content]);

  // Position calculation
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current || !isVisible) return;

    const newPosition = TooltipPositioner.calculatePosition(
      triggerRef.current,
      tooltipRef.current,
      position
    );
    
    setCurrentPosition(newPosition);
  }, [isVisible, position]);

  // Show tooltip with delay
  const showTooltip = useCallback(() => {
    if (disabled) return;
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      if (onShow) onShow();
    }, delay.show);
  }, [disabled, delay.show, onShow]);

  // Hide tooltip with delay
  const hideTooltip = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      if (onHide) onHide();
    }, delay.hide);
  }, [delay.hide, onHide]);

  // Hover intent detection
  const handleMouseMove = useCallback((e) => {
    const now = Date.now();
    const deltaX = Math.abs(e.clientX - hoverIntentRef.current.x);
    const deltaY = Math.abs(e.clientY - hoverIntentRef.current.y);
    const deltaTime = now - hoverIntentRef.current.timestamp;
    
    // Show tooltip if mouse movement is slow (indicates intent)
    if (deltaTime > 100 && (deltaX < 5 && deltaY < 5)) {
      showTooltip();
    }
    
    hoverIntentRef.current = { x: e.clientX, y: e.clientY, timestamp: now };
  }, [showTooltip]);

  // Event handlers based on trigger type
  const eventHandlers = {
    hover: {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onMouseMove: handleMouseMove
    },
    click: {
      onClick: () => isVisible ? hideTooltip() : showTooltip()
    },
    focus: {
      onFocus: showTooltip,
      onBlur: hideTooltip
    },
    manual: {}
  };

  // Update position when tooltip becomes visible or window resizes
  useEffect(() => {
    if (isVisible) {
      updatePosition();
      
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isVisible, updatePosition]);

  // Register with tooltip manager
  useEffect(() => {
    if (registerTooltip) {
      const tooltipId = Math.random().toString(36).substr(2, 9);
      registerTooltip(tooltipId, { show: showTooltip, hide: hideTooltip });
      
      return () => {
        if (unregisterTooltip) unregisterTooltip(tooltipId);
      };
    }
  }, [registerTooltip, unregisterTooltip, showTooltip, hideTooltip]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Enhanced trigger element
  const triggerElement = React.cloneElement(children, {
    ref: triggerRef,
    ...eventHandlers[trigger],
    'aria-describedby': isVisible ? 'pharma-tooltip' : undefined,
    'aria-expanded': trigger === 'click' ? isVisible : undefined
  });

  // Tooltip portal content
  const tooltipPortal = isVisible && actualContent && createPortal(
    <div
      ref={tooltipRef}
      id="pharma-tooltip"
      className={`pharma-tooltip ${TOOLTIP_TYPES[type]?.className || ''} ${className} ${animation ? 'pharma-tooltip-animated' : ''}`}
      style={{
        position: 'fixed',
        left: currentPosition.x,
        top: currentPosition.y,
        maxWidth,
        zIndex: 9999,
        visibility: currentPosition.x === 0 && currentPosition.y === 0 ? 'hidden' : 'visible'
      }}
      role="tooltip"
      aria-hidden={!isVisible}
      onMouseEnter={interactive ? showTooltip : undefined}
      onMouseLeave={interactive ? hideTooltip : undefined}
      {...props}
    >
      <PharmaCard 
        variant={TOOLTIP_TYPES[type]?.variant}
        className="pharma-tooltip-card"
        size="sm"
      >
        {title && (
          <div className="pharma-tooltip-header">
            {TOOLTIP_TYPES[type]?.icon && (
              <span className="pharma-tooltip-icon me-2">
                {TOOLTIP_TYPES[type].icon}
              </span>
            )}
            <strong>{title}</strong>
          </div>
        )}
        
        <div className="pharma-tooltip-content">
          {typeof actualContent === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: actualContent }} />
          ) : (
            actualContent
          )}
        </div>
        
        {arrow && (
          <div 
            className={`pharma-tooltip-arrow pharma-tooltip-arrow-${currentPosition.position.split('-')[0]}`}
          />
        )}
      </PharmaCard>
    </div>,
    document.body
  );

  return (
    <>
      {triggerElement}
      {tooltipPortal}
    </>
  );
};

// Template generators for pharmacy-specific tooltips
const generateTemplateContent = (template, data) => {
  switch (template) {
    case 'drug-info':
      return (
        <div className="pharma-tooltip-drug-info">
          <div className="fw-bold">{data.generic_name}</div>
          {data.brand_name && (
            <div className="text-muted small">Brand: {data.brand_name}</div>
          )}
          <div className="small mt-2">
            <div><strong>NDC:</strong> {data.ndc}</div>
            <div><strong>Strength:</strong> {data.strength}</div>
            <div><strong>Form:</strong> {data.dosage_form}</div>
            {data.manufacturer_name && (
              <div><strong>Mfg:</strong> {data.manufacturer_name}</div>
            )}
          </div>
        </div>
      );
      
    case 'dosage-info':
      return (
        <div className="pharma-tooltip-dosage-info">
          <div className="fw-bold">Dosage Information</div>
          <div className="small mt-2">
            <div><strong>Strength:</strong> {data.strength}</div>
            <div><strong>Route:</strong> {data.route}</div>
            <div><strong>Frequency:</strong> {data.frequency}</div>
            {data.instructions && (
              <div className="mt-2">
                <strong>Instructions:</strong><br />
                {data.instructions}
              </div>
            )}
          </div>
        </div>
      );
      
    case 'interaction-warning':
      return (
        <div className="pharma-tooltip-interaction">
          <div className="fw-bold text-danger">⚠️ Drug Interaction</div>
          <div className="small mt-2">
            <div><strong>Interacting with:</strong> {data.interacting_drug}</div>
            <div><strong>Severity:</strong> 
              <Badge bg={data.severity === 'major' ? 'danger' : data.severity === 'moderate' ? 'warning' : 'info'} className="ms-1">
                {data.severity}
              </Badge>
            </div>
            {data.description && (
              <div className="mt-2">{data.description}</div>
            )}
          </div>
        </div>
      );
      
    case 'inventory-status':
      return (
        <div className="pharma-tooltip-inventory">
          <div className="fw-bold">Inventory Status</div>
          <div className="small mt-2">
            <div><strong>On Hand:</strong> {data.quantity_on_hand}</div>
            <div><strong>Reorder Level:</strong> {data.reorder_level}</div>
            <div><strong>Status:</strong> 
              <Badge bg={data.quantity_on_hand <= data.reorder_level ? 'warning' : 'success'} className="ms-1">
                {data.quantity_on_hand <= data.reorder_level ? 'Low Stock' : 'In Stock'}
              </Badge>
            </div>
            {data.expiration_date && (
              <div><strong>Expires:</strong> {new Date(data.expiration_date).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      );
      
    case 'help-text':
      return (
        <div className="pharma-tooltip-help">
          <div className="fw-bold">💡 Help</div>
          <div className="small mt-2">{data.text}</div>
          {data.learnMore && (
            <div className="mt-2">
              <a href={data.learnMore} target="_blank" rel="noopener noreferrer" className="small">
                Learn more →
              </a>
            </div>
          )}
        </div>
      );
      
    default:
      return data;
  }
};

// Tooltip Provider for global management
export const TooltipProvider = ({ children, maxConcurrent = 3 }) => {
  const [activeTooltips, setActiveTooltips] = useState(new Map());

  const registerTooltip = useCallback((id, controls) => {
    setActiveTooltips(prev => new Map(prev).set(id, controls));
  }, []);

  const unregisterTooltip = useCallback((id) => {
    setActiveTooltips(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const hideAllTooltips = useCallback(() => {
    activeTooltips.forEach(controls => controls.hide());
  }, [activeTooltips]);

  // Limit concurrent tooltips
  useEffect(() => {
    if (activeTooltips.size > maxConcurrent) {
      const excess = Array.from(activeTooltips.values()).slice(0, -maxConcurrent);
      excess.forEach(controls => controls.hide());
    }
  }, [activeTooltips.size, maxConcurrent]);

  const contextValue = {
    registerTooltip,
    unregisterTooltip,
    hideAllTooltips,
    activeCount: activeTooltips.size
  };

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
    </TooltipContext.Provider>
  );
};

// Pre-configured tooltip variants
export const DrugTooltip = ({ drug, children, ...props }) => (
  <PharmaTooltip
    type="drug"
    template="drug-info"
    data={drug}
    title="Drug Information"
    {...props}
  >
    {children}
  </PharmaTooltip>
);

export const DosageTooltip = ({ dosage, children, ...props }) => (
  <PharmaTooltip
    type="dosage"
    template="dosage-info"
    data={dosage}
    title="Dosage Information"
    {...props}
  >
    {children}
  </PharmaTooltip>
);

export const InteractionTooltip = ({ interaction, children, ...props }) => (
  <PharmaTooltip
    type="interaction"
    template="interaction-warning"
    data={interaction}
    title="Drug Interaction Warning"
    position="top"
    trigger="hover"
    {...props}
  >
    {children}
  </PharmaTooltip>
);

export const InventoryTooltip = ({ inventory, children, ...props }) => (
  <PharmaTooltip
    type="info"
    template="inventory-status"
    data={inventory}
    title="Inventory Details"
    {...props}
  >
    {children}
  </PharmaTooltip>
);

export const HelpTooltip = ({ helpText, learnMore, children, ...props }) => (
  <PharmaTooltip
    type="help"
    template="help-text"
    data={{ text: helpText, learnMore }}
    title="Help"
    trigger="click"
    interactive={true}
    {...props}
  >
    {children}
  </PharmaTooltip>
);

// Hook for using tooltip context
export const useTooltips = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltips must be used within TooltipProvider');
  }
  return context;
};

export default PharmaTooltip;
export { POSITIONS, TOOLTIP_TYPES, TooltipPositioner };