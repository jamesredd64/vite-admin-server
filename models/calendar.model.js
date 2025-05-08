const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Accept any Auth0 ID format (auth0|, google-oauth2|, etc.)
        return v.includes('|');
      },
      message: props => `${props.value} must be a valid Auth0 ID`
    }
  },
  title: {
    type: String,
    required: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: true,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    required: true
  },
  isAllUsersInvited: {
    type: Boolean,
    default: false,
    required: true
  },
  extendedProps: {
    calendar: {
      type: String,
      required: true,
      enum: ['primary', 'success', 'danger', 'warning']
    },
    summary: {
      type: String,
      required: false
    },
    location: {
      type: String,
      required: false
    },
    attendees: {
      type: [{
        email: {
          type: String,
          required: true,
          validate: {
            validator: function(v) {
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address`
          }
        },
        name: {
          type: String,
          required: true
        }
      }],
      required: true,
      default: []
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Add index for auth0Id for better query performance
calendarEventSchema.index({ auth0Id: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);


