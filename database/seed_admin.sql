-- Seed script to create default admin store and user for testing
USE pharmatrak;

-- Create default admin store
INSERT INTO stores (
    name, 
    address, 
    state, 
    zipcode, 
    phone, 
    fax, 
    dea_registration_number, 
    npi
) VALUES (
    'PharmaTraK Demo Store',
    '123 Main Street',
    'CA',
    '90210',
    '5551234567',
    '5551234568',
    'AB1234567',
    '1234567890'
) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);

-- Get the store ID
SET @store_id = LAST_INSERT_ID();

-- Create default admin user with test credentials
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO users (
    name,
    email,
    phone,
    password,
    address,
    store_id,
    role,
    is_active
) VALUES (
    'Demo Admin',
    'admin@pharmatrak.com',
    '5551234567',
    '$2b$10$YourBcryptHashHere', -- This will be replaced by the actual hash
    '123 Admin Lane, Beverly Hills, CA',
    @store_id,
    'admin',
    TRUE
) ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    phone = VALUES(phone),
    address = VALUES(address),
    store_id = VALUES(store_id),
    role = VALUES(role),
    is_active = VALUES(is_active);

-- Update store admin_user_id to reference the admin user
UPDATE stores 
SET admin_user_id = (SELECT id FROM users WHERE email = 'admin@pharmatrak.com')
WHERE id = @store_id;

-- Display the created credentials
SELECT 
    'LOGIN CREDENTIALS FOR TESTING' as message,
    'admin@pharmatrak.com' as email,
    'Admin123!' as password,
    'Use these credentials to log into the frontend application' as note;