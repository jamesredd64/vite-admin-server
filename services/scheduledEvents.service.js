const mongoose = require('mongoose');
const User = require('../models/user');
const ScheduledEvent = require('../models/scheduledEvent');
const { transporter } = require('../config/email.config');
const { generateICalEvent } = require('../utils/ical.utils');

class ScheduledEventService {
  static async getActiveUsers() {
    return await User.find({ status: 'active' });
  }

  static async scheduleEvent(eventData) {
    try {
      console.log('Creating scheduled event with data:', eventData);
      const scheduledEvent = new ScheduledEvent({
        eventDetails: {
          startTime: new Date(eventData.eventDetails.startTime),
          endTime: new Date(eventData.eventDetails.endTime),
          summary: eventData.eventDetails.summary,
          description: eventData.eventDetails.description,
          location: eventData.eventDetails.location,
          organizer: eventData.eventDetails.organizer
        },
        scheduledTime: new Date(eventData.scheduledTime),
        selectedUsers: eventData.selectedUsers,
        status: 'pending'
      });
      console.log('Created scheduled event instance:', scheduledEvent);
      const savedEvent = await scheduledEvent.save();
      console.log('Successfully saved scheduled event:', savedEvent);
      return savedEvent;
    } catch (error) {
      console.error('Error in ScheduledEventService.scheduleEvent:', {
        error: error.message,
        stack: error.stack,
        eventData
      });
      throw error;
    }
  }

  static async processScheduledEvents() {
    const now = new Date();
    const pendingEvents = await ScheduledEvent.find({
      status: 'pending',
      scheduledTime: { $lte: now }
    });

    for (const event of pendingEvents) {
      try {
        event.status = 'processing';
        await event.save();

        // Get all active users if no specific users are selected
        let usersToInvite = event.selectedUsers;
        if (!usersToInvite || usersToInvite.length === 0) {
          const activeUsers = await this.getActiveUsers();
          usersToInvite = activeUsers.map(user => ({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim()
          }));
        }

        // Send invitations
        await Promise.all(usersToInvite.map(async (user) => {
          const mailOptions = {
            from: event.eventDetails.organizer.email,
            to: user.email,
            subject: event.eventDetails.summary,
            text: 'Please find the calendar event attached.',
            html: '<p>Please find the calendar event attached. Click to add to your calendar.</p>',
            icalEvent: {
              filename: 'invitation.ics',
              method: 'REQUEST',
              content: generateICalEvent({
                ...event.eventDetails,
                to: user
              })
            }
          };

          await transporter.sendMail(mailOptions);
        }));

        event.status = 'completed';
        await event.save();
      } catch (error) {
        console.error('Error processing scheduled event:', error);
        event.status = 'failed';
        await event.save();
      }
    }
  }

  static async sendImmediateInvitations(eventDetails) {
    try {
      // Get all active users if no specific users are selected
      let usersToInvite = eventDetails.selectedUsers;
      if (!usersToInvite || usersToInvite.length === 0) {
        const activeUsers = await this.getActiveUsers();
        usersToInvite = activeUsers.map(user => ({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim()
        }));
      }

      // Send invitations
      await Promise.all(usersToInvite.map(async (user) => {
        const mailOptions = {
          from: eventDetails.organizer.email,
          to: user.email,
          subject: eventDetails.summary,
          text: 'Please find the calendar event attached.',
          html: '<p>Please find the calendar event attached. Click to add to your calendar.</p>',
          icalEvent: {
            filename: 'invitation.ics',
            method: 'REQUEST',
            content: generateICalEvent({
              ...eventDetails,
              to: user
            })
          }
        };

        await transporter.sendMail(mailOptions);
      }));

      return {
        success: true,
        message: `Invitations sent to ${usersToInvite.length} users`
      };
    } catch (error) {
      console.error('Error sending immediate invitations:', error);
      throw error;
    }
  }
}

module.exports = ScheduledEventService;


// const mongoose = require('mongoose');
// const User = require('../models/user');
// const { transporter } = require('../config/email.config');
// const { generateICalEvent } = require('../utils/ical.utils');

