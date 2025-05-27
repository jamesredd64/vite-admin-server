const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controllers/adminSettings.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const AdminSettings = require('../models/adminSettings');
const AdminSettingsModel = require('../models/adminSettings');

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

// router.put('/settings', requireAuth, requireAdmin, adminSettingsController.updateAdminSettings);

router.put('/settings/overwriteAll', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updatedSettings = req.body;
    console.log('Received overwrite settings:', updatedSettings);

    const result = await AdminSettingsModel.findOneAndUpdate({}, updatedSettings, { new: true, overwrite: true });

    if (!result) return res.status(404).json({ error: 'Settings not found' });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error overwriting settings:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});


module.exports = router;


