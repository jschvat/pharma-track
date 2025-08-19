import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../css/components.css';

const DraggableDialog = ({ 
  show, 
  onHide, 
  title, 
  children, 
  footer,
  width = 420,
  height = 300 
}) => {
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  const dialogRef = useRef(null);


  // Drag functionality
  const startDrag = (e) => {
    // console.log('startDrag called', e.button, e.target);
    if (e.button !== 0) return; // Only left mouse button
    
    const dialog = dialogRef.current;
    if (!dialog) {
      // console.log('No dialog ref');
      return;
    }
    
    const rect = dialog.getBoundingClientRect();
    
    // Always use current position from DOM
    const currentX = rect.left;
    const currentY = rect.top;
    
    // console.log('Setting drag start', { currentX, currentY, clientX: e.clientX, clientY: e.clientY });
    
    setDragStart({
      x: e.clientX - currentX,
      y: e.clientY - currentY
    });
    
    // Update position state to match DOM position
    setDialogPosition({ x: currentX, y: currentY });
    setIsDragging(true);
    e.preventDefault();
    e.stopPropagation();
  };

  // Simplified drag handlers without useCallback to avoid dependency issues
  const onDrag = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // console.log('onDrag', { clientX: e.clientX, clientY: e.clientY, dragStartX: dragStart.x, dragStartY: dragStart.y, newX, newY });
    
    // Get actual dialog dimensions
    const dialog = dialogRef.current;
    const dialogWidth = dialog ? dialog.offsetWidth : width;
    const dialogHeight = dialog ? dialog.offsetHeight : height;
    
    // Get viewport dimensions with padding
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10; // Minimum distance from edges
    
    // Ensure dialog stays fully within viewport with padding
    const minX = padding;
    const maxX = Math.max(padding, viewportWidth - dialogWidth - padding);
    const minY = padding;
    const maxY = Math.max(padding, viewportHeight - dialogHeight - padding);
    
    const finalX = Math.max(minX, Math.min(newX, maxX));
    const finalY = Math.max(minY, Math.min(newY, maxY));
    
    // console.log('Setting position to', { finalX, finalY });
    
    setDialogPosition({
      x: finalX,
      y: finalY
    });
  };

  const stopDrag = () => {
    // console.log('stopDrag called');
    setIsDragging(false);
  };

  useEffect(() => {
    // console.log('useEffect isDragging changed:', isDragging);
    if (isDragging) {
      // console.log('Adding event listeners');
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      document.body.style.userSelect = 'none';
      
      return () => {
        // console.log('Removing event listeners');
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging]);

  // Reset position when dialog is closed
  const handleHide = () => {
    setDialogPosition({ x: 0, y: 0 });
    setIsDragging(false);
    if (onHide) onHide();
  };

  if (!show) return null;

  return (
    <div className="draggable-dialog-overlay">
      <div 
        ref={dialogRef}
        className={`draggable-dialog draggable-dialog-container ${
          dialogPosition.x === 0 && dialogPosition.y === 0 ? 'centered' : ''
        }`}
        style={{
          top: dialogPosition.y === 0 ? '50%' : `${dialogPosition.y}px`,
          left: dialogPosition.x === 0 ? '50%' : `${dialogPosition.x}px`,
          transform: dialogPosition.x === 0 && dialogPosition.y === 0 ? 'translate(-50%, -50%)' : 'none',
          width: `${width}px`
        }}
      >
        <div className="modal-content">
          <div 
            className={`modal-header draggable-dialog-header ${isDragging ? 'dragging' : ''}`}
            onMouseDown={startDrag}
          >
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleHide}
            >
            </button>
          </div>
          <div className="modal-body">
            {children}
          </div>
          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableDialog;