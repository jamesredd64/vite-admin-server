const mongoose = require('mongoose');

// Check if model already exists
if (mongoose.models.ScheduledEvent) {
  module.exports = mongoose.models.ScheduledEvent;
} else {
  const scheduledEventSchema = new mongoose.Schema({
    eventDetails: {
      startTime: Date,
      endTime: Date,
      summary: String,
      description: String,
      location: String,
      organizer: {
        name: String,
        email: String
      }
    },
    selectedUsers: [{
      email: String,
      name: String
    }],
    scheduledTime: Date,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  // Add indexes for better query performance
  scheduledEventSchema.index({ status: 1, scheduledTime: 1 });
  scheduledEventSchema.index({ 'eventDetails.startTime': 1 });

  module.exports = mongoose.model('ScheduledEvent', scheduledEventSchema);
}