CREATE DATABASE IF NOT EXISTS pharmatrak;
USE pharmatrak;

CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (CHAR_LENGTH(TRIM(name)) >= 2 AND name REGEXP '^[a-zA-Z0-9\\s\\-\'\\.,&]+$'),
    address VARCHAR(500) NOT NULL CHECK (CHAR_LENGTH(TRIM(address)) >= 5 AND address REGEXP '^[a-zA-Z0-9\\s\\-\'\\.,#]+$'),
    state CHAR(2) NOT NULL CHECK (state REGEXP '^[A-Z]{2}$' AND state IN (
        'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
        'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
        'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR','VI','GU','AS','MP'
    )),
    zipcode VARCHAR(10) NOT NULL CHECK (zipcode REGEXP '^[0-9]{5}(-[0-9]{4})?$'),
    phone VARCHAR(11) NOT NULL CHECK (phone REGEXP '^[0-9]{10,11}$'),
    fax VARCHAR(11) CHECK (fax IS NULL OR fax REGEXP '^[0-9]{10,11}$'),
    dea_registration_number CHAR(9) UNIQUE NOT NULL CHECK (dea_registration_number REGEXP '^[A-Z]{2}[0-9]{7}$'),
    npi CHAR(10) UNIQUE NOT NULL CHECK (npi REGEXP '^[0-9]{10}$'),
    admin_user_id INT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (CHAR_LENGTH(TRIM(name)) >= 2 AND name REGEXP '^[a-zA-Z\\s\\-\'\\.,]+$'),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (
        email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' AND
        CHAR_LENGTH(email) <= 255 AND
        email NOT LIKE '%..%'
    ),
    phone VARCHAR(11) NOT NULL CHECK (phone REGEXP '^[0-9]{10,11}$'),
    password VARCHAR(255) NOT NULL CHECK (CHAR_LENGTH(password) >= 60), -- bcrypt hashes are 60 chars
    address VARCHAR(500) NOT NULL CHECK (CHAR_LENGTH(TRIM(address)) >= 5 AND address REGEXP '^[a-zA-Z0-9\\s\\-\'\\.,#]+$'),
    store_id INT NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

ALTER TABLE stores ADD FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_stores_dea ON stores(dea_registration_number);
CREATE INDEX idx_stores_npi ON stores(npi);