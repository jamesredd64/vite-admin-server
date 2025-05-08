const AdminSettings = require('../models/adminSettings');

exports.getSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { section, data } = req.body;
    
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings({
        [section]: data
      });
    } else {
      settings[section] = { ...settings[section], ...data };
    }
    
    await settings.save();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateAllSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    
    await settings.save();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error updating all admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating all admin settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.generateAdminCode = async (req, res) => {
  try {
    const { email } = req.body;
    // Add your admin code generation logic here
    // For example, generate a random code and store it temporarily
    
    res.json({
      success: true,
      message: 'Admin code generated successfully'
    });
  } catch (error) {
    console.error('Error generating admin code:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating admin code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.verifyAdminCode = async (req, res) => {
  try {
    const { code } = req.body;
    // Add your admin code verification logic here
    
    res.json({
      success: true,
      message: 'Admin code verified successfully'
    });
  } catch (error) {
    console.error('Error verifying admin code:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};