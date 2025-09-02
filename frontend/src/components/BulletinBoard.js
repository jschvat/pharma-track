import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Badge, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { PostItContainer } from './PostItNote';
import { 
  PharmaCard, 
  PharmaAlert, 
  PharmaButton
} from './common/PharmaComponents';
import '../css/components.css';

const BulletinBoard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Removed unused notePositions state
  const [previousPositions, setPreviousPositions] = useState(new Map()); // Store positions before gather
  const [notesData, setNotesData] = useState({ notes: [], loading: true }); // Shared notes data
  const notesContainerRef = useRef(null);

  useEffect(() => {
    loadBulletinBoardData();
  }, [user]);

  const loadBulletinBoardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize bulletin board data
      setLoading(false);
    } catch (error) {
      console.error('Error loading bulletin board data:', error);
      setError('Failed to load bulletin board data');
      setLoading(false);
    }
  };

  // Post-it Notes Functions (moved from Dashboard) 
  const addNewNote = (position = null, content = '', color = 'yellow') => {
    // Dispatch a custom event that the PostItContainer will listen to
    // This allows us to leverage the existing note creation system
    window.dispatchEvent(new CustomEvent('createColoredNote', {
      detail: {
        position: position,
        content: content,
        color: color
      }
    }));
    
    return Date.now(); // Return a temporary ID
  };

  // Removed unused handleUpdateNote function

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading Bulletin Board...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      {/* Header Container */}
      <Container fluid className="px-4">
        <Row className="mb-3">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">
                  <i className="fas fa-clipboard-list text-primary me-2"></i>
                  Bulletin Board
                </h2>
                <p className="text-muted mb-0">
                  Communication hub for store notes, announcements, and team messages
                </p>
              </div>
              <Badge bg="primary" className="fs-6">
                {user?.store_name || 'Store Communications'}
              </Badge>
            </div>
          </Col>
        </Row>

        {error && (
          <Row className="mb-3">
            <Col>
              <PharmaAlert variant="danger" dismissible onClose={() => setError('')}>
                <strong>Error:</strong> {error}
              </PharmaAlert>
            </Col>
          </Row>
        )}

        {/* Compressed Quick Actions */}
        <Row className="mb-3">
          <Col>
            <PharmaCard>
              <Card.Body className="py-2">
                <div className="d-flex gap-2 flex-wrap align-items-center">
                  <small className="text-muted me-2">Quick Add:</small>
                  <PharmaButton 
                    variant="warning" 
                    size="sm"
                    onClick={() => addNewNote(null, '', 'yellow')}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Yellow
                  </PharmaButton>
                  <PharmaButton 
                    variant="primary" 
                    size="sm"
                    onClick={() => addNewNote(null, '', 'blue')}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Blue
                  </PharmaButton>
                  <PharmaButton 
                    variant="success" 
                    size="sm"
                    onClick={() => addNewNote(null, '', 'green')}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Green
                  </PharmaButton>
                  <PharmaButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => addNewNote(null, '', 'orange')}
                    style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14', color: 'white' }}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Orange
                  </PharmaButton>
                  <PharmaButton 
                    variant="danger" 
                    size="sm"
                    onClick={() => addNewNote(null, '', 'pink')}
                    style={{ backgroundColor: '#e91e63', borderColor: '#e91e63', color: 'white' }}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Pink
                  </PharmaButton>
                </div>
              </Card.Body>
            </PharmaCard>
          </Col>
        </Row>
      </Container>

      {/* Store Notes Section */}
      <Container fluid className="px-4">
        <Row className="mb-3">
          <Col>
            <PharmaCard>
              <Card.Header>
                <i className="fas fa-sticky-note me-2"></i>
                Store Notes
              </Card.Header>
              <Card.Body>
                {/* Note Management Actions */}
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <PharmaButton 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => {
                      // Try multiple selectors to find notes
                      const notesByClass = document.querySelectorAll('.post-it-note');
                      const notesByData = document.querySelectorAll('[data-note-id]');
                      
                      const notes = notesByClass.length > 0 ? notesByClass : notesByData;
                      const container = notesContainerRef.current;
                      
                      if (!container || notes.length === 0) {
                        return;
                      }
                      
                      const containerRect = container.getBoundingClientRect();
                      
                      // Simple approach - position in the visible container area
                      const startX = containerRect.left + 20; // 20px from left edge
                      const startY = containerRect.top + 20;  // 20px from top edge
                      const noteSize = 180; // Smaller notes to fit
                      const gap = 10;
                      const maxCols = Math.floor((containerRect.width - 40) / (noteSize + gap));
                      const cols = Math.max(1, maxCols);
                      
                      // Save current positions
                      const currentPositions = new Map();
                      notes.forEach((note, index) => {
                        const noteId = note.dataset.noteId || index;
                        const rect = note.getBoundingClientRect();
                        currentPositions.set(parseInt(noteId), {
                          x: rect.left,
                          y: rect.top
                        });
                      });
                      setPreviousPositions(currentPositions);
                      
                      // Position notes in grid
                      notes.forEach((note, index) => {
                        const col = index % cols;
                        const row = Math.floor(index / cols);
                        const x = startX + col * (noteSize + gap);
                        const y = startY + row * (noteSize + gap);
                        
                        // Apply new position and size
                        note.style.left = `${x}px`;
                        note.style.top = `${y}px`;
                        note.style.width = `${noteSize}px`;
                        note.style.height = `${noteSize}px`;
                        note.style.fontSize = '11px';
                        note.style.zIndex = 1000 + index;
                      });
                    }}
                  >
                    <i className="fas fa-compress-arrows-alt me-1"></i>
                    Gather
                  </PharmaButton>
                  
                  <PharmaButton 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => {
                      // Restore notes to their previous positions before gather
                      const notes = document.querySelectorAll('.post-it-note');
                      
                      if (previousPositions.size > 0) {
                        notes.forEach((note) => {
                          const noteId = parseInt(note.dataset.noteId);
                          const previousPos = previousPositions.get(noteId);
                          
                          if (previousPos) {
                            // Restore original size and styling
                            note.style.width = '300px';
                            note.style.height = '300px';
                            note.style.fontSize = '14px';
                            
                            note.style.left = `${previousPos.x}px`;
                            note.style.top = `${previousPos.y}px`;
                          }
                        });
                      } else {
                        // If no previous positions, scatter randomly in content area
                        const sidebarWidth = 280;
                        const headerHeight = 60;
                        const padding = 20;
                        const minX = sidebarWidth + padding;
                        const minY = headerHeight + padding;
                        const maxX = window.innerWidth - 300 - padding;
                        const maxY = window.innerHeight - 300 - padding;
                        
                        notes.forEach((note, index) => {
                          const x = Math.random() * (maxX - minX) + minX;
                          const y = Math.random() * (maxY - minY) + minY;
                          
                          // Restore original size and styling
                          note.style.width = '300px';
                          note.style.height = '300px';
                          note.style.fontSize = '14px';
                          
                          note.style.left = `${x}px`;
                          note.style.top = `${y}px`;
                        });
                      }
                    }}
                  >
                    <i className="fas fa-undo me-1"></i>
                    Restore
                  </PharmaButton>
                  
                  <PharmaButton 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => {
                      // Bring all notes forward to ensure visibility
                      const notes = document.querySelectorAll('.post-it-note');
                      const baseZIndex = 2000; // High z-index to ensure visibility
                      
                      notes.forEach((note, index) => {
                        note.style.zIndex = baseZIndex + index;
                        
                        // Also ensure the note is within viewport if it's hidden
                        const rect = note.getBoundingClientRect();
                        const isVisible = rect.top >= 0 && rect.left >= 0 && 
                                        rect.bottom <= window.innerHeight && 
                                        rect.right <= window.innerWidth;
                        
                        if (!isVisible) {
                          // Move note to a visible position
                          const centerX = window.innerWidth / 2;
                          const centerY = window.innerHeight / 2;
                          const offset = index * 20; // Slight offset for each note
                          const newX = centerX - 150 + offset;
                          const newY = centerY - 150 + offset;
                          note.style.left = `${newX}px`;
                          note.style.top = `${newY}px`;
                        }
                      });
                    }}
                  >
                    <i className="fas fa-arrow-up me-1"></i>
                    Forward
                  </PharmaButton>
                  
                  <PharmaButton 
                    variant="outline-warning" 
                    size="sm"
                    onClick={() => {
                      // Send all notes to back (z-index management)
                      const notes = document.querySelectorAll('.post-it-note');
                      notes.forEach((note, index) => {
                        note.style.zIndex = 100 - index;
                      });
                    }}
                  >
                    <i className="fas fa-arrow-down me-1"></i>
                    Behind
                  </PharmaButton>
                </div>

                {/* Large Notes Management Area - Empty workspace for gathered notes */}
                <div 
                  className="notes-workspace border rounded p-3 bg-light" 
                  style={{ minHeight: '400px', position: 'relative' }}
                  ref={notesContainerRef}
                >
                  <div className="text-center text-muted py-5">
                    <i className="fas fa-sticky-note fa-3x mb-3" style={{opacity: 0.3}}></i>
                    <p className="h5">Notes Workspace</p>
                    <p>Use the <strong>Gather</strong> button above to organize your post-it notes into this area.</p>
                    <small>Drag notes around the screen or click the colored buttons above to create new ones.</small>
                  </div>
                </div>

                {/* Store Notes Statistics Footer */}
                <div className="mt-3 pt-3 border-top">
                  <div className="row">
                    <div className="col-md-8">
                      <h6 className="mb-2">
                        <i className="fas fa-chart-bar me-2 text-primary"></i>
                        Notes Statistics
                      </h6>
                      <div className="d-flex flex-wrap gap-3 small">
                        <span className="badge bg-primary">
                          📝 Total: {notesData.notes?.length || 0}
                        </span>
                        <span className="badge bg-success">
                          📌 Pinned: {notesData.notes?.filter(n => n.is_pinned).length || 0}
                        </span>
                        <span className="badge bg-warning text-dark">
                          ⏰ Temporary: {notesData.notes?.filter(n => !n.is_pinned).length || 0}
                        </span>
                        <span className="badge bg-info">
                          🕐 Recent (7 days): {notesData.notes?.filter(note => {
                            const noteDate = new Date(note.created_at);
                            const sevenDaysAgo = new Date();
                            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                            return noteDate >= sevenDaysAgo;
                          }).length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4 text-end">
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Last updated: {notesData.lastUpdated ? new Date(notesData.lastUpdated).toLocaleTimeString() : 'Never'}
                      </small>
                    </div>
                  </div>
                  
                  {/* Quick View of Recent Notes */}
                  {notesData.notes && notesData.notes.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted fw-bold">Recent Notes:</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {notesData.notes
                          .filter(note => {
                            const noteDate = new Date(note.created_at);
                            const threeDaysAgo = new Date();
                            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                            return noteDate >= threeDaysAgo;
                          })
                          .slice(0, 3)
                          .map(note => (
                            <span 
                              key={note.id} 
                              className="badge bg-light text-dark border"
                              title={note.content}
                              style={{ maxWidth: '150px' }}
                            >
                              {note.color === 'yellow' && '🟡'}
                              {note.color === 'blue' && '🔵'}
                              {note.color === 'green' && '🟢'}
                              {note.color === 'orange' && '🟠'}
                              {note.color === 'pink' && '🩷'}
                              {note.color === 'purple' && '🟣'}
                              {note.is_pinned && '📌'}
                              {' '}
                              {note.content.length > 20 ? note.content.substring(0, 20) + '...' : note.content}
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </PharmaCard>
          </Col>
        </Row>
      </Container>
      
      {/* Post-it Notes Container */}
      <PostItContainer onNotesUpdate={setNotesData} />

      {/* Compressed Footer Tips */}
      <Container fluid className="px-4 mt-4">
        <Row>
          <Col>
            <div className="bg-light border rounded p-2">
              <div className="d-flex flex-wrap gap-3 align-items-center justify-content-center text-muted small">
                <span><i className="fas fa-mouse-pointer me-1"></i>Drag to move</span>
                <span><i className="fas fa-thumbtack me-1"></i>Pin important</span>
                <span><i className="fas fa-palette me-1"></i>Color code</span>
                <span><i className="fas fa-users me-1"></i>Team communication</span>
                <span><i className="fas fa-archive me-1"></i>Archive old notes</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BulletinBoard;