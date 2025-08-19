#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigration() {
  console.log('📝 Running post-it notes table migration...\n');
  
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'pharmatrak_user',
      password: process.env.DB_PASSWORD || 'pharmatrak_password',
      database: process.env.DB_NAME || 'pharmatrak',
      multipleStatements: true
    });
    
    console.log('✅ Connected to database');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/create_post_it_notes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    console.log('🔄 Creating post_it_notes table...');
    await connection.execute(migrationSQL);
    
    // Add sample data
    console.log('📝 Adding sample notes...');
    await connection.execute(`
      INSERT IGNORE INTO post_it_notes (store_id, user_id, content, position_x, position_y, color, is_pinned) VALUES
      (1, 1, 'Welcome to PharmaTraK!\\n\\nThis is a pinned note that will always be visible to store users.\\n\\nDouble-click to edit, drag to move!', 320, 120, 'yellow', TRUE),
      (1, 1, 'Reminder: Weekly inventory count due Friday\\n\\n• Check refrigerated items\\n• Update expiration dates\\n• Submit report by 5 PM', 650, 150, 'orange', TRUE),
      (1, 1, 'New shipment arrived:\\n\\n• Amoxicillin 500mg\\n• Lisinopril 10mg\\n• Metformin 1000mg\\n\\nStore in appropriate sections', 320, 450, 'blue', FALSE)
    `);
    
    console.log('✅ Post-it notes table created successfully!');
    
    // Verify table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'post_it_notes'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Table verification passed');
      
      // Show table structure
      const [columns] = await connection.execute('DESCRIBE post_it_notes');
      console.log('\n📋 Table structure:');
      console.table(columns);
      
      // Check if sample data was inserted
      const [notes] = await connection.execute('SELECT COUNT(*) as count FROM post_it_notes');
      console.log(`\n📊 Sample notes inserted: ${notes[0].count}`);
      
      if (notes[0].count > 0) {
        const [sampleNotes] = await connection.execute(
          'SELECT id, content, color, is_pinned FROM post_it_notes LIMIT 3'
        );
        console.log('\n📝 Sample notes:');
        sampleNotes.forEach((note, index) => {
          console.log(`${index + 1}. [${note.color}] ${note.content.substring(0, 50)}... ${note.is_pinned ? '(PINNED)' : ''}`);
        });
      }
    } else {
      console.log('❌ Table verification failed');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;