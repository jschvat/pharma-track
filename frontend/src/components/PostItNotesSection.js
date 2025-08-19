import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, ButtonGroup } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const PostItNotesSection = ({ actionBarProps, notesData: externalNotesData }) => {
  const { user } = useAuth();
  const [notesData, setNotesData] = useState({
    stats: { total_notes: 0, pinned_notes: 0, ephemeral_notes: 0, recent_notes: 0 },
    recentNotes: [],
    pinnedNotes: []
  });
  const [loading, setLoading] = useState(true);

  // If external notes data is provided, use it instead of making API calls
  useEffect(() => {
    if (externalNotesData) {
      // Process external notes data to match our expected format
      const allNotes = externalNotesData.notes || [];
      const pinnedNotes = allNotes.filter(note => note.is_pinned);
      const ephemeralNotes = allNotes.filter(note => !note.is_pinned);
      const recentNotes = allNotes
        .filter(note => {
          const noteDate = new Date(note.created_at);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return noteDate >= sevenDaysAgo;
        })
        .slice(0, 3);

      setNotesData({
        stats: {
          total_notes: allNotes.length,
          pinned_notes: pinnedNotes.length,
          ephemeral_notes: ephemeralNotes.length,
          recent_notes: recentNotes.length
        },
        recentNotes: recentNotes.slice(0, 3),
        pinnedNotes: pinnedNotes.slice(0, 3)
      });
      setLoading(false);
      return;
    }

    // Fallback to API calls if no external data provided
    if (user?.store_id) {
      loadNotesData();
    }
  }, [user, externalNotesData]);

  const loadNotesData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load stats, recent notes, and pinned notes in parallel
      const [statsRes, recentRes, pinnedRes] = await Promise.allSettled([
        fetch('/api/notes/stats/store', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/notes?recent=7', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/notes?pinned=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const newData = { ...notesData };

      // Process stats
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        newData.stats = statsData.stats || newData.stats;
      }

      // Process recent notes
      if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
        const recentData = await recentRes.value.json();
        newData.recentNotes = (recentData.notes || []).slice(0, 3);
      }

      // Process pinned notes
      if (pinnedRes.status === 'fulfilled' && pinnedRes.value.ok) {
        const pinnedData = await pinnedRes.value.json();
        newData.pinnedNotes = (pinnedData.notes || []).slice(0, 3);
      }

      setNotesData(newData);
    } catch (error) {
      console.error('Error loading notes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddButton = () => {
    // Trigger add note by dispatching custom event
    window.dispatchEvent(new CustomEvent('addPostItNote'));
  };

  const getColorEmoji = (color) => {
    const colorEmojis = {
      yellow: '🟡',
      orange: '🟠', 
      blue: '🔵',
      green: '🟢',
      pink: '🩷',
      purple: '🟣'
    };
    return colorEmojis[color] || '🟡';
  };

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!user?.store_id || loading) {
    return null;
  }

  return (
    <Card 
      className="mb-4 stable-card" 
      style={{ 
        border: '2px solid #8B4513',
        transition: 'none !important',
        transform: 'none !important',
        position: 'static !important'
      }}
    >
      <Card.Header 
        style={{
          background: 'linear-gradient(135deg, #D2691E 0%, #CD853F 50%, #DEB887 100%)',
          borderBottom: '2px solid #8B4513',
          color: '#654321',
          transition: 'none',
          transform: 'none'
        }}
      >
        {/* Title Row */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h5 className="mb-0" style={{ color: '#654321', fontWeight: 'bold' }}>📌 Store Notes</h5>
            <small style={{ color: '#8B4513' }}>Quick reminders and important information</small>
          </div>
        </div>
        
        {/* Action Bar Row */}
        {actionBarProps && (
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <small className="me-3" style={{ color: '#654321', fontWeight: 'bold' }}>Actions:</small>
              <ButtonGroup size="sm">
                <Button 
                  variant="outline-dark" 
                  onClick={actionBarProps.addNewNote || toggleAddButton}
                  title="Add new note"
                  style={{ 
                    borderColor: '#654321', 
                    color: '#654321',
                    transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out',
                    transform: 'none'
                  }}
                >
                  <i className="fas fa-plus"></i> Add
                </Button>
                <Button 
                  variant="outline-dark" 
                  onClick={actionBarProps.moveAllNotesToCard}
                  title="Move all notes into the card area"
                  style={{ 
                    borderColor: '#654321', 
                    color: '#654321',
                    transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out',
                    transform: 'none'
                  }}
                >
                  <i className="fas fa-compress-arrows-alt"></i> Gather
                </Button>
                <Button 
                  variant="outline-dark" 
                  onClick={actionBarProps.restoreNotesToPreviousPositions}
                  title="Restore notes to their previous positions"
                  style={{ 
                    borderColor: '#654321', 
                    color: '#654321',
                    transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out',
                    transform: 'none'
                  }}
                >
                  <i className="fas fa-undo"></i> Restore
                </Button>
                <Button 
                  variant="outline-dark" 
                  onClick={actionBarProps.bringAllNotesForward}
                  title="Bring all notes to front"
                  style={{ 
                    borderColor: '#654321', 
                    color: '#654321',
                    transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out',
                    transform: 'none'
                  }}
                >
                  <i className="fas fa-layer-group"></i> Forward
                </Button>
                <Button 
                  variant="outline-dark" 
                  onClick={actionBarProps.moveAllNotesBehind}
                  title="Move all notes behind content"
                  style={{ 
                    borderColor: '#654321', 
                    color: '#654321',
                    transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out',
                    transform: 'none'
                  }}
                >
                  <i className="fas fa-level-down-alt"></i> Behind
                </Button>
              </ButtonGroup>
            </div>
            <small style={{ color: '#8B4513' }}>Manage all sticky notes on this page</small>
          </div>
        )}
      </Card.Header>
      <Card.Body>
        {/* Statistics Row */}
        <div className="row mb-3">
            <div className="col-md-3 text-center">
              <div className="d-flex flex-column">
                <span className="h4 text-primary">{notesData.stats.total_notes}</span>
                <small className="text-muted">Total</small>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="d-flex flex-column">
                <span className="h4 text-warning">{notesData.stats.pinned_notes}</span>
                <small className="text-muted">Saved</small>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="d-flex flex-column">
                <span className="h4 text-secondary">{notesData.stats.ephemeral_notes || 0}</span>
                <small className="text-muted">Temporary</small>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="d-flex flex-column">
                <span className="h4 text-success">{notesData.stats.recent_notes}</span>
                <small className="text-muted">Recent</small>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Pinned Notes */}
            <div className="col-md-6">
              <h6 className="mb-2 text-dark">📌 Pinned Notes</h6>
            {notesData.pinnedNotes.length > 0 ? (
              <div className="space-y-2">
                {notesData.pinnedNotes.map((note, index) => (
                  <div 
                    key={note.id}
                    className="d-flex align-items-start mb-2 p-2 rounded"
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      borderLeft: '3px solid #ffc107',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span className="me-2">{getColorEmoji(note.color)}</span>
                    <div className="flex-grow-1">
                      <div className="fw-bold">
                        {truncateText(note.content.split('\n')[0] || 'Empty note', 30)}
                      </div>
                      {note.created_by_name && (
                        <small className="text-muted">by {note.created_by_name}</small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-center py-2">
                <small>No pinned notes yet</small>
              </div>
            )}
          </div>

            {/* Recent Notes */}
            <div className="col-md-6">
              <h6 className="mb-2 text-dark">🕒 Recent Notes</h6>
            {notesData.recentNotes.length > 0 ? (
              <div className="space-y-2">
                {notesData.recentNotes.map((note, index) => (
                  <div 
                    key={note.id}
                    className="d-flex align-items-start mb-2 p-2 rounded"
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      borderLeft: '3px solid #6c757d',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span className="me-2">{getColorEmoji(note.color)}</span>
                    <div className="flex-grow-1">
                      <div className="fw-bold">
                        {truncateText(note.content.split('\n')[0] || 'Empty note', 30)}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        {note.created_by_name && (
                          <small className="text-muted">by {note.created_by_name}</small>
                        )}
                        {note.is_pinned && (
                          <Badge bg="warning" className="ms-1">📌</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-center py-2">
                <small>No recent notes</small>
              </div>
            )}
          </div>
        </div>

        {notesData.stats.total_notes === 0 && (
            <div className="text-center py-4">
              <div className="mb-2 text-muted">
                📝 No notes yet for this store
              </div>
              <Button 
                variant="warning" 
                size="sm"
                onClick={toggleAddButton}
              >
                Create Your First Note
              </Button>
            </div>
          )}
      </Card.Body>
    </Card>
  );
};

export default PostItNotesSection;