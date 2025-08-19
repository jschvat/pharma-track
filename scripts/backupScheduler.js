#!/usr/bin/env node

/**
 * Automated Backup Scheduler
 * 
 * Provides automated scheduling for database backups with the following features:
 * - Daily, weekly, and monthly backup schedules
 * - Configurable retention policies
 * - Health monitoring integration
 * - Email notifications on success/failure
 * - Backup verification and integrity checks
 * 
 * Usage:
 *   node scripts/backupScheduler.js --schedule daily
 *   node scripts/backupScheduler.js --manual
 *   node scripts/backupScheduler.js --cleanup
 *   node scripts/backupScheduler.js --status
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

require('dotenv').config();
const { program } = require('commander');
const cron = require('node-cron');
const BackupService = require('../services/backupService');
const HealthMonitor = require('../services/healthMonitor');

class BackupScheduler {
  constructor() {
    this.backupService = new BackupService();
    this.healthMonitor = new HealthMonitor();
    this.scheduledJobs = new Map();
    
    this.config = {
      schedules: {
        daily: process.env.DAILY_BACKUP_SCHEDULE || '0 2 * * *',     // 2 AM daily
        weekly: process.env.WEEKLY_BACKUP_SCHEDULE || '0 3 * * 0',   // 3 AM Sundays
        monthly: process.env.MONTHLY_BACKUP_SCHEDULE || '0 4 1 * *'  // 4 AM 1st of month
      },
      notifications: {
        enabled: process.env.BACKUP_NOTIFICATIONS === 'true',
        email: process.env.BACKUP_NOTIFICATION_EMAIL,
        webhook: process.env.BACKUP_NOTIFICATION_WEBHOOK
      }
    };
  }

  /**
   * Start all backup schedules
   */
  async startScheduler() {
    console.log('🕐 Starting backup scheduler...');

    try {
      // Start health monitoring
      await this.healthMonitor.startMonitoring();

      // Schedule daily backups
      this.scheduleBackup('daily', this.config.schedules.daily);
      
      // Schedule weekly backups
      this.scheduleBackup('weekly', this.config.schedules.weekly);
      
      // Schedule monthly backups
      this.scheduleBackup('monthly', this.config.schedules.monthly);

      // Schedule cleanup (daily at 1 AM)
      this.scheduleCleanup();

      console.log('✅ Backup scheduler started successfully');
      console.log('📅 Scheduled backups:');
      console.log(`   Daily: ${this.config.schedules.daily}`);
      console.log(`   Weekly: ${this.config.schedules.weekly}`);
      console.log(`   Monthly: ${this.config.schedules.monthly}`);

      // Keep the process alive
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());

    } catch (error) {
      console.error('❌ Failed to start backup scheduler:', error);
      process.exit(1);
    }
  }

  /**
   * Schedule a backup type
   * @param {string} type - Backup type (daily, weekly, monthly)
   * @param {string} schedule - Cron schedule expression
   */
  scheduleBackup(type, schedule) {
    const job = cron.schedule(schedule, async () => {
      await this.executeScheduledBackup(type);
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'America/New_York'
    });

    this.scheduledJobs.set(type, job);
    job.start();

    console.log(`📅 Scheduled ${type} backup: ${schedule}`);
  }

  /**
   * Schedule cleanup job
   */
  scheduleCleanup() {
    const cleanupSchedule = process.env.CLEANUP_SCHEDULE || '0 1 * * *'; // 1 AM daily
    
    const job = cron.schedule(cleanupSchedule, async () => {
      await this.executeCleanup();
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'America/New_York'
    });

    this.scheduledJobs.set('cleanup', job);
    job.start();

    console.log(`🧹 Scheduled cleanup: ${cleanupSchedule}`);
  }

  /**
   * Execute a scheduled backup
   * @param {string} type - Backup type
   */
  async executeScheduledBackup(type) {
    console.log(`\n🔄 Starting scheduled ${type} backup...`);
    
    const startTime = Date.now();
    
    try {
      // Check system health before backup
      const healthCheck = await this.performPreBackupHealthCheck();
      
      if (!healthCheck.healthy) {
        throw new Error(`System health check failed: ${healthCheck.issues.join(', ')}`);
      }

      // Execute backup
      const result = await this.backupService.createFullBackup(type, {
        includeSchema: true,
        includeData: true
      });

      const duration = Date.now() - startTime;

      console.log(`✅ Scheduled ${type} backup completed successfully`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   File: ${result.name}`);
      console.log(`   Size: ${this.backupService.formatBytes(result.size)}`);

      // Send success notification
      await this.sendNotification('backup_success', {
        type,
        result,
        duration,
        timestamp: new Date()
      });

      // Update health metrics
      this.healthMonitor.emit('backup_completed', {
        type,
        success: true,
        duration,
        size: result.size
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ Scheduled ${type} backup failed:`, error);

      // Send failure notification
      await this.sendNotification('backup_failure', {
        type,
        error: error.message,
        duration,
        timestamp: new Date()
      });

      // Update health metrics
      this.healthMonitor.emit('backup_failed', {
        type,
        error: error.message,
        duration
      });

      // Generate health alert
      this.healthMonitor.generateAlert('backup_failed', {
        type,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Execute cleanup job
   */
  async executeCleanup() {
    console.log('\n🧹 Starting scheduled cleanup...');
    
    try {
      const result = await this.backupService.cleanupOldBackups();
      
      console.log(`✅ Cleanup completed: ${result.deletedCount} old backups removed`);

      if (result.deletedCount > 0) {
        await this.sendNotification('cleanup_completed', {
          deletedCount: result.deletedCount,
          remaining: result.remaining,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      
      await this.sendNotification('cleanup_failed', {
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Perform pre-backup health check
   * @returns {Object} Health check result
   */
  async performPreBackupHealthCheck() {
    const issues = [];
    
    try {
      // Check available disk space
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('df -h .');
      const lines = stdout.trim().split('\n');
      
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        const usage = parseInt(parts[4].replace('%', ''));
        
        if (usage > 90) {
          issues.push(`High disk usage: ${usage}%`);
        }
      }

      // Check database connectivity
      const dbHealth = await this.healthMonitor.checkDatabaseHealth();
      if (dbHealth.status !== 'healthy') {
        issues.push(`Database unhealthy: ${dbHealth.error}`);
      }

      // Check if backup directory is writable
      const fs = require('fs').promises;
      const path = require('path');
      const testFile = path.join(this.backupService.config.backupDir, '.write_test');
      
      try {
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
      } catch (error) {
        issues.push(`Backup directory not writable: ${error.message}`);
      }

      return {
        healthy: issues.length === 0,
        issues,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        healthy: false,
        issues: [`Health check failed: ${error.message}`],
        timestamp: new Date()
      };
    }
  }

  /**
   * Send notification about backup events
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  async sendNotification(type, data) {
    if (!this.config.notifications.enabled) {
      return;
    }

    const notification = {
      type,
      data,
      timestamp: new Date(),
      system: 'PharmaTraK Backup System'
    };

    console.log(`📧 Sending ${type} notification...`);

    try {
      // Email notification (if configured)
      if (this.config.notifications.email) {
        await this.sendEmailNotification(notification);
      }

      // Webhook notification (if configured)
      if (this.config.notifications.webhook) {
        await this.sendWebhookNotification(notification);
      }

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
    }
  }

  /**
   * Send email notification
   * @param {Object} notification - Notification data
   */
  async sendEmailNotification(notification) {
    // Email implementation would go here
    // For now, just log the notification
    console.log('📧 Email notification (placeholder):', notification);
  }

  /**
   * Send webhook notification
   * @param {Object} notification - Notification data
   */
  async sendWebhookNotification(notification) {
    try {
      const response = await fetch(this.config.notifications.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      console.log('✅ Webhook notification sent successfully');

    } catch (error) {
      console.error('❌ Webhook notification failed:', error);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  async shutdown() {
    console.log('\n🛑 Shutting down backup scheduler...');

    // Stop all scheduled jobs
    for (const [name, job] of this.scheduledJobs) {
      job.destroy();
      console.log(`   Stopped ${name} schedule`);
    }

    // Stop health monitoring
    this.healthMonitor.stopMonitoring();

    console.log('✅ Backup scheduler stopped');
    process.exit(0);
  }

  /**
   * Get scheduler status
   * @returns {Object} Status information
   */
  getStatus() {
    const jobs = {};
    
    for (const [name, job] of this.scheduledJobs) {
      jobs[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }

    return {
      service: 'BackupScheduler',
      version: '1.0.0',
      config: this.config,
      jobs,
      healthMonitoring: this.healthMonitor.isRunning,
      timestamp: new Date()
    };
  }
}

// CLI interface
program
  .version('1.0.0')
  .description('PharmaTraK Backup Scheduler');

program
  .command('start')
  .description('Start the backup scheduler')
  .action(async () => {
    const scheduler = new BackupScheduler();
    await scheduler.startScheduler();
  });

program
  .command('manual')
  .description('Perform manual backup')
  .option('-t, --type <type>', 'Backup type (daily|weekly|monthly)', 'manual')
  .action(async (options) => {
    const scheduler = new BackupScheduler();
    await scheduler.executeScheduledBackup(options.type);
    process.exit(0);
  });

program
  .command('cleanup')
  .description('Clean up old backups')
  .action(async () => {
    const scheduler = new BackupScheduler();
    await scheduler.executeCleanup();
    process.exit(0);
  });

program
  .command('status')
  .description('Show scheduler status')
  .action(async () => {
    const scheduler = new BackupScheduler();
    const status = scheduler.getStatus();
    console.log(JSON.stringify(status, null, 2));
    process.exit(0);
  });

program
  .command('test-health')
  .description('Test system health check')
  .action(async () => {
    const scheduler = new BackupScheduler();
    const health = await scheduler.performPreBackupHealthCheck();
    console.log('Health Check Result:', JSON.stringify(health, null, 2));
    process.exit(0);
  });

if (require.main === module) {
  program.parse(process.argv);
}

module.exports = BackupScheduler;