#!/usr/bin/env node

/**
 * Automated Database Backup System
 * 
 * Provides automated MySQL database backups with compression,
 * rotation, verification, and restoration capabilities.
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const zlib = require('zlib');
const { promisify } = require('util');
const logger = require('../config/logger');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'pharmatrak_user',
  password: process.env.DB_PASSWORD || 'pharmatrak_password',
  database: process.env.DB_NAME || 'pharmatrak'
};

// Backup configuration
const backupConfig = {
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: {
    daily: 7,     // Keep 7 daily backups
    weekly: 4,    // Keep 4 weekly backups
    monthly: 12   // Keep 12 monthly backups
  },
  compression: true,
  verification: true
};

class DatabaseBackupSystem {
  constructor() {
    this.backupDir = backupConfig.backupDir;
    this.dbConfig = dbConfig;
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      // Create backup directories
      await fs.mkdir(this.backupDir, { recursive: true });
      await fs.mkdir(path.join(this.backupDir, 'daily'), { recursive: true });
      await fs.mkdir(path.join(this.backupDir, 'weekly'), { recursive: true });
      await fs.mkdir(path.join(this.backupDir, 'monthly'), { recursive: true });
      
      logger.info('Backup system initialized', {
        backupDir: this.backupDir,
        maxBackups: backupConfig.maxBackups
      });
      
    } catch (error) {
      logger.error('Failed to initialize backup system', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create database backup
   */
  async createBackup(type = 'daily') {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `pharmatrak_${type}_${timestamp}`;
    const backupPath = path.join(this.backupDir, type, `${backupName}.sql`);
    const compressedPath = `${backupPath}.gz`;

    try {
      logger.info('Starting database backup', {
        type,
        backupName,
        database: this.dbConfig.database
      });

      // Create mysqldump
      await this.executeMysqlDump(backupPath);
      
      // Get backup file stats
      const stats = await fs.stat(backupPath);
      logger.info('Database dump created', {
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        path: backupPath
      });

      // Compress backup if enabled
      let finalPath = backupPath;
      if (backupConfig.compression) {
        await this.compressFile(backupPath, compressedPath);
        
        // Remove uncompressed file
        await fs.unlink(backupPath);
        finalPath = compressedPath;
        
        const compressedStats = await fs.stat(compressedPath);
        const compressionRatio = ((stats.size - compressedStats.size) / stats.size * 100).toFixed(1);
        
        logger.info('Backup compressed', {
          originalSize: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          compressedSize: `${(compressedStats.size / 1024 / 1024).toFixed(2)} MB`,
          compressionRatio: `${compressionRatio}%`
        });
      }

      // Verify backup if enabled
      if (backupConfig.verification) {
        await this.verifyBackup(finalPath);
      }

      // Clean up old backups
      await this.cleanupOldBackups(type);

      const duration = Date.now() - startTime;
      logger.info('Backup completed successfully', {
        type,
        backupName,
        duration: `${duration}ms`,
        path: finalPath
      });

      return {
        success: true,
        backupPath: finalPath,
        backupName,
        duration,
        type
      };

    } catch (error) {
      logger.error('Backup failed', {
        type,
        backupName,
        error: error.message,
        stack: error.stack
      });
      
      // Clean up failed backup files
      try {
        await fs.unlink(backupPath).catch(() => {});
        await fs.unlink(compressedPath).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  /**
   * Execute mysqldump command
   */
  async executeMysqlDump(outputPath) {
    return new Promise((resolve, reject) => {
      const mysqldumpArgs = [
        '-h', this.dbConfig.host,
        '-u', this.dbConfig.user,
        `-p${this.dbConfig.password}`,
        '--single-transaction',
        '--routines',
        '--triggers',
        '--add-drop-table',
        '--extended-insert',
        '--quick',
        '--lock-tables=false',
        this.dbConfig.database
      ];

      const mysqldump = spawn('mysqldump', mysqldumpArgs);
      const writeStream = require('fs').createWriteStream(outputPath);

      mysqldump.stdout.pipe(writeStream);

      let errorOutput = '';
      mysqldump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      mysqldump.on('close', (code) => {
        writeStream.end();
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mysqldump failed with code ${code}: ${errorOutput}`));
        }
      });

      mysqldump.on('error', (error) => {
        writeStream.end();
        reject(error);
      });
    });
  }

  /**
   * Compress backup file
   */
  async compressFile(inputPath, outputPath) {
    const gzip = promisify(zlib.gzip);
    const data = await fs.readFile(inputPath);
    const compressed = await gzip(data);
    await fs.writeFile(outputPath, compressed);
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath) {
    try {
      let data;
      
      if (backupPath.endsWith('.gz')) {
        // Decompress and read first few lines
        const compressed = await fs.readFile(backupPath);
        const gunzip = promisify(zlib.gunzip);
        data = await gunzip(compressed);
      } else {
        data = await fs.readFile(backupPath);
      }

      const content = data.toString('utf8', 0, 1000); // Read first 1000 bytes
      
      // Check for MySQL dump header
      if (!content.includes('-- MySQL dump') && !content.includes('mysqldump')) {
        throw new Error('Backup file does not appear to be a valid MySQL dump');
      }

      // Check for database name
      if (!content.includes(this.dbConfig.database)) {
        logger.warn('Database name not found in backup header', {
          expected: this.dbConfig.database,
          backupPath
        });
      }

      logger.info('Backup verification passed', { backupPath });
      
    } catch (error) {
      logger.error('Backup verification failed', {
        backupPath,
        error: error.message
      });
      throw new Error(`Backup verification failed: ${error.message}`);
    }
  }

  /**
   * Clean up old backups according to retention policy
   */
  async cleanupOldBackups(type) {
    try {
      const backupTypeDir = path.join(this.backupDir, type);
      const files = await fs.readdir(backupTypeDir);
      
      // Filter and sort backup files
      const backupFiles = files
        .filter(file => file.startsWith('pharmatrak_') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
        .map(file => ({
          name: file,
          path: path.join(backupTypeDir, file),
          mtime: require('fs').statSync(path.join(backupTypeDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

      const maxBackups = backupConfig.maxBackups[type] || 7;
      
      if (backupFiles.length > maxBackups) {
        const filesToDelete = backupFiles.slice(maxBackups);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          logger.info('Old backup deleted', {
            type,
            file: file.name,
            age: Math.round((Date.now() - file.mtime) / (1000 * 60 * 60 * 24))
          });
        }
        
        logger.info('Backup cleanup completed', {
          type,
          kept: maxBackups,
          deleted: filesToDelete.length
        });
      }
      
    } catch (error) {
      logger.error('Backup cleanup failed', {
        type,
        error: error.message
      });
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    const backups = {};
    
    for (const type of ['daily', 'weekly', 'monthly']) {
      try {
        const typeDir = path.join(this.backupDir, type);
        const files = await fs.readdir(typeDir);
        
        backups[type] = [];
        
        for (const file of files) {
          if (file.startsWith('pharmatrak_') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
            const filePath = path.join(typeDir, file);
            const stats = await fs.stat(filePath);
            
            backups[type].push({
              name: file,
              path: filePath,
              size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
              created: stats.mtime.toISOString(),
              compressed: file.endsWith('.gz')
            });
          }
        }
        
        // Sort by creation time, newest first
        backups[type].sort((a, b) => new Date(b.created) - new Date(a.created));
        
      } catch (error) {
        logger.error(`Failed to list ${type} backups`, { error: error.message });
        backups[type] = [];
      }
    }
    
    return backups;
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath) {
    const startTime = Date.now();
    
    try {
      logger.warn('Starting database restoration', {
        backupPath,
        database: this.dbConfig.database,
        warning: 'This will overwrite the current database!'
      });

      // Verify backup exists
      await fs.access(backupPath);
      
      // Read backup data
      let sqlData;
      if (backupPath.endsWith('.gz')) {
        const compressed = await fs.readFile(backupPath);
        const gunzip = promisify(zlib.gunzip);
        sqlData = await gunzip(compressed);
      } else {
        sqlData = await fs.readFile(backupPath);
      }

      // Execute restoration
      const connection = await mysql.createConnection({
        host: this.dbConfig.host,
        user: this.dbConfig.user,
        password: this.dbConfig.password,
        database: this.dbConfig.database,
        multipleStatements: true
      });

      await connection.execute(sqlData.toString());
      await connection.end();

      const duration = Date.now() - startTime;
      logger.info('Database restoration completed', {
        backupPath,
        duration: `${duration}ms`,
        database: this.dbConfig.database
      });

      return { success: true, duration };

    } catch (error) {
      logger.error('Database restoration failed', {
        backupPath,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const backup = new DatabaseBackupSystem();
  
  try {
    await backup.initialize();
    
    switch (command) {
      case 'create':
        const type = process.argv[3] || 'daily';
        const result = await backup.createBackup(type);
        console.log('✅ Backup created successfully:', result.backupPath);
        break;
        
      case 'list':
        const backups = await backup.listBackups();
        console.log('📁 Available backups:');
        console.log(JSON.stringify(backups, null, 2));
        break;
        
      case 'restore':
        const backupPath = process.argv[3];
        if (!backupPath) {
          console.error('❌ Backup path required for restore');
          process.exit(1);
        }
        await backup.restoreBackup(backupPath);
        console.log('✅ Database restored successfully');
        break;
        
      default:
        console.log(`
Database Backup System

Usage:
  node backup-system.js create [daily|weekly|monthly]  - Create a backup
  node backup-system.js list                           - List available backups
  node backup-system.js restore <backup-path>          - Restore from backup

Examples:
  node backup-system.js create daily
  node backup-system.js restore ./backups/daily/pharmatrak_daily_2023-12-01.sql.gz
        `);
    }
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = DatabaseBackupSystem;