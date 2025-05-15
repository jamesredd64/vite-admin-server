const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 2;
      },
      message: props => `${props.value} must be at least 2 characters long`
    }
  },
  lastName: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 2;
      },
      message: props => `${props.value} must be at least 2 characters long`
    }
  },
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
  phoneNumber: {
    type: String,
    default: "",
  },
  zipCode: {
    type: String,
    default: "",
  },
  eventDate: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  extendedProps: {
    source: {
      type: String,
      required: true,
      enum: ['webflow', 'manual', 'other']
    },
    metadata: {
      type: Object,
      required: false
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

// Add index for faster queries based on email
formSchema.index({ email: 1 });

module.exports = mongoose.model('FormSubmission', formSchema);
