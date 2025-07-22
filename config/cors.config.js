const cors = require('cors');

const allowedOrigins = [
  'https://vite-front-end.vercel.app',
  'https://admin-backend-eta.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'capacitor://localhost',
  'ionic://localhost',
  'https://www.showcase.education'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Handle no origin (e.g., mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin);
    const isDev = process.env.NODE_ENV !== 'production';

    if (isAllowed || isDev) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Origin',
    'Accept',
    'Cache-Control',
    'Pragma'
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = cors(corsOptions);