// const scheduledEventSchema = new mongoose.Schema({
//   eventDetails: {
//     startTime: Date,
//     endTime: Date,
//     summary: String,
//     description: String,
//     location: String,
//     organizer: {
//       name: String,
//       email: String
//     }
//   },
//   selectedUsers: [{
//     email: String,
//     name: String
//   }],
//   scheduledTime: Date,
//   status: {
//     type: String,
//     enum: ['pending', 'processing', 'completed', 'failed'],
//     default: 'pending'
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// const ScheduledEvent = mongoose.model('ScheduledEvent', scheduledEventSchema);

// class ScheduledEventService {
//   static async getActiveUsers() {
//     return await User.find({ status: 'active' });
//   }

//   static async scheduleEvent(eventData) {
//     try {
//       console.log('Creating scheduled event with data:', eventData);
//       const scheduledEvent = new ScheduledEvent({
//         eventDetails: {
//           startTime: new Date(eventData.eventDetails.startTime),
//           endTime: new Date(eventData.eventDetails.endTime),
//           summary: eventData.eventDetails.summary,
//           description: eventData.eventDetails.description,
//           location: eventData.eventDetails.location,
//           organizer: eventData.eventDetails.organizer
//         },
//         scheduledTime: new Date(eventData.scheduledTime),
//         selectedUsers: eventData.selectedUsers,
//         status: 'pending'
//       });
//       console.log('Created scheduled event instance:', scheduledEvent);
//       const savedEvent = await scheduledEvent.save();
//       console.log('Successfully saved scheduled event:', savedEvent);
//       return savedEvent;
//     } catch (error) {
//       console.error('Error in ScheduledEventService.scheduleEvent:', {
//         error: error.message,
//         stack: error.stack,
//         eventData
//       });
//       throw error;
//     }
//   }

//   static async processScheduledEvents() {
//     const now = new Date();
//     const pendingEvents = await ScheduledEvent.find({
//       status: 'pending',
//       scheduledTime: { $lte: now }
//     });

//     for (const event of pendingEvents) {
//       try {
//         event.status = 'processing';
//         await event.save();

//         // Get all active users if no specific users are selected
//         let usersToInvite = event.selectedUsers;
//         if (!usersToInvite || usersToInvite.length === 0) {
//           const activeUsers = await this.getActiveUsers();
//           usersToInvite = activeUsers.map(user => ({
//             email: user.email,
//             name: `${user.firstName} ${user.lastName}`.trim()
//           }));
//         }

//         // Send invitations
//         await Promise.all(usersToInvite.map(async (user) => {
//           const mailOptions = {
//             from: event.eventDetails.organizer.email,
//             to: user.email,
//             subject: event.eventDetails.summary,
//             text: 'Please find the calendar event attached.',
//             html: '<p>Please find the calendar event attached. Click to add to your calendar.</p>',
//             icalEvent: {
//               filename: 'invitation.ics',
//               method: 'REQUEST',
//               content: generateICalEvent({
//                 ...event.eventDetails,
//                 to: user
//               })
//             }
//           };

//           await transporter.sendMail(mailOptions);
//         }));

//         event.status = 'completed';
//         await event.save();
//       } catch (error) {
//         console.error('Error processing scheduled event:', error);
//         event.status = 'failed';
//         await event.save();
//       }
//     }
//   }

//   static async sendImmediateInvitations(eventDetails) {
//     try {
//       // Get all active users if no specific users are selected
//       let usersToInvite = eventDetails.selectedUsers;
//       if (!usersToInvite || usersToInvite.length === 0) {
//         const activeUsers = await this.getActiveUsers();
//         usersToInvite = activeUsers.map(user => ({
//           email: user.email,
//           name: `${user.firstName} ${user.lastName}`.trim()
//         }));
//       }

//       // Send invitations
//       await Promise.all(usersToInvite.map(async (user) => {
//         const mailOptions = {
//           from: eventDetails.organizer.email,
//           to: user.email,
//           subject: eventDetails.summary,
//           text: 'Please find the calendar event attached.',
//           html: '<p>Please find the calendar event attached. Click to add to your calendar.</p>',
//           icalEvent: {
//             filename: 'invitation.ics',
//             method: 'REQUEST',
//             content: generateICalEvent({
//               ...eventDetails,
//               to: user
//             })
//           }
//         };

//         await transporter.sendMail(mailOptions);
//       }));

//       return {
//         success: true,
//         message: `Invitations sent to ${usersToInvite.length} users`
//       };
//     } catch (error) {
//       console.error('Error sending immediate invitations:', error);
//       throw error;
//     }
//   }
// }

// module.exports = ScheduledEventService;
