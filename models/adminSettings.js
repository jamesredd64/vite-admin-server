const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  roleBasedAccess: [{
    role: {
      type: String,
      enum: ['admin', 'user', 'manager', 'super-admin'],
      required: true
    },
    permissions: {
      type: Object,  // Changed from Map to Object to match the actual data structure
      required: true,
      default: {}
    },
    features: [{
      type: String,
      required: true
    }]
  }],
  emailTemplates: {
    invitation: {
      type: String,
      required: true,
      default: 'Welcome to our platform! Click here to get started: {{inviteLink}}'
    },
    reminder: {
      type: String,
      required: true,
      default: 'Dont forget about your upcoming event: {{eventDetails}}'
    },
    welcome: {
      type: String,
      required: true,
      default: 'Thanks for joining! Heres what you need to know: {{welcomeInfo}}'
    }
  },
  security: {
    sessionTimeout: {
      type: Number,
      required: true,
      default: 3600
    },
    maxLoginAttempts: {
      type: Number,
      required: true,
      default: 5
    },
    passwordPolicy: {
      minLength: {
        type: Number,
        required: true,
        default: 8
      },
      requireSpecialChar: {
        type: Boolean,
        required: true,
        default: true
      },
      requireNumber: {
        type: Boolean,
        required: true,
        default: true
      },
      requireUppercase: {
        type: Boolean,
        required: true,
        default: true
      }
    }
  },
  calendar: {
    showAllEvents: {
      type: Boolean,
      required: true,
      default: false
    },
    defaultView: {
      type: String,
      required: true,
      default: 'week',
      enum: ['day', 'week', 'month']
    },
    workingHours: {
      start: {
        type: String,
        required: true,
        default: '09:00'
      },
      end: {
        type: String,
        required: true,
        default: '17:00'
      }
    }
  }
}, {
  timestamps: true,
  collection: 'adminsettings'
});

// Add index for better query performance
adminSettingsSchema.index({ createdAt: 1 });

// Instance method for permission checking
adminSettingsSchema.methods.hasPermission = function(role, permissionKey, accessType) {
  const roleConfig = this.roleBasedAccess.find(r => r.role === role);
  if (!roleConfig) return false;
  
  const permission = roleConfig.permissions[permissionKey];
  if (!permission) return false;
  
  return permission.access[accessType] === true;
};

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
module.exports = AdminSettings;



