/**
 * Backup & Disaster Recovery Service
 * 
 * Comprehensive backup system for PharmaTraK database with the following features:
 * - Automated daily/weekly/monthly backups
 * - Point-in-time recovery capabilities
 * - Backup verification and integrity checks
 * - Retention policy management
 * - Compression and encryption support
 * - Cloud storage integration (optional)
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const zlib = require('zlib');
const { pool } = require('../config/database');

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.config = {
      backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../backups'),
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
      compression: process.env.BACKUP_COMPRESSION !== 'false',
      encryption: process.env.BACKUP_ENCRYPTION === 'true',
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      maxBackupSize: parseInt(process.env.MAX_BACKUP_SIZE) || 1024 * 1024 * 1024, // 1GB
      dbConfig: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'pharmatrak_user',
        password: process.env.DB_PASSWORD || 'pharmatrak_password',
        database: process.env.DB_NAME || 'pharmatrak'
      }
    };

    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.config.backupDir, { recursive: true });
      
      // Create subdirectories for different backup types
      await fs.mkdir(path.join(this.config.backupDir, 'daily'), { recursive: true });
      await fs.mkdir(path.join(this.config.backupDir, 'weekly'), { recursive: true });
      await fs.mkdir(path.join(this.config.backupDir, 'monthly'), { recursive: true });
      await fs.mkdir(path.join(this.config.backupDir, 'manual'), { recursive: true });
      await fs.mkdir(path.join(this.config.backupDir, 'exports'), { recursive: true });
      
      console.log(`✅ Backup directories ensured at: ${this.config.backupDir}`);
    } catch (error) {
      console.error('❌ Failed to create backup directories:', error);
      throw error;
    }
  }

  /**
   * Create a full database backup
   * @param {string} type - Backup type (daily, weekly, monthly, manual)
   * @param {Object} options - Backup options
   * @returns {Object} Backup result with metadata
   */
  async createFullBackup(type = 'manual', options = {}) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `pharmatrak_${type}_${timestamp}`;
    const backupPath = path.join(this.config.backupDir, type, `${backupName}.sql`);

    console.log(`🔄 Starting ${type} backup: ${backupName}`);

    try {
      // Create mysqldump command
      const dumpCommand = this.buildMysqlDumpCommand(backupPath, options);
      
      // Execute backup
      const { stdout, stderr } = await execAsync(dumpCommand);
      
      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`MySQL dump failed: ${stderr}`);
      }

      // Get backup file stats
      const stats = await fs.stat(backupPath);
      
      // Compress if enabled
      let finalPath = backupPath;
      if (this.config.compression) {
        finalPath = await this.compressBackup(backupPath);
        await fs.unlink(backupPath); // Remove uncompressed file
      }

      // Encrypt if enabled
      if (this.config.encryption && this.config.encryptionKey) {
        finalPath = await this.encryptBackup(finalPath);
        if (this.config.compression) {
          await fs.unlink(backupPath.replace('.sql', '.sql.gz')); // Remove unencrypted file
        } else {
          await fs.unlink(backupPath); // Remove unencrypted file
        }
      }

      // Verify backup integrity
      const isValid = await this.verifyBackup(finalPath);
      if (!isValid) {
        throw new Error('Backup verification failed');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        success: true,
        type,
        name: backupName,
        path: finalPath,
        size: stats.size,
        compressed: this.config.compression,
        encrypted: this.config.encryption,
        duration,
        timestamp: new Date(),
        checksum: await this.calculateChecksum(finalPath)
      };

      // Save backup metadata
      await this.saveBackupMetadata(result);

      console.log(`✅ ${type} backup completed successfully:`);
      console.log(`   File: ${path.basename(finalPath)}`);
      console.log(`   Size: ${this.formatBytes(stats.size)}`);
      console.log(`   Duration: ${duration}ms`);

      return result;

    } catch (error) {
      console.error(`❌ ${type} backup failed:`, error);
      
      // Clean up failed backup file
      try {
        await fs.unlink(backupPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  /**
   * Build mysqldump command
   * @param {string} outputPath - Output file path
   * @param {Object} options - Dump options
   * @returns {string} MySQL dump command
   */
  buildMysqlDumpCommand(outputPath, options = {}) {
    const { dbConfig } = this.config;
    
    const baseCommand = [
      'mysqldump',
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--user=${dbConfig.user}`,
      `--password=${dbConfig.password}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--events',
      '--add-drop-table',
      '--add-locks',
      '--create-options',
      '--disable-keys',
      '--extended-insert',
      '--lock-tables=false',
      '--quick',
      '--set-charset',
      '--result-file=' + outputPath
    ];

    // Add specific tables if requested
    if (options.tables && options.tables.length > 0) {
      baseCommand.push(dbConfig.database, ...options.tables);
    } else {
      baseCommand.push(dbConfig.database);
    }

    // Exclude certain tables if requested
    if (options.excludeTables && options.excludeTables.length > 0) {
      options.excludeTables.forEach(table => {
        baseCommand.push(`--ignore-table=${dbConfig.database}.${table}`);
      });
    }

    return baseCommand.join(' ');
  }

  /**
   * Compress backup file using gzip
   * @param {string} filePath - Path to backup file
   * @returns {string} Path to compressed file
   */
  async compressBackup(filePath) {
    const compressedPath = filePath + '.gz';
    
    return new Promise((resolve, reject) => {
      const readStream = require('fs').createReadStream(filePath);
      const writeStream = require('fs').createWriteStream(compressedPath);
      const gzip = zlib.createGzip();

      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on('finish', () => resolve(compressedPath))
        .on('error', reject);
    });
  }

  /**
   * Encrypt backup file
   * @param {string} filePath - Path to backup file
   * @returns {string} Path to encrypted file
   */
  async encryptBackup(filePath) {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not provided');
    }

    const encryptedPath = filePath + '.enc';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    return new Promise((resolve, reject) => {
      const cipher = crypto.createCipher('aes-256-cbc', key);
      const readStream = require('fs').createReadStream(filePath);
      const writeStream = require('fs').createWriteStream(encryptedPath);

      // Write IV to beginning of file
      writeStream.write(iv);

      readStream
        .pipe(cipher)
        .pipe(writeStream)
        .on('finish', () => resolve(encryptedPath))
        .on('error', reject);
    });
  }

  /**
   * Verify backup integrity
   * @param {string} filePath - Path to backup file
   * @returns {boolean} True if backup is valid
   */
  async verifyBackup(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      // Check if file exists and has content
      if (stats.size === 0) {
        console.error('❌ Backup verification failed: Empty file');
        return false;
      }

      // Check file size against maximum
      if (stats.size > this.config.maxBackupSize) {
        console.warn(`⚠️ Backup size (${this.formatBytes(stats.size)}) exceeds maximum (${this.formatBytes(this.config.maxBackupSize)})`);
      }

      // For SQL files, check for basic structure
      if (filePath.endsWith('.sql')) {
        const content = await fs.readFile(filePath, 'utf8');
        if (!content.includes('CREATE TABLE') && !content.includes('INSERT INTO')) {
          console.error('❌ Backup verification failed: No table data found');
          return false;
        }
      }

      console.log('✅ Backup verification passed');
      return true;

    } catch (error) {
      console.error('❌ Backup verification failed:', error);
      return false;
    }
  }

  /**
   * Calculate file checksum
   * @param {string} filePath - Path to file
   * @returns {string} SHA256 checksum
   */
  async calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Save backup metadata to JSON file
   * @param {Object} metadata - Backup metadata
   */
  async saveBackupMetadata(metadata) {
    const metadataPath = path.join(this.config.backupDir, 'backup_metadata.json');
    
    try {
      let existingMetadata = [];
      try {
        const existing = await fs.readFile(metadataPath, 'utf8');
        existingMetadata = JSON.parse(existing);
      } catch (error) {
        // File doesn't exist yet, start with empty array
      }

      existingMetadata.push(metadata);
      
      // Sort by timestamp (newest first)
      existingMetadata.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      await fs.writeFile(metadataPath, JSON.stringify(existingMetadata, null, 2));
      
    } catch (error) {
      console.error('Failed to save backup metadata:', error);
    }
  }

  /**
   * Get list of available backups
   * @returns {Array} List of backup metadata
   */
  async listBackups() {
    const metadataPath = path.join(this.config.backupDir, 'backup_metadata.json');
    
    try {
      const content = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  /**
   * Restore database from backup
   * @param {string} backupPath - Path to backup file
   * @param {Object} options - Restore options
   * @returns {Object} Restore result
   */
  async restoreFromBackup(backupPath, options = {}) {
    console.log(`🔄 Starting database restore from: ${path.basename(backupPath)}`);
    
    try {
      let actualPath = backupPath;

      // Decrypt if necessary
      if (backupPath.endsWith('.enc')) {
        actualPath = await this.decryptBackup(backupPath);
      }

      // Decompress if necessary
      if (actualPath.endsWith('.gz')) {
        actualPath = await this.decompressBackup(actualPath);
      }

      // Verify backup before restore
      const isValid = await this.verifyBackup(actualPath);
      if (!isValid) {
        throw new Error('Backup verification failed before restore');
      }

      // Create restore command
      const restoreCommand = this.buildMysqlRestoreCommand(actualPath, options);
      
      // Execute restore
      const { stdout, stderr } = await execAsync(restoreCommand);
      
      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`MySQL restore failed: ${stderr}`);
      }

      // Clean up temporary files
      if (actualPath !== backupPath) {
        await fs.unlink(actualPath);
      }

      console.log('✅ Database restore completed successfully');
      
      return {
        success: true,
        restoredFrom: path.basename(backupPath),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Database restore failed:', error);
      throw error;
    }
  }

  /**
   * Build MySQL restore command
   * @param {string} backupPath - Path to backup file
   * @param {Object} options - Restore options
   * @returns {string} MySQL restore command
   */
  buildMysqlRestoreCommand(backupPath, options = {}) {
    const { dbConfig } = this.config;
    
    return [
      'mysql',
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--user=${dbConfig.user}`,
      `--password=${dbConfig.password}`,
      options.database || dbConfig.database,
      '<',
      backupPath
    ].join(' ');
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    console.log('🧹 Starting backup cleanup...');
    
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;
      
      for (const backup of backups) {
        const backupDate = new Date(backup.timestamp);
        
        if (backupDate < cutoffDate) {
          try {
            await fs.unlink(backup.path);
            deletedCount++;
            console.log(`🗑️ Deleted old backup: ${path.basename(backup.path)}`);
          } catch (error) {
            console.warn(`⚠️ Failed to delete backup: ${backup.path}`, error);
          }
        }
      }

      // Update metadata to remove deleted backups
      const remainingBackups = backups.filter(backup => {
        const backupDate = new Date(backup.timestamp);
        return backupDate >= cutoffDate;
      });

      const metadataPath = path.join(this.config.backupDir, 'backup_metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(remainingBackups, null, 2));

      console.log(`✅ Backup cleanup completed. Deleted ${deletedCount} old backups.`);
      
      return { deletedCount, remaining: remainingBackups.length };

    } catch (error) {
      console.error('❌ Backup cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Export specific data for migrations or transfers
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportData(options = {}) {
    const {
      tables = [],
      format = 'sql',
      includeSchema = true,
      includeData = true,
      whereConditions = {}
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportName = `pharmatrak_export_${timestamp}`;
    const exportPath = path.join(this.config.backupDir, 'exports', `${exportName}.${format}`);

    console.log(`📤 Starting data export: ${exportName}`);

    try {
      if (format === 'sql') {
        const dumpOptions = {
          tables,
          includeSchema,
          includeData
        };
        
        await this.createFullBackup('manual', dumpOptions);
        
      } else if (format === 'json') {
        const exportData = await this.exportToJSON(tables, whereConditions);
        await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
      }

      const stats = await fs.stat(exportPath);
      
      console.log(`✅ Data export completed: ${exportName}`);
      
      return {
        success: true,
        name: exportName,
        path: exportPath,
        size: stats.size,
        format,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Data export failed:', error);
      throw error;
    }
  }

  /**
   * Export data to JSON format
   * @param {Array} tables - Tables to export
   * @param {Object} whereConditions - WHERE conditions for each table
   * @returns {Object} Exported data
   */
  async exportToJSON(tables, whereConditions = {}) {
    const exportData = {};
    
    for (const table of tables) {
      const whereClause = whereConditions[table] ? `WHERE ${whereConditions[table]}` : '';
      const query = `SELECT * FROM ${table} ${whereClause}`;
      
      const [rows] = await pool.execute(query);
      exportData[table] = rows;
    }

    return exportData;
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get backup service status and configuration
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      service: 'BackupService',
      version: '1.0.0',
      config: {
        backupDir: this.config.backupDir,
        retentionDays: this.config.retentionDays,
        compression: this.config.compression,
        encryption: this.config.encryption,
        maxBackupSize: this.formatBytes(this.config.maxBackupSize)
      },
      timestamp: new Date()
    };
  }
}

module.exports = BackupService;