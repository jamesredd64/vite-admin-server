const scheduledEventsRoutes = require("./routes/scheduledEventsRoutes");
const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./services/mongodb.js');
const corsConfig = require('./config/cors.config.js');
const userRoutes = require('./routes/user.routes.js');
const calendarRoutes = require('./routes/calendar.routes');
const notificationRoutes = require('./routes/notifications');
const emailRoutes = require('./routes/email.routes');
const assetsRoutes = require('./routes/assets.routes');
const staticMiddleware = require('./middleware/static.middleware');
const VERSION = require('./config/version');
const adminSettingsRoutes = require('./routes/admin.settings.routes');
const formRoutes = require('./routes/form.routes.js');
const registerTokenRoute = require('./routes/register-token');
const { startEventInvitationScheduler } = require('./schedulers/autoEventInvitation');
const { body, validationResult } = require('express-validator');

const app = express();

// Apply CORS configuration BEFORE other middleware
app.use(corsConfig);
app.options('*', corsConfig);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/images', staticMiddleware);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Security headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://*;");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Root endpoint (just for status display)
app.get('/', (req, res) => {
  const buildDate = new Date(VERSION.buildDate).toLocaleDateString();
  res.send(`API Server is running. Version: ${VERSION.number}. Build Date: ${buildDate}`);
});

// Debug logger
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString();
  console.log(`🔍 [${timestamp}] Incoming Request:`, {
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'authorization': req.headers['authorization'] ? '**Present**' : '**Not Present**'
    }
  });

  const originalSend = res.send;
  res.send = function (data) {
    console.log(`📤 [${timestamp}] Response:`, {
      statusCode: res.statusCode,
      data: data?.toString().substring(0, 200) + (data?.toString().length > 200 ? '...' : '')
    });
    return originalSend.apply(res, arguments);
  };

  next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/forms', registerTokenRoute);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminSettingsRoutes);
app.use('/api', scheduledEventsRoutes);

// Hello test route
app.get('/hello', (req, res) => {
  res.status(200).json({ message: 'Hello from the form API!' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something broke!', message: err.message });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found' });
});

// 🔁 Start the server only in local development
if (process.env.VERCEL !== '1') {
  const startServer = async () => {
    try {
      const publicDir = path.join(__dirname, 'public');
      const imagesDir = path.join(publicDir, 'images');

      [publicDir, imagesDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      await connectDB();
      console.log('Database connection established');

      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Local server running on port ${PORT}`);
        console.log(`Static files served from: ${publicDir}`);
        console.log(`Email service: ${process.env.EMAIL_FROM || 'Not configured'}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  };

  startServer();
}

// ✅ Export app for Vercel
module.exports = app;



