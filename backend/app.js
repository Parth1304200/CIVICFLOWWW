const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');

// ── Route imports ────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// ── Security middleware ──────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false })); // Set security HTTP headers

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://mcdcivicflow.netlify.app',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      // Allow any localhost / 127.0.0.1 origin in dev
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
      // Allow any Netlify or Render domain dynamically
      if (origin.endsWith('.netlify.app') || origin.endsWith('.onrender.com')) return callback(null, true);
      
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── Static Files ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data against NoSQL injection (Disabled due to Express 5 compatibility issue)
// app.use(mongoSanitize());

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const mongoose = require('mongoose');
  const dbMode = mongoose.connection.readyState === 1 ? 'atlas' : 'local_file';
  res.status(200).json({
    status: 'ok',
    dbMode,
    timestamp: new Date().toISOString()
  });
});

// ── API routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/complaints', complaintRoutes);

// ── Root endpoint ────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CivicFlow API is running successfully.'
  });
});

// ── 404 handler for undefined routes ─────────────────────
app.all('/{*path}', (req, _res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

// ── Global error handler ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
