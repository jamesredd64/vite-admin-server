const mongoose = require("mongoose");
const AdminSettings = require('../models/adminSettings');

// Initialize default admin settings
const initializeDefaultSettings = async () => {
  console.log('Creating default admin settings...');
  const defaultSettings = new AdminSettings({
    roleBasedAccess: [{
      role: 'admin',
      permissions: {
        dashboard: {
          name: 'Dashboard Access',
          description: 'Access to main dashboard',
          access: { read: true, write: true, delete: false }
        },
        users: {
          name: 'User Management',
          description: 'Manage system users',
          access: { read: true, write: true, delete: true }
        },
        settings: {
          name: 'System Settings',
          description: 'Manage system configuration',
          access: { read: true, write: true, delete: true }
        }
      },
      features: ['dashboard', 'users', 'settings']
    }],
    emailTemplates: {
      invitation: 'Welcome to our platform! Click here to get started: {{inviteLink}}',
      reminder: 'Dont forget about your upcoming event: {{eventDetails}}',
      welcome: 'Thanks for joining! Here what you need to know: {{welcomeInfo}}'
    },
    security: {
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      passwordPolicy: {
        minLength: 8,
        requireSpecialChar: true,
        requireNumber: true,
        requireUppercase: true
      }
    },
    calendar: {
      showAllEvents: false,
      defaultView: 'week',
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    }
  });

  return defaultSettings;
};

// Get admin settings
exports.getAdminSettings = async (req, res) => {
  try {
    console.log('Searching for admin settings...');
    let settings = await AdminSettings.findOne().lean();
    
    if (!settings) {
      console.log('No settings found, initializing defaults...');
      const defaultSettings = await initializeDefaultSettings();
      settings = await defaultSettings.save();
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error in getAdminSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update specific section of admin settings
exports.updateAdminSettings = async (req, res) => {
  try {
    const { section, data } = req.body;
    
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await initializeDefaultSettings();
    }
    
    // Validate section exists in schema - using a more flexible approach
    const validSections = ['roleBasedAccess', 'emailTemplates', 'security', 'calendar'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section: ${section}. Valid sections are: ${validSections.join(', ')}`
      });
    }
    
    // Use dot notation for nested updates
    if (typeof data === 'object') {
      // Merge existing data with new data
      settings[section] = {
        ...settings[section].toObject(),
        ...data
      };
    } else {
      settings[section] = data;
    }

    const updatedSettings = await settings.save();

    res.status(200).json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Overwrite all admin settings
exports.overwriteAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error overwriting admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to overwrite admin settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


