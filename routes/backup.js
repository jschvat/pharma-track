/**
 * @swagger
 * tags:
 *   name: Backup & Recovery
 *   description: Database backup and disaster recovery operations
 */

const express = require('express');
const { validationResult, body, query } = require('express-validator');
const { authenticateToken, requireAdminRole } = require('../middleware/auth');
const BackupService = require('../services/backupService');
const HealthMonitor = require('../services/healthMonitor');
const path = require('path');

const router = express.Router();
const backupService = new BackupService();
const healthMonitor = new HealthMonitor();

/**
 * @swagger
 * /api/backup/create:
 *   post:
 *     summary: Create database backup
 *     description: Create a manual database backup with optional configuration
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [manual, daily, weekly, monthly]
 *                 default: manual
 *                 description: Backup type
 *               compression:
 *                 type: boolean
 *                 default: true
 *                 description: Enable compression
 *               tables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific tables to backup (all if not specified)
 *               excludeTables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tables to exclude from backup
 *     responses:
 *       201:
 *         description: Backup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Backup created successfully"
 *                 backup:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     path:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     duration:
 *                       type: integer
 *                     checksum:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or backup failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.post('/create', authenticateToken, requireAdminRole, [
  body('type').optional().isIn(['manual', 'daily', 'weekly', 'monthly']).withMessage('Invalid backup type'),
  body('compression').optional().isBoolean().withMessage('Compression must be boolean'),
  body('tables').optional().isArray().withMessage('Tables must be an array'),
  body('excludeTables').optional().isArray().withMessage('Exclude tables must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type = 'manual', tables = [], excludeTables = [] } = req.body;

    const options = {};
    if (tables.length > 0) options.tables = tables;
    if (excludeTables.length > 0) options.excludeTables = excludeTables;

    const result = await backupService.createFullBackup(type, options);

    res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        name: result.name,
        path: path.basename(result.path),
        size: result.size,
        duration: result.duration,
        checksum: result.checksum,
        timestamp: result.timestamp
      }
    });

  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create backup',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/list:
 *   get:
 *     summary: List available backups
 *     description: Retrieve list of all available database backups with metadata
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, manual]
 *         description: Filter by backup type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of backups to return
 *     responses:
 *       200:
 *         description: Backup list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 backups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       duration:
 *                         type: integer
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       checksum:
 *                         type: string
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.get('/list', authenticateToken, requireAdminRole, [
  query('type').optional().isIn(['daily', 'weekly', 'monthly', 'manual']).withMessage('Invalid backup type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, limit = 20 } = req.query;

    let backups = await backupService.listBackups();

    // Filter by type if specified
    if (type) {
      backups = backups.filter(backup => backup.type === type);
    }

    // Limit results
    backups = backups.slice(0, limit);

    // Remove sensitive path information
    const sanitizedBackups = backups.map(backup => ({
      name: backup.name,
      type: backup.type,
      size: backup.size,
      duration: backup.duration,
      timestamp: backup.timestamp,
      checksum: backup.checksum,
      compressed: backup.compressed,
      encrypted: backup.encrypted
    }));

    res.json({
      success: true,
      backups: sanitizedBackups,
      total: sanitizedBackups.length
    });

  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list backups',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/cleanup:
 *   post:
 *     summary: Clean up old backups
 *     description: Remove old backup files based on retention policy
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cleanup completed successfully"
 *                 deletedCount:
 *                   type: integer
 *                   description: Number of backups deleted
 *                 remaining:
 *                   type: integer
 *                   description: Number of backups remaining
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.post('/cleanup', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const result = await backupService.cleanupOldBackups();

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      deletedCount: result.deletedCount,
      remaining: result.remaining
    });

  } catch (error) {
    console.error('Cleanup backups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup backups',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/export:
 *   post:
 *     summary: Export specific data
 *     description: Export specific tables or data for migrations or transfers
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tables to export
 *                 example: ["users", "stores", "drugs"]
 *               format:
 *                 type: string
 *                 enum: [sql, json]
 *                 default: sql
 *                 description: Export format
 *               includeSchema:
 *                 type: boolean
 *                 default: true
 *                 description: Include table schemas
 *               includeData:
 *                 type: boolean
 *                 default: true
 *                 description: Include table data
 *             required: [tables]
 *     responses:
 *       200:
 *         description: Export created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 export:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     format:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or export failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.post('/export', authenticateToken, requireAdminRole, [
  body('tables').isArray({ min: 1 }).withMessage('Tables array is required'),
  body('format').optional().isIn(['sql', 'json']).withMessage('Format must be sql or json'),
  body('includeSchema').optional().isBoolean().withMessage('Include schema must be boolean'),
  body('includeData').optional().isBoolean().withMessage('Include data must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tables, format = 'sql', includeSchema = true, includeData = true } = req.body;

    const result = await backupService.exportData({
      tables,
      format,
      includeSchema,
      includeData
    });

    res.json({
      success: true,
      message: 'Export created successfully',
      export: {
        name: result.name,
        size: result.size,
        format: result.format,
        timestamp: result.timestamp
      }
    });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/status:
 *   get:
 *     summary: Get backup service status
 *     description: Retrieve current status and configuration of backup service
 *     tags: [Backup & Recovery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                       example: "BackupService"
 *                     version:
 *                       type: string
 *                     config:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.get('/status', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const status = backupService.getStatus();

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Get backup status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backup status',
      message: error.message
    });
  }
});

module.exports = router;