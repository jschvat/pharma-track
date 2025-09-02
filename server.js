require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const userRoutes = require('./routes/users');
const drugRoutes = require('./routes/drugs');
const drugTransactionalRoutes = require('./routes/drugsTransactional');
const inventoryRoutes = require('./routes/inventory');
const inventorySnapshotRoutes = require('./routes/inventorySnapshot');
const auditLogRoutes = require('./routes/auditLog');
const storeSettingsRoutes = require('./routes/storeSettings');
const reportsRoutes = require('./routes/reports');
const godModeRoutes = require('./routes/godMode');
const backupRoutes = require('./routes/backup');
const healthRoutes = require('./routes/health');
const postItNotesRoutes = require('./routes/postItNotes');
const dashboardRoutes = require('./routes/dashboard');
const drugShortagesRoutes = require('./routes/drugShortages');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');
const { sanitizeAndTrim, checkDataIntegrity } = require('./middleware/dataVerification');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting when behind React dev server proxy
app.set('trust proxy', 1);

// API Documentation setup
const { specs, swaggerUi, swaggerUiOptions } = require('./config/swagger');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000', 
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://localhost:3004',
    'http://127.0.0.1:3004'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token'
  ],
  exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Access-Token');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// CORS debugging middleware
app.use((req, res, next) => {
  console.log(`🌐 CORS: ${req.method} ${req.path} from origin: ${req.headers.origin || 'no-origin'}`);
  next();
});

// Conditional debug logging middleware (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    
    // Log query parameters (excluding sensitive data)
    if (Object.keys(req.query).length > 0) {
      const sanitizedQuery = { ...req.query };
      // Remove sensitive query parameters
      delete sanitizedQuery.password;
      delete sanitizedQuery.token;
      console.log('🔍 Query params:', sanitizedQuery);
    }
    
    next();
  });
}

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

// Middleware error catching
app.use((err, req, res, next) => {
  if (req.path.includes('/inventory/') && (req.path.includes('/expire') || req.path.includes('/return-to-stock'))) {
    console.log('❌ MIDDLEWARE ERROR for inventory operation:', err.message);
  }
  next(err);
});

app.use(express.urlencoded({ extended: true }));

app.use(sanitizeAndTrim());
app.use(checkDataIntegrity());
app.use(sanitizeInput);

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/drugs-tx', drugTransactionalRoutes); // Transaction-protected drug operations
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventory-snapshot', inventorySnapshotRoutes); // Real-time inventory with transaction safety
app.use('/api/audit', auditLogRoutes);
app.use('/api/store-access', require('./routes/storeAccess'));
app.use('/api/stores', storeSettingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/god-mode', godModeRoutes); // God mode super administrator routes
app.use('/api/backup', backupRoutes); // Backup and disaster recovery routes
app.use('/api/health', healthRoutes); // Health monitoring routes
app.use('/api/notes', postItNotesRoutes); // Post-it notes routes
app.use('/api/dashboard', dashboardRoutes); // Consolidated dashboard data routes
app.use('/api/drug-shortages', drugShortagesRoutes); // FDA Drug Shortages API routes
app.use('/api/debug', require('./routes/debug')); // Debug logging routes (development only)

// API Documentation endpoint
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// Redirect /docs to /api/docs for convenience
app.get('/docs', (req, res) => {
  res.redirect('/api/docs');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Test database connection
  const { testConnection } = require('./config/database');
  await testConnection();
});