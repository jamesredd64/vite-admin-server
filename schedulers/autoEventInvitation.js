const mongoose = require('mongoose');
const { CronJob } = require('cron');
const ScheduledEvent = require('../models/scheduledEvent');
const User = require('../models/user');
const { sendEventInvitation } = require('../routes/email.routes');
const { generateICalEvent } = require('../utils/ical.utils');

// Schema for tracking invitation metadata
const autoInviteMetadataSchema = new mongoose.Schema({
  lastRunTime: { type: Date, required: true },
  processedUserIds: [{ type: String }],
  eventId: { type: String, required: true }
});

const AutoInviteMetadata = mongoose.model('AutoInviteMetadata', autoInviteMetadataSchema);

// Function to process new users and send invitations
async function processNewUsers() {
  console.log('🔄 Starting auto event invitation process:', new Date().toISOString());
  try {
    // Find upcoming events
    const upcomingEvents = await ScheduledEvent.find({
      'eventDetails.startTime': { $gt: new Date() },
      status: 'pending'
    });

    console.log(`📅 Found ${upcomingEvents.length} upcoming events to process`);

    for (const event of upcomingEvents) {
      console.log(`\n🎯 Processing event: ${event.eventDetails.summary} (${event._id})`);
      
      // Get or create metadata for this event
      let metadata = await AutoInviteMetadata.findOne({ eventId: event._id });
      if (!metadata) {
        console.log('📝 Creating new metadata for event');
        metadata = new AutoInviteMetadata({
          lastRunTime: new Date(),
          processedUserIds: [],
          eventId: event._id
        });
      }

      // Find new users
      const newUsers = await User.find({
        createdAt: { $gt: metadata.lastRunTime },
        _id: { $nin: metadata.processedUserIds },
        status: 'active'
      });

      console.log(`👥 Found ${newUsers.length} new users to process`);

      for (const user of newUsers) {
        console.log(`\n📧 Processing invitation for user: ${user.email}`);
        try {
          const eventDetails = {
            startTime: event.eventDetails.startTime,
            endTime: event.eventDetails.endTime,
            summary: event.eventDetails.summary,
            description: event.eventDetails.description,
            location: event.eventDetails.location,
            organizer: event.eventDetails.organizer,
            to: {
              email: user.email,
              name: `${user.firstName} ${user.lastName}`.trim()
            }
          };

          const mailOptions = {
            from: event.eventDetails.organizer.email,
            to: user.email,
            subject: event.eventDetails.summary,
            text: 'Please find the calendar event attached.',
            html: '<p>Please find the calendar event attached. Click to add to your calendar.</p>',
            icalEvent: {
              filename: 'invitation.ics',
              method: 'REQUEST',
              content: generateICalEvent(eventDetails)
            }
          };

          await sendEventInvitation(eventDetails, mailOptions);
          metadata.processedUserIds.push(user._id);
          console.log(`✅ Successfully sent invitation to ${user.email}`);
        } catch (error) {
          console.error(`❌ Failed to send invitation to user ${user.email}:`, error);
        }
      }

      // Update metadata
      metadata.lastRunTime = new Date();
      await metadata.save();
      console.log(`📝 Updated metadata for event ${event._id}`);
    }
    console.log('\n✨ Auto event invitation process completed:', new Date().toISOString());
  } catch (error) {
    console.error('❌ Error in auto event invitation process:', error);
  }
}


// Create cron jobs to run twice daily
const morningJob = new CronJob('0 9 * * *', () => {
  console.log('\n🌅 Starting auto event invitation check...');
  processNewUsers();
});

const afternoonJob = new CronJob('0 15 * * *', () => {
  console.log('\n🌇 Starting auto event invitation check...');
  processNewUsers();
});
// Create cron jobs to run twice daily
// For testing: Run every minute
// const morningJob = new CronJob('* * * * *', () => {
//   console.log('\n🌅 Starting auto event invitation check...');
//   processNewUsers();
// });

// // For testing: Run every 2 minutes
// const afternoonJob = new CronJob('*/2 * * * *', () => {
//   console.log('\n🌇 Starting auto event invitation check...');
//   processNewUsers();
// });

function startEventInvitationScheduler() {
  morningJob.start();
  afternoonJob.start();
  console.log('🚀 Event invitation scheduler started - Will run at 9 AM and 3 PM daily');
}

module.exports = { startEventInvitationScheduler };

