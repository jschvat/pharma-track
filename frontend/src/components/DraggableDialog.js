import React, { useState, useEffect, useRef } from 'react';

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

  // CSS styles for the draggable dialog
  const dialogStyles = `
    .draggable-dialog .modal-content {
      border-radius: 0 !important;
      border: 2px solid #2c3e50 !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
      position: relative !important;
    }
    
    .draggable-dialog .modal-header {
      background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%) !important;
      border-bottom: none !important;
      border-radius: 0 !important;
      padding: 6px 8px !important;
      min-height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      cursor: move !important;
      user-select: none !important;
    }
    
    .draggable-dialog .modal-header:active {
      cursor: grabbing !important;
    }
    
    .draggable-dialog .modal-title {
      font-size: 13px !important;
      font-weight: 400 !important;
      color: white !important;
      margin: 0 !important;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
    }
    
    .draggable-dialog .btn-close {
      background: #e81123 !important;
      border: none !important;
      font-size: 12px !important;
      color: white !important;
      padding: 0 !important;
      width: 24px !important;
      height: 20px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      opacity: 1 !important;
      margin: 0 !important;
    }
    
    .draggable-dialog .btn-close:hover {
      background: #f1707a !important;
      color: white !important;
    }
    
    .draggable-dialog .btn-close::before {
      content: '×' !important;
      font-size: 16px !important;
      line-height: 1 !important;
    }
    
    .draggable-dialog .modal-body {
      padding: 16px !important;
      background: #f0f0f0 !important;
      font-size: 13px !important;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
      line-height: 1.4 !important;
    }
    
    .draggable-dialog .modal-footer {
      background: #f0f0f0 !important;
      border-top: 1px solid #d0d0d0 !important;
      border-radius: 0 !important;
      padding: 10px 16px !important;
      gap: 8px !important;
      justify-content: flex-end !important;
    }
    
    .draggable-dialog .alert {
      border-radius: 0 !important;
      border: 1px solid #d0d0d0 !important;
      border-left: 3px solid #f59e0b !important;
      background: white !important;
      padding: 8px 12px !important;
      margin-bottom: 12px !important;
      font-size: 13px !important;
      line-height: 1.3 !important;
    }
    
    .draggable-dialog .alert-danger {
      border-left-color: #e81123 !important;
      background: white !important;
      color: #333 !important;
    }
    
    .draggable-dialog .alert-info {
      border-left-color: #0078d4 !important;
      background: white !important;
      color: #333 !important;
    }
    
    .draggable-dialog .alert-warning {
      border-left-color: #ff8c00 !important;
      background: white !important;
      color: #333 !important;
    }
    
    .draggable-dialog .alert i {
      font-size: 12px !important;
      margin-right: 6px !important;
    }
    
    .draggable-dialog .btn {
      border-radius: 0 !important;
      font-size: 11px !important;
      font-weight: 400 !important;
      padding: 6px 20px !important;
      border: 1px solid #ababab !important;
      text-transform: none !important;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
      min-width: 75px !important;
      height: 23px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    
    .draggable-dialog .btn-secondary {
      background: #e1e1e1 !important;
      border-color: #ababab !important;
      color: #000 !important;
    }
    
    .draggable-dialog .btn-secondary:hover {
      background: #e5f1fb !important;
      border-color: #0078d4 !important;
      color: #000 !important;
    }
    
    .draggable-dialog .btn-danger {
      background: #e1e1e1 !important;
      border-color: #ababab !important;
      color: #000 !important;
    }
    
    .draggable-dialog .btn-danger:hover {
      background: #e5f1fb !important;
      border-color: #0078d4 !important;
      color: #000 !important;
    }
    
    .draggable-dialog .btn-danger:disabled {
      background: #f0f0f0 !important;
      border-color: #d0d0d0 !important;
      color: #808080 !important;
      opacity: 1 !important;
    }
  `;

  // Inject styles
  useEffect(() => {
    const existingStyle = document.querySelector('[data-draggable-dialog]');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.textContent = dialogStyles;
    styleElement.setAttribute('data-draggable-dialog', 'true');
    document.head.appendChild(styleElement);
    
    return () => {
      const style = document.querySelector('[data-draggable-dialog]');
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Drag functionality
  const startDrag = (e) => {
    if (e.button !== 0) return; // Only left mouse button
    
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    const rect = dialog.getBoundingClientRect();
    
    // If dialog is centered, convert to absolute position first
    if (dialogPosition.x === 0 && dialogPosition.y === 0) {
      const newX = rect.left;
      const newY = rect.top;
      setDialogPosition({ x: newX, y: newY });
      
      setDragStart({
        x: e.clientX - newX,
        y: e.clientY - newY
      });
    } else {
      setDragStart({
        x: e.clientX - dialogPosition.x,
        y: e.clientY - dialogPosition.y
      });
    }
    
    setIsDragging(true);
    e.preventDefault();
  };

  const onDrag = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
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
    
    setDialogPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, dragStart]);

  // Reset position when dialog is closed
  const handleHide = () => {
    setDialogPosition({ x: 0, y: 0 });
    setIsDragging(false);
    if (onHide) onHide();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div 
        ref={dialogRef}
        className="draggable-dialog"
        style={{
          position: 'absolute',
          top: dialogPosition.y === 0 ? '50%' : `${dialogPosition.y}px`,
          left: dialogPosition.x === 0 ? '50%' : `${dialogPosition.x}px`,
          transform: dialogPosition.x === 0 && dialogPosition.y === 0 ? 'translate(-50%, -50%)' : 'none',
          width: `${width}px`,
          zIndex: 1051
        }}
      >
        <div className="modal-content">
          <div 
            className="modal-header"
            onMouseDown={startDrag}
            style={{ cursor: isDragging ? 'grabbing' : 'move' }}
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