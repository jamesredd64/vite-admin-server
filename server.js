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
const emailRoutes = require('./routes/email.routes'); // Verify this import

const mongoose = require('mongoose');
const os = require('os');
const assetsRoutes = require('./routes/assets.routes');
const staticMiddleware = require('./middleware/static.middleware');
const VERSION = require('./config/version');
const { startEventInvitationScheduler } = require('./schedulers/autoEventInvitation');
const adminSettingsRoutes = require('./routes/admin.settings.routes');
const formRoutes = require('./routes/form.routes.js') 

// Helper function to get environment information
const getEnvironmentInfo = () => {
  const isVercel = process.env.VERCEL === '1';
  const environment = process.env.NODE_ENV || 'development';
  const region = process.env.VERCEL_REGION || 'N/A'; // Vercel specific region
  const gitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || 'N/A'; // Vercel specific git info

  return {
    environment,
    platform: isVercel ? 'Vercel' : 'Local Development',
    region: isVercel ? region : 'N/A', // Only show region if on Vercel
    git: isVercel ? { commit: gitCommitSha } : { commit: 'N/A' } // Only show git if on Vercel
  };
};


// Add this to your server startup code, after MongoDB connection is established
// startEventInvitationScheduler();

const app = express();

// Apply CORS configuration BEFORE other middleware
app.use(corsConfig);

// Handle OPTIONS preflight requests
app.options('*', corsConfig);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use('/images', staticMiddleware);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Security headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*;"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add this route before your other routes
app.get('/', (req, res) => {
  const buildDate = new Date(VERSION.buildDate).toLocaleDateString();
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Stagholme API Server</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" type="image/png" href="/favicon.png">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.5;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 90%;
            text-align: center;
          }
          h1 {
            margin: 0 0 1rem 0;
            color: #1a1a1a;
          }
          .info {
            margin: 1.5rem 0;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: left;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            margin: 0.5rem 0;
          }
          .label {
            color: #666;
          }
          .value {
            color: #1a1a1a;
            font-weight: 500;
          }
          .footer {
            margin-top: 2rem;
            font-size: 0.875rem;
            color: #666;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background: #1a1a1a;
              color: #e5e5e5;
            }
            .container {
              background: #2d2d2d;
            }
            h1 {
              color: #ffffff;
            }
            .info {
              background: #333333;
            }
            .label {
              color: #999;
            }
            .value {
              color: #ffffff;
            }
            .footer {
              color: #999;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Stagholme API Server</h1>
          
          <div class="info">
            <div class="info-item">
              <span class="label">Version</span>
              <span class="value">${VERSION.number}</span>
            </div>
            <div class="info-item">
              <span class="label">Environment</span>
              <span class="value">${VERSION.environment}</span>
            </div>
            <div class="info-item">
              <span class="label">Build Date</span>
              <span class="value">${buildDate}</span>
            </div>
            ${VERSION.isVercel ? `
            <div class="info-item">
              <span class="label">Platform</span>
              <span class="value">Vercel</span>
            </div>
            ` : ''}
            <div class="info-item">
              <span class="label">Status</span>
              <span class="value">Operational</span>
            </div>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Stagholme Inc. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  res.send(html);
});

// Add logging middleware for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString(); // Use local time instead of ISO
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
  
  // Log the response
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

// Routes
app.use('/api/users', userRoutes);
// Form endpoint
// app.use('/api/users/forms', formRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/email', emailRoutes); // This is correct
app.use('/api/admin', adminSettingsRoutes);
// app.use("/api/event-invitation", emailRoutes);
app.use('/api/email/event-invitation', emailRoutes); // This is correct
app.use("/api", scheduledEventsRoutes);
// app.use("/api/events", scheduledEventsRoutes);
app.get('/hello', (req, res) => {
  res.status(200).json({ message: 'Hello from the form API!' });
});




const { body, validationResult } = require('express-validator');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Something broke!',
    message: err.message
  });
});




const startServer = async () => {
  try {
    // Initialize static directories
    const publicDir = path.join(__dirname, 'public');
    const imagesDir = path.join(publicDir, 'images');
    
    // Ensure directories exist
    [publicDir, imagesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Connect to database
    await connectDB();
    console.log('Database connection established');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Static files served from: ${path.join(__dirname, 'public')}`);
      console.log(`Email service: ${process.env.EMAIL_FROM || 'Not configured'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start server
startServer();

// after MongoDB connection is established
startEventInvitationScheduler();

// Export the app for Vercel
module.exports = app;
