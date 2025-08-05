-- Migration script to update existing database to new schema with validation
-- IMPORTANT: Backup your database before running this migration!

USE pharmatrak;

-- Step 1: Create backup tables
CREATE TABLE stores_backup AS SELECT * FROM stores;
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: Drop existing foreign key constraints
ALTER TABLE stores DROP FOREIGN KEY IF EXISTS stores_ibfk_1;
ALTER TABLE users DROP FOREIGN KEY IF EXISTS users_ibfk_1;

-- Step 3: Update stores table structure
-- First, add new columns if they don't exist (for location->address migration)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address VARCHAR(500) AFTER name;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS state CHAR(2) AFTER address;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS zipcode VARCHAR(10) AFTER state;

-- Migrate location data to address field if needed
-- UPDATE stores SET address = location WHERE address IS NULL OR address = '';
-- UPDATE stores SET state = 'CA', zipcode = '90210' WHERE state IS NULL; -- Set default values

-- Drop location column if it exists
ALTER TABLE stores DROP COLUMN IF EXISTS location;

-- Update field types and add constraints
ALTER TABLE stores 
MODIFY COLUMN name VARCHAR(100) NOT NULL,
MODIFY COLUMN address VARCHAR(500) NOT NULL,
MODIFY COLUMN state CHAR(2) NOT NULL,
MODIFY COLUMN zipcode VARCHAR(10) NOT NULL,
MODIFY COLUMN phone VARCHAR(11) NOT NULL,
MODIFY COLUMN fax VARCHAR(11),
MODIFY COLUMN dea_registration_number CHAR(9) NOT NULL,
MODIFY COLUMN npi CHAR(10) NOT NULL;

-- Step 4: Update users table structure
ALTER TABLE users 
MODIFY COLUMN name VARCHAR(100) NOT NULL,
MODIFY COLUMN phone VARCHAR(11) NOT NULL;

-- Step 5: Clean data to match new constraints
-- Clean phone numbers (remove non-digits)
UPDATE stores SET phone = REGEXP_REPLACE(phone, '[^0-9]', '') WHERE phone IS NOT NULL;
UPDATE stores SET fax = REGEXP_REPLACE(fax, '[^0-9]', '') WHERE fax IS NOT NULL AND fax != '';
UPDATE users SET phone = REGEXP_REPLACE(phone, '[^0-9]', '') WHERE phone IS NOT NULL;

-- Convert state to uppercase
UPDATE stores SET state = UPPER(state) WHERE state IS NOT NULL;

-- Clean names (remove extra spaces)
UPDATE stores SET name = TRIM(REGEXP_REPLACE(name, '\\s+', ' ')) WHERE name IS NOT NULL;
UPDATE users SET name = TRIM(REGEXP_REPLACE(name, '\\s+', ' ')) WHERE name IS NOT NULL;

-- Step 6: Add check constraints
ALTER TABLE stores 
ADD CONSTRAINT chk_stores_name CHECK (CHAR_LENGTH(TRIM(name)) >= 2 AND name REGEXP '^[a-zA-Z0-9\\s\\-\'\\.,&]+$'),
ADD CONSTRAINT chk_stores_address CHECK (CHAR_LENGTH(TRIM(address)) >= 5 AND address REGEXP '^[a-zA-Z0-9\\s\\-\'\\.,#]+$'),
ADD CONSTRAINT chk_stores_state CHECK (state REGEXP '^[A-Z]{2}$' AND state IN (
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR','VI','GU','AS','MP'
)),
ADD CONSTRAINT chk_stores_zipcode CHECK (zipcode REGEXP '^[0-9]{5}(-[0-9]{4})?$'),
ADD CONSTRAINT chk_stores_phone CHECK (phone REGEXP '^[0-9]{10,11}$'),
ADD CONSTRAINT chk_stores_fax CHECK (fax IS NULL OR fax REGEXP '^[0-9]{10,11}$'),
ADD CONSTRAINT chk_stores_dea CHECK (dea_registration_number REGEXP '^[A-Z]{2}[0-9]{7}$'),
ADD CONSTRAINT chk_stores_npi CHECK (npi REGEXP '^[0-9]{10}$');

ALTER TABLE users 
ADD CONSTRAINT chk_users_name CHECK (CHAR_LENGTH(TRIM(name)) >= 2 AND name REGEXP '^[a-zA-Z\\s\\-\'\\.,]+$'),
ADD CONSTRAINT chk_users_email CHECK (
    email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' AND
    CHAR_LENGTH(email) <= 255 AND
    email NOT LIKE '%..%'
),
ADD CONSTRAINT chk_users_phone CHECK (phone REGEXP '^[0-9]{10,11}$'),
ADD CONSTRAINT chk_users_password CHECK (CHAR_LENGTH(password) >= 60),
ADD CONSTRAINT chk_users_address CHECK (CHAR_LENGTH(TRIM(address)) >= 5 AND address REGEXP '^[a-zA-Z0-9\\s\\-\'\\.,#]+$');

-- Step 7: Recreate foreign key constraints
ALTER TABLE users ADD FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE stores ADD FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Step 8: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_dea ON stores(dea_registration_number);
CREATE INDEX IF NOT EXISTS idx_stores_npi ON stores(npi);

-- Step 9: Verify migration (optional)
-- SELECT 'Migration completed. Verify data integrity:' as status;
-- SELECT COUNT(*) as total_stores FROM stores;
-- SELECT COUNT(*) as total_users FROM users;

-- Note: If any data fails validation, you'll need to clean it manually before the constraints can be applied
-- Use the backup tables (stores_backup, users_backup) to recover if needed