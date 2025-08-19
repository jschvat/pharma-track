/**
 * @swagger
 * tags:
 *   name: Health Monitoring
 *   description: System health monitoring and alerting operations
 */

const express = require('express');
const { validationResult, query, param } = require('express-validator');
const { authenticateToken, requireAdminRole } = require('../middleware/auth');
const HealthMonitor = require('../services/healthMonitor');

const router = express.Router();
const healthMonitor = new HealthMonitor();

// Start health monitoring when module loads
if (!healthMonitor.isRunning) {
  healthMonitor.startMonitoring().catch(console.error);
}

/**
 * @swagger
 * /api/health/status:
 *   get:
 *     summary: Get current system health
 *     description: Retrieve current system health metrics including CPU, memory, disk, database, and API status
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 health:
 *                   type: object
 *                   properties:
 *                     system:
 *                       type: object
 *                       properties:
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             usage:
 *                               type: number
 *                               example: 15.5
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                         memory:
 *                           type: object
 *                           properties:
 *                             usage:
 *                               type: number
 *                               example: 68.2
 *                             used:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                         disk:
 *                           type: object
 *                           properties:
 *                             usage:
 *                               type: number
 *                               example: 45.8
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         connectionTime:
 *                           type: object
 *                           properties:
 *                             time:
 *                               type: number
 *                               example: 25.4
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                     api:
 *                       type: object
 *                       properties:
 *                         responseTime:
 *                           type: object
 *                           properties:
 *                             time:
 *                               type: number
 *                               example: 150.2
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           severity:
 *                             type: string
 *                           data:
 *                             type: object
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           acknowledged:
 *                             type: boolean
 *                     isMonitoring:
 *                       type: boolean
 *                       example: true
 *                     uptime:
 *                       type: number
 *                       example: 86400
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.get('/status', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const health = healthMonitor.getCurrentHealth();

    res.json({
      success: true,
      health
    });

  } catch (error) {
    console.error('Get health status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Get historical health metrics
 *     description: Retrieve historical system health metrics for analysis and trending
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 168
 *           default: 24
 *         description: Number of hours of historical data to retrieve
 *     responses:
 *       200:
 *         description: Historical metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     system:
 *                       type: object
 *                       properties:
 *                         cpu:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               usage:
 *                                 type: number
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                         memory:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               usage:
 *                                 type: number
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                         disk:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               usage:
 *                                 type: number
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                     database:
 *                       type: object
 *                       properties:
 *                         connectionTime:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               time:
 *                                 type: number
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                     api:
 *                       type: object
 *                       properties:
 *                         responseTime:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               time:
 *                                 type: number
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                 hours:
 *                   type: integer
 *                   example: 24
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.get('/metrics', authenticateToken, requireAdminRole, [
  query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { hours = 24 } = req.query;

    const metrics = healthMonitor.getHistoricalData(hours);

    res.json({
      success: true,
      metrics,
      hours
    });

  } catch (error) {
    console.error('Get health metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health metrics',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/alerts:
 *   get:
 *     summary: Get active alerts
 *     description: Retrieve current active health alerts with optional filtering
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: acknowledged
 *         schema:
 *           type: boolean
 *         description: Filter by acknowledgment status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, critical]
 *         description: Filter by severity level
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of alerts to return
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         example: "high_cpu_usage"
 *                       severity:
 *                         type: string
 *                         enum: [info, warning, critical]
 *                         example: "warning"
 *                       data:
 *                         type: object
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       acknowledged:
 *                         type: boolean
 *                         example: false
 *                       acknowledgedAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.get('/alerts', authenticateToken, requireAdminRole, [
  query('acknowledged').optional().isBoolean().withMessage('Acknowledged must be boolean').toBoolean(),
  query('severity').optional().isIn(['info', 'warning', 'critical']).withMessage('Invalid severity level'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { acknowledged, severity, limit = 20 } = req.query;

    let alerts = healthMonitor.metrics.alerts;

    // Filter by acknowledgment status
    if (acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === acknowledged);
    }

    // Filter by severity
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    // Limit results
    alerts = alerts.slice(0, limit);

    res.json({
      success: true,
      alerts,
      total: alerts.length
    });

  } catch (error) {
    console.error('Get health alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health alerts',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     description: Mark a specific alert as acknowledged
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID to acknowledge
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
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
 *                   example: "Alert acknowledged successfully"
 *       400:
 *         description: Alert not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.post('/alerts/:alertId/acknowledge', authenticateToken, requireAdminRole, [
  param('alertId').isString().notEmpty().withMessage('Alert ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { alertId } = req.params;

    const alert = healthMonitor.metrics.alerts.find(a => a.id === alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    healthMonitor.acknowledgeAlert(alertId);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });

  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/monitoring/start:
 *   post:
 *     summary: Start health monitoring
 *     description: Start the health monitoring service
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monitoring started successfully
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
 *                   example: "Health monitoring started successfully"
 *       400:
 *         description: Monitoring already running
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.post('/monitoring/start', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    if (healthMonitor.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Health monitoring is already running'
      });
    }

    await healthMonitor.startMonitoring();

    res.json({
      success: true,
      message: 'Health monitoring started successfully'
    });

  } catch (error) {
    console.error('Start monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start health monitoring',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/monitoring/stop:
 *   post:
 *     summary: Stop health monitoring
 *     description: Stop the health monitoring service
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monitoring stopped successfully
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
 *                   example: "Health monitoring stopped successfully"
 *       400:
 *         description: Monitoring not running
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.post('/monitoring/stop', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    if (!healthMonitor.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Health monitoring is not running'
      });
    }

    healthMonitor.stopMonitoring();

    res.json({
      success: true,
      message: 'Health monitoring stopped successfully'
    });

  } catch (error) {
    console.error('Stop monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop health monitoring',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health/service/status:
 *   get:
 *     summary: Get health monitoring service status
 *     description: Retrieve status and configuration of the health monitoring service
 *     tags: [Health Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status retrieved successfully
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
 *                       example: "HealthMonitor"
 *                     version:
 *                       type: string
 *                     isRunning:
 *                       type: boolean
 *                     config:
 *                       type: object
 *                     metricsCount:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (admin required)
 */
router.get('/service/status', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const status = healthMonitor.getStatus();

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Get service status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status',
      message: error.message
    });
  }
});

module.exports = router;