const mysql = require('mysql2/promise');

// Validate required environment variables for production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables for production:', missingVars.join(', '));
    process.exit(1);
  }
  
  // Warn about default/weak passwords
  if (process.env.DB_PASSWORD === '' || process.env.DB_PASSWORD === 'password') {
    console.error('WARNING: Using default or weak database password in production!');
    process.exit(1);
  }
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pharmatrak',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
  queueLimit: 0,
  // Security: Enable SSL for production environments
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    // ca: process.env.DB_SSL_CA, // Uncomment for custom CA
    // cert: process.env.DB_SSL_CERT, // Uncomment for client cert
    // key: process.env.DB_SSL_KEY // Uncomment for client key
  } : false,
  // Security: Additional connection security
  charset: 'utf8mb4',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };