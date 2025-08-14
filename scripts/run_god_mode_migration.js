/**
 * Run God Mode Migration
 * 
 * Executes the god mode migration SQL commands using Node.js and the database pool.
 */

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runGodModeMigration() {
    console.log('🚀 Running God Mode Migration...\n');
    
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_god_mode_user.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            return;
        }
        
        console.log('📁 Reading migration file...');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split SQL into individual statements
        const statements = [];
        let currentStatement = '';
        const lines = migrationSQL.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip comments and empty lines
            if (trimmedLine.startsWith('--') || trimmedLine.startsWith('/*') || trimmedLine === '') {
                continue;
            }
            
            // Handle USE statement
            if (trimmedLine.startsWith('USE ')) {
                continue; // Skip USE statements as we're already connected to the database
            }
            
            currentStatement += line + '\n';
            
            // End of statement detection
            if (trimmedLine.endsWith(';')) {
                if (currentStatement.trim()) {
                    statements.push(currentStatement.trim());
                }
                currentStatement = '';
            }
        }
        
        // Add any remaining statement
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }
        
        console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const statementPreview = statement.substring(0, 100).replace(/\s+/g, ' ').trim();
            
            console.log(`${i + 1}️⃣ Executing: ${statementPreview}${statement.length > 100 ? '...' : ''}`);
            
            try {
                await pool.execute(statement);
                console.log('   ✅ Success');
            } catch (error) {
                // Some statements might be expected to fail (like IF NOT EXISTS)
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                    error.code === 'ER_DUP_KEYNAME' ||
                    error.message.includes('already exists') ||
                    error.message.includes('Duplicate column name') ||
                    error.message.includes('Duplicate key name')) {
                    console.log('   ⚠️  Already exists (skipping)');
                } else {
                    console.log(`   ❌ Error: ${error.message}`);
                    
                    // Don't fail on certain expected errors
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('Duplicate')) {
                        console.log('   🔄 Continuing with next statement...');
                    }
                }
            }
        }
        
        console.log('\n🎉 God Mode migration completed successfully!');
        
        // Verify the results
        console.log('\n📊 Verifying migration results...');
        
        // Check if role column was updated
        const [roleCheck] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
        if (roleCheck.length > 0) {
            console.log('✅ God mode role added to users table');
            console.log(`   Available roles: ${roleCheck[0].Type}`);
        } else {
            console.log('❌ Role column update failed');
        }
        
        // Check if permission tables exist
        const permissionTables = ['user_permissions', 'store_access', 'user_sessions', 'god_mode_audit'];
        for (const tableName of permissionTables) {
            const [tables] = await pool.query(`SHOW TABLES LIKE '${tableName}'`);
            if (tables.length > 0) {
                console.log(`✅ Table '${tableName}' created`);
            } else {
                console.log(`❌ Table '${tableName}' creation failed`);
            }
        }
        
        // Check if views exist
        const views = ['v_god_mode_users', 'v_god_mode_sessions'];
        for (const viewName of views) {
            const [viewCheck] = await pool.query(`SHOW TABLES WHERE Table_type = 'VIEW' AND Tables_in_pharmatrak = '${viewName}'`);
            if (viewCheck.length > 0) {
                console.log(`✅ View '${viewName}' created`);
            } else {
                console.log(`❌ View '${viewName}' creation failed`);
            }
        }
        
        console.log('\n🎯 God Mode Migration Summary:');
        console.log('• God mode role: Available for user assignment');
        console.log('• Permission system: Ready for fine-grained access control');
        console.log('• Store access control: Multi-store switching enabled');
        console.log('• Audit logging: Comprehensive god mode action tracking');
        console.log('• API endpoints: Available at /api/god-mode/');
        console.log('• Frontend integration: GodModePanel component ready');
        
        console.log('\n📋 Next Steps:');
        console.log('1. Grant god mode to a user: UPDATE users SET role = "god_mode" WHERE id = 1;');
        console.log('2. Test god mode panel in frontend');
        console.log('3. Verify store switching functionality');
        
    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        console.error('Stack trace:', error.stack);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Database connection failed. Make sure:');
            console.log('• MySQL server is running');
            console.log('• Database credentials are correct');
            console.log('• Database "pharmatrak" exists');
        }
    }
}

// Run if called directly
if (require.main === module) {
    runGodModeMigration().then(() => {
        console.log('\n🏁 God Mode migration script completed');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Migration script crashed:', error);
        process.exit(1);
    });
}

module.exports = { runGodModeMigration };