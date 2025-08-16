#!/usr/bin/env node

/**
 * Run the inventory triggers migration
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runTriggersMigration() {
  try {
    console.log('🔧 Running inventory triggers migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/add_inventory_triggers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL statements (simple splitting by ';' outside of stored procedures)
    const statements = [];
    let currentStatement = '';
    let inDelimiter = false;
    
    const lines = migrationSQL.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine.startsWith('/*') || 
          trimmedLine.endsWith('*/') || trimmedLine === '') {
        continue;
      }
      
      // Handle DELIMITER changes
      if (trimmedLine.startsWith('DELIMITER')) {
        inDelimiter = trimmedLine.includes('//');
        continue;
      }
      
      currentStatement += line + '\n';
      
      // Check for statement end
      if (inDelimiter && trimmedLine.endsWith('//')) {
        // Remove the // delimiter from the statement before adding
        const cleanStatement = currentStatement.replace(/\/\/\s*$/, '').trim();
        statements.push(cleanStatement);
        currentStatement = '';
      } else if (!inDelimiter && trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`Executing: ${statement.substring(0, 60)}...`);
          await pool.query(statement);
          console.log('✅ Success');
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log('⚠️ Warning:', error.message);
          } else {
            console.error('❌ Error:', error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('\n✅ Inventory triggers migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runTriggersMigration().catch(console.error);
}

module.exports = { runTriggersMigration };