#!/usr/bin/env node

/**
 * Backup CLI Tool
 * 
 * Command-line interface for backup and disaster recovery operations.
 * Provides easy access to backup creation, listing, cleanup, and health monitoring.
 * 
 * Usage:
 *   node scripts/backup-cli.js backup create --type manual
 *   node scripts/backup-cli.js backup list
 *   node scripts/backup-cli.js backup cleanup
 *   node scripts/backup-cli.js health status
 *   node scripts/backup-cli.js health alerts
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

require('dotenv').config();
const { program } = require('commander');
const BackupService = require('../services/backupService');
const HealthMonitor = require('../services/healthMonitor');

// Initialize services
const backupService = new BackupService();
const healthMonitor = new HealthMonitor();

program
  .version('1.0.0')
  .description('PharmaTraK Backup & Health CLI');

// Backup commands
const backup = program.command('backup');

backup
  .command('create')
  .description('Create a database backup')
  .option('-t, --type <type>', 'Backup type (manual|daily|weekly|monthly)', 'manual')
  .option('--no-compression', 'Disable compression')
  .option('--tables <tables>', 'Specific tables to backup (comma-separated)')
  .option('--exclude <tables>', 'Tables to exclude (comma-separated)')
  .action(async (options) => {
    try {
      console.log(`🔄 Creating ${options.type} backup...`);
      
      const backupOptions = {};
      if (options.tables) {
        backupOptions.tables = options.tables.split(',').map(t => t.trim());
      }
      if (options.exclude) {
        backupOptions.excludeTables = options.exclude.split(',').map(t => t.trim());
      }

      const result = await backupService.createFullBackup(options.type, backupOptions);
      
      console.log('✅ Backup created successfully!');
      console.log(`   Name: ${result.name}`);
      console.log(`   Size: ${backupService.formatBytes(result.size)}`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Path: ${result.path}`);
      console.log(`   Checksum: ${result.checksum}`);
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    }
  });

backup
  .command('list')
  .description('List available backups')
  .option('-t, --type <type>', 'Filter by backup type')
  .option('-l, --limit <limit>', 'Limit number of results', '20')
  .action(async (options) => {
    try {
      let backups = await backupService.listBackups();
      
      if (options.type) {
        backups = backups.filter(backup => backup.type === options.type);
      }
      
      backups = backups.slice(0, parseInt(options.limit));
      
      if (backups.length === 0) {
        console.log('No backups found.');
        return;
      }
      
      console.log(`📋 Found ${backups.length} backup(s):\n`);
      
      backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.name}`);
        console.log(`   Type: ${backup.type}`);
        console.log(`   Size: ${backupService.formatBytes(backup.size)}`);
        console.log(`   Date: ${new Date(backup.timestamp).toLocaleString()}`);
        console.log(`   Duration: ${backup.duration}ms`);
        console.log(`   Compressed: ${backup.compressed ? 'Yes' : 'No'}`);
        console.log(`   Encrypted: ${backup.encrypted ? 'Yes' : 'No'}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      process.exit(1);
    }
  });

backup
  .command('cleanup')
  .description('Clean up old backups')
  .action(async () => {
    try {
      console.log('🧹 Cleaning up old backups...');
      
      const result = await backupService.cleanupOldBackups();
      
      console.log(`✅ Cleanup completed!`);
      console.log(`   Deleted: ${result.deletedCount} old backups`);
      console.log(`   Remaining: ${result.remaining} backups`);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  });

backup
  .command('export')
  .description('Export specific data')
  .requiredOption('-t, --tables <tables>', 'Tables to export (comma-separated)')
  .option('-f, --format <format>', 'Export format (sql|json)', 'sql')
  .option('--no-schema', 'Exclude table schemas')
  .option('--no-data', 'Exclude table data')
  .action(async (options) => {
    try {
      const tables = options.tables.split(',').map(t => t.trim());
      
      console.log(`📤 Exporting tables: ${tables.join(', ')}`);
      
      const result = await backupService.exportData({
        tables,
        format: options.format,
        includeSchema: options.schema,
        includeData: options.data
      });
      
      console.log('✅ Export completed!');
      console.log(`   Name: ${result.name}`);
      console.log(`   Size: ${backupService.formatBytes(result.size)}`);
      console.log(`   Format: ${result.format}`);
      console.log(`   Path: ${result.path}`);
      
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      process.exit(1);
    }
  });

backup
  .command('status')
  .description('Show backup service status')
  .action(async () => {
    try {
      const status = backupService.getStatus();
      
      console.log('🔧 Backup Service Status:');
      console.log(`   Service: ${status.service} v${status.version}`);
      console.log(`   Backup Directory: ${status.config.backupDir}`);
      console.log(`   Retention Days: ${status.config.retentionDays}`);
      console.log(`   Compression: ${status.config.compression ? 'Enabled' : 'Disabled'}`);
      console.log(`   Encryption: ${status.config.encryption ? 'Enabled' : 'Disabled'}`);
      console.log(`   Max Backup Size: ${status.config.maxBackupSize}`);
      console.log(`   Last Check: ${status.timestamp}`);
      
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      process.exit(1);
    }
  });

// Health commands
const health = program.command('health');

health
  .command('status')
  .description('Show current system health')
  .action(async () => {
    try {
      // Start monitoring if not already running
      if (!healthMonitor.isRunning) {
        await healthMonitor.startMonitoring();
        // Wait a moment for initial metrics
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const health = healthMonitor.getCurrentHealth();
      
      console.log('🏥 System Health Status:\n');
      
      // System metrics
      if (health.system.cpu) {
        console.log(`💻 System Resources:`);
        console.log(`   CPU Usage: ${health.system.cpu.usage?.toFixed(1)}%`);
        console.log(`   Memory Usage: ${health.system.memory.usage?.toFixed(1)}%`);
        console.log(`   Disk Usage: ${health.system.disk.usage?.toFixed(1)}%`);
      }
      
      // Database health
      console.log(`\n🗄️ Database:`);
      console.log(`   Status: ${health.database.status}`);
      if (health.database.connectionTime) {
        console.log(`   Connection Time: ${health.database.connectionTime.time?.toFixed(1)}ms`);
      }
      
      // API health
      if (health.api.responseTime) {
        console.log(`\n🌐 API:`);
        console.log(`   Response Time: ${health.api.responseTime.time?.toFixed(1)}ms`);
      }
      
      // Alerts
      if (health.alerts && health.alerts.length > 0) {
        console.log(`\n🚨 Active Alerts (${health.alerts.length}):`);
        health.alerts.slice(0, 5).forEach((alert, index) => {
          const severity = alert.severity.toUpperCase();
          const emoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
          console.log(`   ${emoji} ${severity}: ${alert.type}`);
          console.log(`      Time: ${new Date(alert.timestamp).toLocaleString()}`);
          console.log(`      Acknowledged: ${alert.acknowledged ? 'Yes' : 'No'}`);
        });
        
        if (health.alerts.length > 5) {
          console.log(`   ... and ${health.alerts.length - 5} more alerts`);
        }
      } else {
        console.log(`\n✅ No active alerts`);
      }
      
      console.log(`\n⏱️ Monitoring: ${health.isMonitoring ? 'Active' : 'Inactive'}`);
      console.log(`🕐 Uptime: ${(health.uptime / 3600).toFixed(1)} hours`);
      
      // Stop monitoring if we started it
      if (healthMonitor.isRunning) {
        healthMonitor.stopMonitoring();
      }
      
    } catch (error) {
      console.error('❌ Failed to get health status:', error.message);
      process.exit(1);
    }
  });

health
  .command('alerts')
  .description('Show health alerts')
  .option('-s, --severity <severity>', 'Filter by severity (info|warning|critical)')
  .option('-a, --acknowledged', 'Show only acknowledged alerts')
  .option('-u, --unacknowledged', 'Show only unacknowledged alerts')
  .option('-l, --limit <limit>', 'Limit number of results', '10')
  .action(async (options) => {
    try {
      if (!healthMonitor.isRunning) {
        await healthMonitor.startMonitoring();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      let alerts = healthMonitor.metrics.alerts;
      
      // Apply filters
      if (options.severity) {
        alerts = alerts.filter(alert => alert.severity === options.severity);
      }
      
      if (options.acknowledged) {
        alerts = alerts.filter(alert => alert.acknowledged);
      } else if (options.unacknowledged) {
        alerts = alerts.filter(alert => !alert.acknowledged);
      }
      
      alerts = alerts.slice(0, parseInt(options.limit));
      
      if (alerts.length === 0) {
        console.log('No alerts found matching criteria.');
        return;
      }
      
      console.log(`🚨 Found ${alerts.length} alert(s):\n`);
      
      alerts.forEach((alert, index) => {
        const severity = alert.severity.toUpperCase();
        const emoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
        
        console.log(`${index + 1}. ${emoji} ${severity}: ${alert.type}`);
        console.log(`   ID: ${alert.id}`);
        console.log(`   Time: ${new Date(alert.timestamp).toLocaleString()}`);
        console.log(`   Acknowledged: ${alert.acknowledged ? 'Yes' : 'No'}`);
        
        if (alert.data) {
          console.log(`   Details: ${JSON.stringify(alert.data, null, 4)}`);
        }
        
        console.log('');
      });
      
      healthMonitor.stopMonitoring();
      
    } catch (error) {
      console.error('❌ Failed to get alerts:', error.message);
      process.exit(1);
    }
  });

health
  .command('monitor')
  .description('Start continuous health monitoring')
  .option('-d, --duration <seconds>', 'Monitor for specified duration (0 = indefinite)', '0')
  .action(async (options) => {
    try {
      console.log('🏥 Starting health monitoring...');
      console.log('Press Ctrl+C to stop\n');
      
      await healthMonitor.startMonitoring();
      
      // Set up event listeners for real-time updates
      healthMonitor.on('alert_generated', (alert) => {
        const severity = alert.severity.toUpperCase();
        const emoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
        console.log(`${emoji} ALERT [${severity}]: ${alert.type}`);
        if (alert.data) {
          console.log(`   ${JSON.stringify(alert.data)}`);
        }
        console.log('');
      });
      
      healthMonitor.on('health_update', (health) => {
        // Print periodic health summary (every 5 minutes)
        const now = new Date();
        if (now.getMinutes() % 5 === 0 && now.getSeconds() === 0) {
          console.log(`📊 Health Summary (${now.toLocaleTimeString()}):`);
          console.log(`   CPU: ${health.system.cpu?.usage?.toFixed(1)}% | Memory: ${health.system.memory?.usage?.toFixed(1)}% | DB: ${health.database.connectionTime?.time?.toFixed(1)}ms`);
        }
      });
      
      // Handle duration limit
      if (parseInt(options.duration) > 0) {
        setTimeout(() => {
          console.log('\n⏰ Monitoring duration reached. Stopping...');
          healthMonitor.stopMonitoring();
          process.exit(0);
        }, parseInt(options.duration) * 1000);
      }
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping health monitoring...');
        healthMonitor.stopMonitoring();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error.message);
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

if (require.main === module) {
  program.parse(process.argv);
  
  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

module.exports = { backupService, healthMonitor };