/**
 * Post-it Notes API Routes
 * 
 * Handles CRUD operations for store-specific post-it notes with proper access control
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const PostItNote = require('../models/PostItNote');

// Middleware to validate request and check store access
const validateAndCheckAccess = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Check if user has store access
  if (!req.user.store_id) {
    return res.status(403).json({
      success: false,
      message: 'User must be assigned to a store to manage notes'
    });
  }

  next();
};

// Middleware to check note access
const checkNoteAccess = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const userStoreId = req.user.store_id;

    const hasAccess = await PostItNote.hasAccess(noteId, userStoreId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Note not found or belongs to different store'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking note access:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking note access'
    });
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     PostItNote:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique note ID
 *         store_id:
 *           type: integer
 *           description: Store ID the note belongs to
 *         user_id:
 *           type: integer
 *           description: ID of user who created the note
 *         content:
 *           type: string
 *           description: Note content/text
 *         position_x:
 *           type: integer
 *           description: X coordinate position
 *         position_y:
 *           type: integer
 *           description: Y coordinate position
 *         color:
 *           type: string
 *           enum: [yellow, orange, blue, green, pink, purple]
 *           description: Note color
 *         is_pinned:
 *           type: boolean
 *           description: Whether note is pinned
 *         is_active:
 *           type: boolean
 *           description: Whether note is active (not deleted)
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         created_by_name:
 *           type: string
 *           description: Name of user who created the note
 */

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes for user's store
 *     tags: [Post-it Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pinned
 *         schema:
 *           type: boolean
 *         description: Filter by pinned status
 *       - in: query
 *         name: recent
 *         schema:
 *           type: integer
 *         description: Get notes from last N days
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PostItNote'
 */
router.get('/', authenticateToken, validateAndCheckAccess, [
  query('pinned').optional().isBoolean(),
  query('recent').optional().isInt({ min: 1, max: 30 })
], async (req, res) => {
  try {
    const storeId = req.user.store_id;
    const { pinned, recent } = req.query;

    let notes;
    if (pinned === 'true') {
      notes = await PostItNote.getPinnedByStore(storeId);
    } else if (recent) {
      notes = await PostItNote.getRecentByStore(storeId, parseInt(recent));
    } else {
      notes = await PostItNote.getByStore(storeId);
    }

    res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
});

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new post-it note
 *     tags: [Post-it Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - position_x
 *               - position_y
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *               position_x:
 *                 type: integer
 *                 minimum: 0
 *               position_y:
 *                 type: integer
 *                 minimum: 0
 *               color:
 *                 type: string
 *                 enum: [yellow, orange, blue, green, pink, purple]
 *                 default: yellow
 *               is_pinned:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Note created successfully
 */
router.post('/', authenticateToken, validateAndCheckAccess, [
  body('content').isString().isLength({ min: 1, max: 5000 }),
  body('position_x').isInt({ min: 0 }),
  body('position_y').isInt({ min: 0 }),
  body('color').optional().isIn(['yellow', 'orange', 'blue', 'green', 'pink', 'purple']),
  body('is_pinned').optional().isBoolean()
], async (req, res) => {
  try {
    const noteData = {
      store_id: req.user.store_id,
      user_id: req.user.id,
      content: req.body.content,
      position_x: req.body.position_x,
      position_y: req.body.position_y,
      color: req.body.color || 'yellow',
      is_pinned: req.body.is_pinned || false
    };

    const noteId = await PostItNote.create(noteData);
    const createdNote = await PostItNote.getById(noteId);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: createdNote
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a specific note by ID
 *     tags: [Post-it Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Note retrieved successfully
 */
router.get('/:id', authenticateToken, validateAndCheckAccess, checkNoteAccess, [
  param('id').isInt()
], async (req, res) => {
  try {
    const note = await PostItNote.getById(req.params.id);
    
    res.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update a post-it note
 *     tags: [Post-it Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               position_x:
 *                 type: integer
 *                 minimum: 0
 *               position_y:
 *                 type: integer
 *                 minimum: 0
 *               color:
 *                 type: string
 *                 enum: [yellow, orange, blue, green, pink, purple]
 *               is_pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Note updated successfully
 */
router.put('/:id', authenticateToken, validateAndCheckAccess, checkNoteAccess, [
  param('id').isInt(),
  body('content').optional().isString().isLength({ max: 5000 }),
  body('position_x').optional().isInt({ min: 0 }),
  body('position_y').optional().isInt({ min: 0 }),
  body('color').optional().isIn(['yellow', 'orange', 'blue', 'green', 'pink', 'purple']),
  body('is_pinned').optional().isBoolean()
], async (req, res) => {
  try {
    const updated = await PostItNote.update(req.params.id, req.body);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or no changes made'
      });
    }

    const updatedNote = await PostItNote.getById(req.params.id);

    res.json({
      success: true,
      message: 'Note updated successfully',
      note: updatedNote
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a post-it note
 *     tags: [Post-it Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Note deleted successfully
 */
router.delete('/:id', authenticateToken, validateAndCheckAccess, checkNoteAccess, [
  param('id').isInt()
], async (req, res) => {
  try {
    const deleted = await PostItNote.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note'
    });
  }
});

/**
 * @swagger
 * /api/notes/{id}/pin:
 *   patch:
 *     summary: Toggle pin status of a note
 *     tags: [Post-it Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pin status toggled successfully
 */
router.patch('/:id/pin', authenticateToken, validateAndCheckAccess, checkNoteAccess, [
  param('id').isInt()
], async (req, res) => {
  try {
    const toggled = await PostItNote.togglePin(req.params.id);
    
    if (!toggled) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const updatedNote = await PostItNote.getById(req.params.id);

    res.json({
      success: true,
      message: `Note ${updatedNote.is_pinned ? 'pinned' : 'unpinned'} successfully`,
      note: updatedNote
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling pin status'
    });
  }
});

/**
 * @swagger
 * /api/notes/stats:
 *   get:
 *     summary: Get statistics for store notes
 *     tags: [Post-it Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats/store', authenticateToken, validateAndCheckAccess, async (req, res) => {
  try {
    const stats = await PostItNote.getStoreStats(req.user.store_id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

module.exports = router;