const mongoose = require('mongoose');

// Check if model already exists
if (mongoose.models.ScheduledEvent) {
  module.exports = mongoose.models.ScheduledEvent;
} else {
  const scheduledEventSchema = new mongoose.Schema({
    sequence: Number,
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
  }, { 
    timestamps: true, 
    autoIndex: false,
    collection: 'scheduledEvents' // Explicitly set the collection name
  });

  // Add indexes for better query performance
  scheduledEventSchema.index({ status: 1, scheduledTime: 1 });
  scheduledEventSchema.index({ 'eventDetails.startTime': 1 });

  // Middleware to log queries
  scheduledEventSchema.pre('find', function() {
    console.log('MongoDB Query:', {
      query: this.getQuery(),
      options: this.getOptions(),
      fields: this._fields,
      collection: this.mongooseCollection.name
    });
  });

  module.exports = mongoose.model('ScheduledEvent', scheduledEventSchema);
}