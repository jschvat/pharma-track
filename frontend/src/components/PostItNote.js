import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PostItNote = ({
  id,
  initialText = '',
  initialPosition = { x: 100, y: 100 },
  color = 'yellow',
  isPinned = false,
  onUpdate,
  onDelete,
  onPin,
  isEditing: initialEditing = false
}) => {
  const [text, setText] = useState(initialText);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [zIndex, setZIndex] = useState(1000);
  const [isExpanded, setIsExpanded] = useState(false);
  const [gatheredSize, setGatheredSize] = useState(null); // Store gathered dimensions
  const [size, setSize] = useState({ width: 300, height: 300 }); // Note dimensions
  const [isResizing, setIsResizing] = useState(false);
  
  const noteRef = useRef(null);
  const textareaRef = useRef(null);

  // Color map for different note colors with appropriate text colors for contrast
  const colorMap = {
    yellow: { 
      bg: '#ffeb3b', 
      border: '#f57f17', 
      gradient: 'linear-gradient(135deg, #ffeb3b 0%, #fdd835 50%, #f9a825 100%)',
      textColor: '#333333', // Dark text on light yellow
      placeholderColor: '#666666'
    },
    orange: { 
      bg: '#ff9800', 
      border: '#e65100', 
      gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #ef6c00 100%)',
      textColor: '#ffffff', // White text on orange
      placeholderColor: '#f0f0f0'
    },
    blue: { 
      bg: '#2196f3', 
      border: '#0d47a1', 
      gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 50%, #1565c0 100%)',
      textColor: '#ffffff', // White text on blue
      placeholderColor: '#e8f4ff'
    },
    green: { 
      bg: '#4caf50', 
      border: '#1b5e20', 
      gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 50%, #2e7d32 100%)',
      textColor: '#ffffff', // White text on green
      placeholderColor: '#e8f5e8'
    },
    pink: { 
      bg: '#e91e63', 
      border: '#880e4f', 
      gradient: 'linear-gradient(135deg, #e91e63 0%, #c2185b 50%, #ad1457 100%)',
      textColor: '#ffffff', // White text on pink
      placeholderColor: '#fce4ec'
    },
    purple: { 
      bg: '#9c27b0', 
      border: '#4a148c', 
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 50%, #6a1b9a 100%)',
      textColor: '#ffffff', // White text on purple
      placeholderColor: '#f3e5f5'
    }
  };
  
  const currentColor = colorMap[color] || colorMap.yellow;

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Handle outside clicks to collapse expanded gathered notes
  useEffect(() => {
    if (isExpanded) {
      const handleOutsideClick = (e) => {
        if (noteRef.current && !noteRef.current.contains(e.target)) {
          setIsExpanded(false);
        }
      };

      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }
  }, [isExpanded]);

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    // Don't drag if clicking on the textarea while editing or on resize handle
    if (isEditing && e.target.tagName === 'TEXTAREA') return;
    if (isResizing) return;
    
    // If we're editing and clicking outside the textarea, save and exit editing mode
    if (isEditing && e.target.tagName !== 'TEXTAREA') {
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(id, { position, text });
      }
    }
    
    const rect = noteRef.current.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setIsDragging(true);
    setZIndex(Date.now()); // Bring to front
    
    // Prevent text selection while dragging
    e.preventDefault();
    
    // Immediately add event listeners for this drag session
    const handleMouseMove = (e) => {
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        const newPosition = {
          x: e.clientX - offset.x,
          y: e.clientY - offset.y
        };
        
        // Keep note within content area bounds (excluding sidebar and header)
        const noteWidth = 300;
        const noteHeight = 300;
        const sidebarWidth = 280; // Approximate sidebar width
        const headerHeight = 60;  // Approximate header height
        const padding = 20;       // Padding from edges
        
        const minX = sidebarWidth + padding;
        const minY = headerHeight + padding;
        const maxX = window.innerWidth - noteWidth - padding;
        const maxY = window.innerHeight - noteHeight - padding;
        
        newPosition.x = Math.max(minX, Math.min(maxX, newPosition.x));
        newPosition.y = Math.max(minY, Math.min(maxY, newPosition.y));
        
        setPosition(newPosition);
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position
      if (onUpdate) {
        onUpdate(id, { position, text });
      }
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // Add event listeners immediately
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle resize start
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Don't trigger note drag or click
    
    setIsResizing(true);
    setZIndex(zIndex + 100); // Bring to front while resizing

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleResizeMouseMove = (e) => {
      const deltaX = e.clientX - startMouseX;
      const deltaY = e.clientY - startMouseY;
      
      const newWidth = Math.max(150, startWidth + deltaX); // Min width 150px
      const newHeight = Math.max(150, startHeight + deltaY); // Min height 150px
      
      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeMouseUp = () => {
      setIsResizing(false);
      // Save new size
      if (onUpdate) {
        onUpdate(id, { position, text, size });
      }
      // Remove event listeners
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };

    // Add event listeners immediately
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };

  // Detect if note is gathered (small size) - check if width is smaller than normal
  const isGathered = () => {
    if (noteRef.current) {
      const computedStyle = window.getComputedStyle(noteRef.current);
      const width = parseInt(computedStyle.width);
      return width < 250; // Normal size is 300px, gathered is 180px
    }
    return false;
  };

  // Handle single click - expand gathered notes or focus for editing
  const handleClick = (e) => {
    // Don't handle click if we're dragging, resizing, or clicking buttons/resize handle
    if (isDragging || isResizing) return;
    if (e.target.tagName === 'BUTTON') return;
    
    e.stopPropagation();
    
    // If this is a gathered note and not expanded, expand it
    if (isGathered() && !isExpanded) {
      // Capture the current gathered size before expanding
      if (noteRef.current) {
        const computedStyle = window.getComputedStyle(noteRef.current);
        setGatheredSize({
          width: computedStyle.width,
          height: computedStyle.height,
          fontSize: computedStyle.fontSize
        });
      }
      
      setIsExpanded(true);
      setZIndex(2000); // Bring to front when expanded
    }
  };

  // Handle double click to edit
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  // Handle text change
  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  // Handle save (blur or Enter)
  const handleSave = () => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate(id, { position, text });
    }
  };

  // Handle key press in textarea
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setText(initialText); // Revert changes
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <div
      ref={noteRef}
      className="post-it-note"
      data-note-id={id}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: zIndex,
        background: currentColor.gradient,
        fontFamily: 'Comic Sans MS, cursive, sans-serif',
        fontSize: isExpanded ? '14px' : (gatheredSize ? gatheredSize.fontSize : undefined), // Use gathered size when collapsed
        width: isExpanded ? `${size.width}px` : (gatheredSize ? gatheredSize.width : `${size.width}px`), // Use custom size or gathered size
        height: isExpanded ? `${size.height}px` : (gatheredSize ? gatheredSize.height : `${size.height}px`), // Use custom size or gathered size
        padding: '16px',
        border: `1px solid ${currentColor.border}`,
        borderRadius: '8px',
        boxShadow: isDragging 
          ? '0 35px 60px rgba(0, 0, 0, 0.35), 0 20px 40px rgba(249, 168, 37, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(0, 0, 0, 0.1)' 
          : isPinned 
          ? '0 12px 24px rgba(0, 0, 0, 0.25), 0 6px 12px rgba(249, 168, 37, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
          : '0 6px 12px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(249, 168, 37, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
        cursor: 'move',
        userSelect: 'none',
        transform: isDragging ? 'rotate(2deg) scale(1.05) translateZ(0)' : 'rotate(1deg) translateZ(0)',
        transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(1px)',
        borderTop: '2px solid rgba(255, 255, 255, 0.4)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
        borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
        borderRight: '1px solid rgba(0, 0, 0, 0.05)'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Paper texture overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0),
            radial-gradient(circle at 3px 3px, rgba(255,255,255,0.1) 1px, transparent 0)
          `,
          backgroundSize: '8px 8px, 12px 12px',
          borderRadius: '8px',
          pointerEvents: 'none',
          opacity: 0.6
        }}
      />
      
      {/* Pin button */}
      <button
        style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          width: '24px', // Slightly larger hit area
          height: '24px',
          background: isPinned ? 'linear-gradient(135deg, #4caf50, #388e3c)' : 'linear-gradient(135deg, #9e9e9e, #757575)',
          border: 'none',
          color: 'white',
          fontSize: '10px',
          cursor: 'pointer',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          transition: 'all 0.1s ease',
          transform: 'translateZ(0)',
          zIndex: 10 // Ensure it's above other elements
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.15) translateZ(0)';
          e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1) translateZ(0)';
          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        }}
        onMouseDown={(e) => {
          // Prevent drag from starting when clicking pin button
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (onPin) onPin(id);
        }}
        title={isPinned ? "Unpin note" : "Pin note"}
      >
        📌
      </button>
      
      {/* Delete button - improved sensitivity */}
      <button
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '24px', // Slightly larger hit area
          height: '24px',
          background: 'linear-gradient(135deg, #ff5252, #d32f2f)',
          border: 'none',
          color: 'white',
          fontSize: '12px',
          cursor: 'pointer',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          transition: 'all 0.1s ease',
          transform: 'translateZ(0)',
          zIndex: 10 // Ensure it's above other elements
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.15) translateZ(0)';
          e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1) translateZ(0)';
          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        }}
        onMouseDown={(e) => {
          // Prevent drag from starting when clicking delete button
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleDelete();
        }}
        title="Delete note"
      >
        ×
      </button>

      {/* Ephemeral note indicator */}
      {!isPinned && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '30px',
            fontSize: '10px',
            color: 'rgba(0, 0, 0, 0.4)',
            fontStyle: 'italic',
            background: 'rgba(255, 255, 255, 0.7)',
            padding: '2px 6px',
            borderRadius: '3px',
            pointerEvents: 'none'
          }}
        >
          temporary
        </div>
      )}

      {/* Note content */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)' }}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onBlur={handleSave}
            onKeyDown={handleKeyPress}
            style={{
              width: '100%',
              height: '100%',
              resize: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              lineHeight: '1.5',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              color: currentColor.textColor,
              '--placeholder-color': currentColor.placeholderColor
            }}
            placeholder="Add note..."
          />
        ) : (
          <div 
            style={{
              width: '100%',
              height: '100%',
              lineHeight: '1.5',
              overflowY: 'auto',
              cursor: 'text',
              color: currentColor.textColor
            }}
            title="Double-click to edit"
          >
            {text || (
              <span style={{ color: currentColor.placeholderColor, fontStyle: 'italic' }}>
                Double-click to edit
              </span>
            )}
          </div>
        )}
      </div>

      {/* Resize handle - bottom right corner */}
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          width: '12px',
          height: '12px',
          cursor: 'nw-resize',
          background: 'linear-gradient(-45deg, transparent 0%, transparent 40%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.3) 60%, transparent 60%)',
          borderRadius: '0 0 6px 0',
          opacity: isResizing ? 0.8 : 0.4,
          transition: 'opacity 0.2s ease'
        }}
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize"
        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
        onMouseLeave={(e) => e.target.style.opacity = isResizing ? '0.8' : '0.4'}
      />
    </div>
  );
};

// Container component for managing multiple post-it notes
export const PostItContainer = ({ onNotesUpdate }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const handleAddNoteRef = useRef();
  
  // Update parent component when notes change
  useEffect(() => {
    if (onNotesUpdate && !loading) {
      onNotesUpdate({ notes: notes, loading: false });
    }
  }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load notes from API
  useEffect(() => {
    if (user?.store_id) {
      loadNotes();
    }
  }, [user]);

  // All notes are now persistent (no ephemeral notes system)

  const loadNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const notesArray = data.notes || [];
        setNotes(notesArray);
        setError('');
        
        // Parent component will be updated by useEffect
      } else {
        // Failed to load notes
        setError('Failed to load notes');
      }
    } catch (err) {
      // Error loading notes
      setError('Error loading notes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (id, updatedNote) => {
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        content: updatedNote.text,
        position_x: updatedNote.position.x,
        position_y: updatedNote.position.y
      };

      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedNotes = notes.map(note => 
          note.id === id ? { ...note, ...data.note } : note
        );
        setNotes(updatedNotes);
        
        // Parent component will be updated by useEffect
      }
    } catch (err) {
      // Error updating note
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);
        
        // Parent component will be updated by useEffect
      }
    } catch (err) {
      // Error deleting note
    }
  };

  const handlePinNote = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      // Find the current note (all notes are persistent now)
      const currentNote = notes.find(note => note.id === id);
      
      if (!currentNote) {
        return;
      }
      
      // Send both pin toggle AND current position to preserve location when pinning
      const response = await fetch(`/api/notes/${id}/pin`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position_x: currentNote.position_x,
          position_y: currentNote.position_y
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the note in the notes array (all notes are persistent)
        const updatedNotes = notes.map(note => 
          note.id === id ? { ...note, ...data.note } : note
        );
        setNotes(updatedNotes);
        
        // Parent component will be updated by useEffect
      }
    } catch (err) {
      // Error toggling pin
    }
  };

  const handleAddNote = useCallback(async () => {
    // Calculate content area bounds for new note placement
    const sidebarWidth = 280;
    const headerHeight = 60;
    const padding = 20;
    const noteWidth = 300;
    const noteHeight = 300;
    
    const minX = sidebarWidth + padding;
    const minY = headerHeight + padding;
    const maxX = window.innerWidth - noteWidth - padding;
    const maxY = window.innerHeight - noteHeight - padding;

    // Random color selection from the specified colors
    const colors = ['yellow', 'blue', 'pink', 'orange'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newNoteData = {
      content: '',
      position_x: Math.max(minX, minX + Math.random() * Math.max(0, maxX - minX)),
      position_y: Math.max(minY, minY + Math.random() * Math.max(0, maxY - minY)),
      color: randomColor
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newNoteData)
      });

      if (response.ok) {
        const data = await response.json();
        const newNote = {
          ...data.note,
          isEditing: true // Set new note to editing mode
        };
        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        
        // Parent component will be updated by useEffect
      }
    } catch (err) {
      // Error creating note
    }
  }, []);

  // Update ref when handleAddNote changes
  useEffect(() => {
    handleAddNoteRef.current = handleAddNote;
  }, [handleAddNote]);

  // Listen for add note events from dashboard - stable event listener
  useEffect(() => {
    const handleAddNoteEvent = () => {
      if (handleAddNoteRef.current) {
        handleAddNoteRef.current();
      }
    };

    // Listen for colored note creation events from BulletinBoard
    const handleCreateColoredNote = (event) => {
      const { position, content, color } = event.detail;
      
      // Calculate content area bounds for new note placement  
      const sidebarWidth = 280;
      const headerHeight = 60;
      const padding = 20;
      const noteWidth = 300;
      const noteHeight = 300;
      
      const minX = sidebarWidth + padding;
      const minY = headerHeight + padding;
      const maxX = window.innerWidth - noteWidth - padding;
      const maxY = window.innerHeight - noteHeight - padding;

      const notePosition = position || {
        x: Math.max(minX, minX + Math.random() * Math.max(0, maxX - minX)),
        y: Math.max(minY, minY + Math.random() * Math.max(0, maxY - minY))
      };

      const newNoteData = {
        content: content || '',
        position_x: notePosition.x,
        position_y: notePosition.y,
        color: color || 'yellow'
      };

      // Create the note using the same API call pattern as handleAddNote
      const createColoredNote = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newNoteData)
          });

          if (response.ok) {
            const data = await response.json();
            const newNote = {
              ...data.note,
              isEditing: true // Set new note to editing mode
            };
            // Use functional update to ensure we have the latest notes
            setNotes(currentNotes => {
              const updatedNotes = [...currentNotes, newNote];
              return updatedNotes;
            });
            
            // Parent component update will be handled by useEffect
          }
        } catch (err) {
          // Error creating colored note
        }
      };

      createColoredNote();
    };

    window.addEventListener('addPostItNote', handleAddNoteEvent);
    window.addEventListener('createColoredNote', handleCreateColoredNote);
    
    return () => {
      window.removeEventListener('addPostItNote', handleAddNoteEvent);
      window.removeEventListener('createColoredNote', handleCreateColoredNote);
    };
  }, []); // Remove dependencies to prevent re-creation

  // Listen for note position update events from dashboard
  useEffect(() => {
    const handleUpdateNotePosition = (event) => {
      const { noteId, position } = event.detail;
      const note = notes.find(n => n.id === parseInt(noteId));
      
      if (note) {
        handleUpdateNote(parseInt(noteId), {
          text: note.content,
          position: position
        });
      }
    };

    window.addEventListener('updateNotePosition', handleUpdateNotePosition);
    return () => {
      window.removeEventListener('updateNotePosition', handleUpdateNotePosition);
    };
  }, [notes, handleUpdateNote]);

  // Don't render if user doesn't have a store
  if (!user?.store_id) {
    return null;
  }

  if (loading) {
    return null; // Or a loading indicator
  }

  if (error) {
    console.warn('PostIt Notes Error:', error);
    return null;
  }

  return (
    <>
      {/* Add Note Button */}
      <button
        onClick={handleAddNote}
        className="fixed bottom-6 right-6 w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
        title="Add new post-it note"
      >
        <span className="text-yellow-800 text-xl font-bold">+</span>
      </button>

      {/* Render all notes */}
      {notes.map(note => (
        <PostItNote
          key={`note_${note.id}`}
          id={note.id}
          initialText={note.content || ''}
          initialPosition={{ x: note.position_x, y: note.position_y }}
          color={note.color}
          isPinned={note.is_pinned}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
          onPin={handlePinNote}
          isEditing={note.isEditing || false}
        />
      ))}
    </>
  );
};

export default PostItNote;