/**
 * System Health Monitoring Service
 * 
 * Comprehensive health monitoring system for PharmaTraK with the following features:
 * - Database connection monitoring
 * - System resource monitoring (CPU, memory, disk)
 * - API endpoint health checks
 * - Performance metrics collection
 * - Alert generation and notification
 * - Health dashboard data
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');
const EventEmitter = require('events');

class HealthMonitor extends EventEmitter {
  constructor() {
    super();
    
    this.config = {
      checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
      alertThresholds: {
        cpuUsage: parseFloat(process.env.CPU_ALERT_THRESHOLD) || 80, // 80%
        memoryUsage: parseFloat(process.env.MEMORY_ALERT_THRESHOLD) || 85, // 85%
        diskUsage: parseFloat(process.env.DISK_ALERT_THRESHOLD) || 90, // 90%
        dbConnectionTime: parseInt(process.env.DB_ALERT_THRESHOLD) || 5000, // 5 seconds
        apiResponseTime: parseInt(process.env.API_ALERT_THRESHOLD) || 3000 // 3 seconds
      },
      retentionDays: parseInt(process.env.HEALTH_RETENTION_DAYS) || 7,
      dataDir: process.env.HEALTH_DATA_DIR || path.join(__dirname, '../logs/health')
    };

    this.metrics = {
      system: {
        cpu: [],
        memory: [],
        disk: [],
        uptime: process.uptime()
      },
      database: {
        connectionTime: [],
        activeConnections: [],
        status: 'unknown'
      },
      api: {
        responseTime: [],
        errorRate: [],
        requestCount: 0
      },
      alerts: []
    };

    this.isRunning = false;
    this.monitoringInterval = null;

    this.ensureDataDirectory();
  }

  /**
   * Ensure health data directory exists
   */
  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.config.dataDir, { recursive: true });
      console.log(`✅ Health monitoring data directory: ${this.config.dataDir}`);
    } catch (error) {
      console.error('❌ Failed to create health data directory:', error);
    }
  }

  /**
   * Start health monitoring
   */
  async startMonitoring() {
    if (this.isRunning) {
      console.log('⚠️ Health monitoring is already running');
      return;
    }

    console.log('🏥 Starting system health monitoring...');
    
    this.isRunning = true;
    
    // Perform initial health check
    await this.performHealthCheck();
    
    // Set up recurring health checks
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error);
        this.generateAlert('health_check_failed', {
          message: 'Health check execution failed',
          error: error.message,
          timestamp: new Date()
        });
      }
    }, this.config.checkInterval);

    // Set up cleanup interval (daily)
    setInterval(async () => {
      await this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log(`✅ Health monitoring started (interval: ${this.config.checkInterval}ms)`);
    
    this.emit('monitoring_started');
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (!this.isRunning) {
      console.log('⚠️ Health monitoring is not running');
      return;
    }

    console.log('🛑 Stopping system health monitoring...');
    
    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('✅ Health monitoring stopped');
    
    this.emit('monitoring_stopped');
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const timestamp = new Date();
    
    try {
      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics();
      
      // Check database health
      const dbHealth = await this.checkDatabaseHealth();
      
      // Check API health
      const apiHealth = await this.checkAPIHealth();
      
      // Update metrics
      this.updateMetrics(systemMetrics, dbHealth, apiHealth, timestamp);
      
      // Check for alerts
      await this.checkAlertConditions(systemMetrics, dbHealth, apiHealth);
      
      // Save metrics to disk
      await this.saveMetrics(timestamp);
      
      // Emit health update event
      this.emit('health_update', {
        system: systemMetrics,
        database: dbHealth,
        api: apiHealth,
        timestamp
      });

    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * Collect system resource metrics
   * @returns {Object} System metrics
   */
  async collectSystemMetrics() {
    const startTime = process.hrtime.bigint();
    
    // CPU usage calculation
    const cpuUsage = await this.getCPUUsage();
    
    // Memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    
    // Process memory usage
    const processMemory = process.memoryUsage();
    
    // Disk usage
    const diskUsage = await this.getDiskUsage();
    
    // Load average (Unix-like systems)
    const loadAverage = os.loadavg();
    
    // System uptime
    const systemUptime = os.uptime();
    const processUptime = process.uptime();
    
    const endTime = process.hrtime.bigint();
    const collectionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    return {
      cpu: {
        usage: cpuUsage,
        loadAverage: loadAverage
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usage: memoryUsage,
        process: processMemory
      },
      disk: diskUsage,
      uptime: {
        system: systemUptime,
        process: processUptime
      },
      collectionTime
    };
  }

  /**
   * Calculate CPU usage percentage
   * @returns {Promise<number>} CPU usage percentage
   */
  getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime.bigint();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime.bigint();
        
        const elapsedTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        const totalCPUTime = (endUsage.user + endUsage.system) / 1000; // Convert to milliseconds
        
        const cpuUsage = (totalCPUTime / elapsedTime) * 100;
        resolve(Math.min(cpuUsage, 100)); // Cap at 100%
      }, 100);
    });
  }

  /**
   * Get disk usage information
   * @returns {Promise<Object>} Disk usage data
   */
  async getDiskUsage() {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Use df command to get disk usage (Unix-like systems)
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.trim().split('\n');
      
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        const usage = parseInt(parts[4].replace('%', ''));
        
        return {
          total: parts[1],
          used: parts[2],
          available: parts[3],
          usage: usage,
          mount: parts[5]
        };
      }
      
      return { usage: 0, error: 'Unable to parse disk usage' };
      
    } catch (error) {
      return { usage: 0, error: error.message };
    }
  }

  /**
   * Check database health and performance
   * @returns {Object} Database health data
   */
  async checkDatabaseHealth() {
    const startTime = process.hrtime.bigint();
    
    try {
      // Test basic connection
      const [rows] = await pool.execute('SELECT 1 as test');
      
      // Get connection pool status (safely handle undefined properties)
      const poolStatus = {
        totalConnections: pool.pool?._allConnections?.length || 0,
        activeConnections: pool.pool?._acquiringConnections?.length || 0,
        freeConnections: pool.pool?._freeConnections?.length || 0
      };
      
      // Test a more complex query
      const [tableCount] = await pool.execute(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = ?
      `, [process.env.DB_NAME || 'pharmatrak']);
      
      // Get database size
      const [sizeInfo] = await pool.execute(`
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = ?
      `, [process.env.DB_NAME || 'pharmatrak']);

      const endTime = process.hrtime.bigint();
      const connectionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      return {
        status: 'healthy',
        connectionTime,
        poolStatus,
        tableCount: tableCount[0].table_count,
        databaseSize: sizeInfo[0].size_mb,
        timestamp: new Date()
      };

    } catch (error) {
      const endTime = process.hrtime.bigint();
      const connectionTime = Number(endTime - startTime) / 1000000;

      return {
        status: 'unhealthy',
        connectionTime,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check API endpoint health
   * @returns {Object} API health data
   */
  async checkAPIHealth() {
    const startTime = process.hrtime.bigint();
    
    try {
      // Test health endpoint
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/health`);
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      if (response.ok) {
        const healthData = await response.json();
        
        return {
          status: 'healthy',
          responseTime,
          statusCode: response.status,
          data: healthData,
          timestamp: new Date()
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime,
          statusCode: response.status,
          error: `HTTP ${response.status}`,
          timestamp: new Date()
        };
      }

    } catch (error) {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;

      return {
        status: 'unhealthy',
        responseTime,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Update metrics arrays with new data
   */
  updateMetrics(systemMetrics, dbHealth, apiHealth, timestamp) {
    const maxEntries = 100; // Keep last 100 entries in memory
    
    // Update system metrics
    this.metrics.system.cpu.push({
      usage: systemMetrics.cpu.usage,
      loadAverage: systemMetrics.cpu.loadAverage,
      timestamp
    });
    
    this.metrics.system.memory.push({
      usage: systemMetrics.memory.usage,
      used: systemMetrics.memory.used,
      total: systemMetrics.memory.total,
      timestamp
    });
    
    this.metrics.system.disk.push({
      usage: systemMetrics.disk.usage,
      timestamp
    });

    // Update database metrics
    this.metrics.database.connectionTime.push({
      time: dbHealth.connectionTime,
      timestamp
    });
    
    this.metrics.database.status = dbHealth.status;

    // Update API metrics
    this.metrics.api.responseTime.push({
      time: apiHealth.responseTime,
      timestamp
    });

    // Trim arrays to max entries
    Object.keys(this.metrics.system).forEach(key => {
      if (Array.isArray(this.metrics.system[key])) {
        this.metrics.system[key] = this.metrics.system[key].slice(-maxEntries);
      }
    });
    
    this.metrics.database.connectionTime = this.metrics.database.connectionTime.slice(-maxEntries);
    this.metrics.api.responseTime = this.metrics.api.responseTime.slice(-maxEntries);
  }

  /**
   * Check for alert conditions
   */
  async checkAlertConditions(systemMetrics, dbHealth, apiHealth) {
    const { alertThresholds } = this.config;
    
    // CPU usage alert
    if (systemMetrics.cpu.usage > alertThresholds.cpuUsage) {
      this.generateAlert('high_cpu_usage', {
        current: systemMetrics.cpu.usage,
        threshold: alertThresholds.cpuUsage,
        timestamp: new Date()
      });
    }

    // Memory usage alert
    if (systemMetrics.memory.usage > alertThresholds.memoryUsage) {
      this.generateAlert('high_memory_usage', {
        current: systemMetrics.memory.usage,
        threshold: alertThresholds.memoryUsage,
        timestamp: new Date()
      });
    }

    // Disk usage alert
    if (systemMetrics.disk.usage > alertThresholds.diskUsage) {
      this.generateAlert('high_disk_usage', {
        current: systemMetrics.disk.usage,
        threshold: alertThresholds.diskUsage,
        timestamp: new Date()
      });
    }

    // Database connection time alert
    if (dbHealth.connectionTime > alertThresholds.dbConnectionTime) {
      this.generateAlert('slow_database_connection', {
        current: dbHealth.connectionTime,
        threshold: alertThresholds.dbConnectionTime,
        timestamp: new Date()
      });
    }

    // Database health alert
    if (dbHealth.status === 'unhealthy') {
      this.generateAlert('database_unhealthy', {
        error: dbHealth.error,
        timestamp: new Date()
      });
    }

    // API response time alert
    if (apiHealth.responseTime > alertThresholds.apiResponseTime) {
      this.generateAlert('slow_api_response', {
        current: apiHealth.responseTime,
        threshold: alertThresholds.apiResponseTime,
        timestamp: new Date()
      });
    }

    // API health alert
    if (apiHealth.status === 'unhealthy') {
      this.generateAlert('api_unhealthy', {
        error: apiHealth.error,
        statusCode: apiHealth.statusCode,
        timestamp: new Date()
      });
    }
  }

  /**
   * Generate an alert
   */
  generateAlert(type, data) {
    const alert = {
      id: Date.now().toString(),
      type,
      severity: this.getAlertSeverity(type),
      data,
      timestamp: new Date(),
      acknowledged: false
    };

    this.metrics.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    this.metrics.alerts = this.metrics.alerts.slice(0, 50);

    console.log(`🚨 ALERT [${alert.severity}]: ${type}`, data);
    
    this.emit('alert_generated', alert);
  }

  /**
   * Get alert severity level
   */
  getAlertSeverity(type) {
    const severityMap = {
      high_cpu_usage: 'warning',
      high_memory_usage: 'warning',
      high_disk_usage: 'critical',
      slow_database_connection: 'warning',
      database_unhealthy: 'critical',
      slow_api_response: 'warning',
      api_unhealthy: 'critical',
      health_check_failed: 'critical'
    };

    return severityMap[type] || 'info';
  }

  /**
   * Save metrics to disk for persistence
   */
  async saveMetrics(timestamp) {
    try {
      const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const filePath = path.join(this.config.dataDir, `health_${date}.json`);
      
      const dailyMetrics = {
        timestamp,
        system: {
          cpu: this.metrics.system.cpu.slice(-1)[0],
          memory: this.metrics.system.memory.slice(-1)[0],
          disk: this.metrics.system.disk.slice(-1)[0]
        },
        database: {
          connectionTime: this.metrics.database.connectionTime.slice(-1)[0],
          status: this.metrics.database.status
        },
        api: {
          responseTime: this.metrics.api.responseTime.slice(-1)[0]
        }
      };

      // Read existing data for the day
      let existingData = [];
      try {
        const existing = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(existing);
      } catch (error) {
        // File doesn't exist yet
      }

      existingData.push(dailyMetrics);
      
      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
      
    } catch (error) {
      console.error('Failed to save health metrics:', error);
    }
  }

  /**
   * Clean up old health data
   */
  async cleanupOldData() {
    try {
      const files = await fs.readdir(this.config.dataDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('health_') && file.endsWith('.json')) {
          const dateStr = file.replace('health_', '').replace('.json', '');
          const fileDate = new Date(dateStr);
          
          if (fileDate < cutoffDate) {
            await fs.unlink(path.join(this.config.dataDir, file));
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old health data files`);
      }

    } catch (error) {
      console.error('Failed to cleanup old health data:', error);
    }
  }

  /**
   * Get current health summary
   * @returns {Object} Current health status
   */
  getCurrentHealth() {
    const latestMetrics = {
      system: {
        cpu: this.metrics.system.cpu.slice(-1)[0],
        memory: this.metrics.system.memory.slice(-1)[0],
        disk: this.metrics.system.disk.slice(-1)[0]
      },
      database: {
        connectionTime: this.metrics.database.connectionTime.slice(-1)[0],
        status: this.metrics.database.status
      },
      api: {
        responseTime: this.metrics.api.responseTime.slice(-1)[0]
      },
      alerts: this.metrics.alerts.slice(0, 10), // Latest 10 alerts
      isMonitoring: this.isRunning,
      uptime: process.uptime()
    };

    return latestMetrics;
  }

  /**
   * Get historical health data
   * @param {number} hours - Number of hours to retrieve
   * @returns {Object} Historical health data
   */
  getHistoricalData(hours = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return {
      system: {
        cpu: this.metrics.system.cpu.filter(m => new Date(m.timestamp) > cutoffTime),
        memory: this.metrics.system.memory.filter(m => new Date(m.timestamp) > cutoffTime),
        disk: this.metrics.system.disk.filter(m => new Date(m.timestamp) > cutoffTime)
      },
      database: {
        connectionTime: this.metrics.database.connectionTime.filter(m => new Date(m.timestamp) > cutoffTime)
      },
      api: {
        responseTime: this.metrics.api.responseTime.filter(m => new Date(m.timestamp) > cutoffTime)
      }
    };
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - Alert ID to acknowledge
   */
  acknowledgeAlert(alertId) {
    const alert = this.metrics.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      console.log(`✅ Alert acknowledged: ${alert.type}`);
      this.emit('alert_acknowledged', alert);
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      service: 'HealthMonitor',
      version: '1.0.0',
      isRunning: this.isRunning,
      config: this.config,
      metricsCount: {
        cpu: this.metrics.system.cpu.length,
        memory: this.metrics.system.memory.length,
        disk: this.metrics.system.disk.length,
        database: this.metrics.database.connectionTime.length,
        api: this.metrics.api.responseTime.length,
        alerts: this.metrics.alerts.length
      },
      timestamp: new Date()
    };
  }
}

module.exports = HealthMonitor;