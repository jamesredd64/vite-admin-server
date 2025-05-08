const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controllers/adminSettings.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Add request logging for debugging
router.use((req, res, next) => {
  console.log('🔧 Admin Settings Route:', {
    method: req.method,
    path: req.path,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    }
  });
  next();
});

// Apply authentication middleware first, then admin check
router.get('/settings', 
  requireAuth, // Authenticate first
  requireAdmin, // Then check admin status
  adminSettingsController.getAdminSettings
);

router.patch('/settings', 
  requireAuth,
  requireAdmin,
  adminSettingsController.updateAdminSettings
);

module.exports = router;


