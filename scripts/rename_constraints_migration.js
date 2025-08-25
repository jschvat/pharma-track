#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function renameConstraints() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'pharmatrak_user',
    password: process.env.DB_PASSWORD || 'pharmatrak_password',
    database: process.env.DB_NAME || 'pharmatrak'
  });

  console.log('🔄 Starting constraint renaming migration...\n');

  try {
    // Begin transaction for atomic operation
    await connection.beginTransaction();

    console.log('📋 Step 1: Renaming STORES table CHECK constraints...');
    
    // Drop old constraints and recreate with descriptive names
    const storeConstraints = [
      {
        old: 'stores_chk_1',
        new: 'chk_store_name_format',
        sql: `(CHAR_LENGTH(TRIM(\`name\`)) >= 2) AND REGEXP_LIKE(\`name\`, '^[a-zA-Z0-9\\\\s\\\\-\\'\\\\.,&]+$')`
      },
      {
        old: 'stores_chk_2', 
        new: 'chk_store_address_format',
        sql: `(CHAR_LENGTH(TRIM(\`address\`)) >= 5) AND REGEXP_LIKE(\`address\`, '^[a-zA-Z0-9\\\\s\\\\-\\'\\\\.,#]+$')`
      },
      {
        old: 'stores_chk_3',
        new: 'chk_store_state_valid_us',
        sql: `REGEXP_LIKE(\`state\`, '^[A-Z]{2}$') AND (\`state\` IN ('AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR','VI','GU','AS','MP'))`
      },
      {
        old: 'stores_chk_4',
        new: 'chk_store_zipcode_us_format',
        sql: `REGEXP_LIKE(\`zipcode\`, '^[0-9]{5}(-[0-9]{4})?$')`
      },
      {
        old: 'stores_chk_5',
        new: 'chk_store_phone_digits_only',
        sql: `REGEXP_LIKE(\`phone\`, '^[0-9]{10,11}$')`
      },
      {
        old: 'stores_chk_6',
        new: 'chk_store_fax_optional_valid',
        sql: `(\`fax\` IS NULL) OR REGEXP_LIKE(\`fax\`, '^[0-9]{10,11}$')`
      },
      {
        old: 'stores_chk_7',
        new: 'chk_store_dea_registration_format',
        sql: `REGEXP_LIKE(\`dea_registration_number\`, '^[A-Z]{2}[0-9]{7}$')`
      },
      {
        old: 'stores_chk_8',
        new: 'chk_store_npi_format',
        sql: `REGEXP_LIKE(\`npi\`, '^[0-9]{10}$')`
      }
    ];

    for (const constraint of storeConstraints) {
      console.log(`  🗑️  Dropping old constraint: ${constraint.old}`);
      await connection.execute(`ALTER TABLE stores DROP CHECK ${constraint.old}`);
      
      console.log(`  ✅ Adding new constraint: ${constraint.new}`);
      await connection.execute(`ALTER TABLE stores ADD CONSTRAINT ${constraint.new} CHECK (${constraint.sql})`);
    }

    console.log('\n📋 Step 2: Renaming USERS table CHECK constraints...');

    const userConstraints = [
      {
        old: 'users_chk_1',
        new: 'chk_user_name_min_length',
        sql: `CHAR_LENGTH(TRIM(\`name\`)) >= 2`
      },
      {
        old: 'users_chk_2',
        new: 'chk_user_email_valid_format',
        sql: `REGEXP_LIKE(\`email\`, '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$')`
      },
      {
        old: 'users_chk_3',
        new: 'chk_user_phone_digits_only',
        sql: `REGEXP_LIKE(\`phone\`, '^[0-9]{10,11}$')`
      },
      {
        old: 'users_chk_4',
        new: 'chk_user_password_hashed',
        sql: `CHAR_LENGTH(\`password\`) >= 60`
      },
      {
        old: 'users_chk_5',
        new: 'chk_user_address_min_length',
        sql: `CHAR_LENGTH(TRIM(\`address\`)) >= 5`
      }
    ];

    for (const constraint of userConstraints) {
      console.log(`  🗑️  Dropping old constraint: ${constraint.old}`);
      await connection.execute(`ALTER TABLE users DROP CHECK ${constraint.old}`);
      
      console.log(`  ✅ Adding new constraint: ${constraint.new}`);
      await connection.execute(`ALTER TABLE users ADD CONSTRAINT ${constraint.new} CHECK (${constraint.sql})`);
    }

    // Commit transaction
    await connection.commit();

    console.log('\n🎉 Constraint renaming migration completed successfully!');
    console.log('\n📋 New constraint names:');
    console.log('\nSTORES TABLE:');
    console.log('  • chk_store_name_format - Store name format validation');
    console.log('  • chk_store_address_format - Address format validation');
    console.log('  • chk_store_state_valid_us - US state code validation');
    console.log('  • chk_store_zipcode_us_format - ZIP code format validation');
    console.log('  • chk_store_phone_digits_only - Phone number digits validation');
    console.log('  • chk_store_fax_optional_valid - Optional fax validation');
    console.log('  • chk_store_dea_registration_format - DEA registration format');
    console.log('  • chk_store_npi_format - NPI format validation');
    console.log('\nUSERS TABLE:');
    console.log('  • chk_user_name_min_length - User name minimum length');
    console.log('  • chk_user_email_valid_format - Email format validation');
    console.log('  • chk_user_phone_digits_only - Phone digits validation');
    console.log('  • chk_user_password_hashed - Password hash length');
    console.log('  • chk_user_address_min_length - Address minimum length');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
if (require.main === module) {
  renameConstraints()
    .then(() => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = renameConstraints;