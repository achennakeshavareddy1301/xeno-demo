require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { scheduleSyncJobs } = require('./jobs/scheduler');

// Import routes
const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const analyticsRoutes = require('./routes/analytics');
const customersRoutes = require('./routes/customers');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const webhooksRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  credentials: true,
}));

// Raw body for webhook signature verification
app.use('/api/webhooks', express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  
  // Initialize scheduled sync jobs
  scheduleSyncJobs();
});

module.exports = app;
