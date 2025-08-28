const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const mailController = require('./controllers/mailController');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// =================== SECURITY =================== //
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173', /\.onrender\.com$/],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// =================== MIDDLEWARE =================== //
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =================== ROUTES =================== //

// Homepage route
app.get("/", (req, res) => {
  res.send(`
    <h1>🚀 Mail Service is Live!</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/health">/health</a> → Service health check</li>
      <li><a href="/docs">/docs</a> → API Documentation</li>
      <li>/api → Mail service routes</li>
    </ul>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mail Service'
  });
});

// Docs endpoint
app.get('/docs', (req, res) => {
  res.json({
    service: "Mail Service API",
    endpoints: {
      "/": "Homepage (HTML)",
      "/health": "Health check",
      "/docs": "API documentation (this route)",
      "/api": "Mail service routes"
    }
  });
});

// Mail routes
app.use('/api', mailController);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// =================== START SERVER =================== //
app.listen(PORT, () => {
  logger.info(`Mail service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  console.log("✅ EMAIL_USER:", process.env.EMAIL_USER);
});
