require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const userRoutes = require('./routes/users');
const drugRoutes = require('./routes/drugs');
const inventoryRoutes = require('./routes/inventory');
const auditLogRoutes = require('./routes/auditLog');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');
const { sanitizeAndTrim, checkDataIntegrity } = require('./middleware/dataVerification');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(limiter);
app.use(cors());

// Debug logging middleware to catch JSON parsing issues
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  
  // Log body for all requests to catch unexpected bodies on GET
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request body (unexpected for GET):', req.body);
  }
  
  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    console.log('🔍 Query params:', req.query);
  }
  
  next();
});

// JSON parsing with error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf;
      console.log('📥 Raw body length:', buf.length);
      console.log('📥 Raw body preview:', buf.toString().substring(0, 100));
    }
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(sanitizeAndTrim());
app.use(checkDataIntegrity());
app.use(sanitizeInput);

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/store-access', require('./routes/storeAccess'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Test database connection
  const { testConnection } = require('./config/database');
  await testConnection();
});