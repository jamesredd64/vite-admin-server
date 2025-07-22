const mongoose = require('mongoose');
const User = require('../models/user');
const ScheduledEvent = require('../models/scheduledEvent');
const { transporter } = require('../config/email.config');
const { generateICalEvent } = require('../utils/ical.utils');

function compareDates(isoString, dateString) {
  // Extract the date part from the ISO string
  const isoDatePart = isoString.split('T')[0];
  
  // Compare the date parts
  return isoDatePart === dateString;
}

// console.log(compareDates('2025-07-22T02:59:38.795+00:00', '2025-07-22')); // true
// console.log(compareDates('2025-07-22T02:59:38.795+00:00', '2025-11-01')); // false

class ScheduledEventService {
  static async getActiveUsers() {
    return await User.find({ status: 'active' });
  }

  static async scheduleEvent(eventData) {
    try {
      console.log('Upserting scheduled event with data:', eventData);

      // Query candidate events by summary, location, and organizer email
      const candidates = await ScheduledEvent.find({
        'eventDetails.summary': eventData.eventDetails.summary,
        'eventDetails.location': eventData.eventDetails.location,
        'eventDetails.organizer.email': eventData.eventDetails.organizer.email
      });

      // Find existing event by comparing dates using compareDates
      const existingEvent = candidates.find(event =>
        compareDates(event.eventDetails.startTime.toISOString(), eventData.eventDetails.startTime.toISOString().split('T')[0])
      );

      console.log('Existing event found by compareDates:', existingEvent);

      if (existingEvent) {
        // Update existing event
        const update = {
          $set: {
            'eventDetails.endTime': new Date(eventData.eventDetails.endTime),
            'eventDetails.description': eventData.eventDetails.description,
            'eventDetails.location': eventData.eventDetails.location,
            'eventDetails.organizer': eventData.eventDetails.organizer,
            scheduledTime: new Date(eventData.scheduledTime),
            status: 'pending'
          },
          $addToSet: {
            selectedUsers: { $each: eventData.selectedUsers }
          }
        };

        const updatedEvent = await ScheduledEvent.findByIdAndUpdate(existingEvent._id, update, { new: true });
        console.log('Updated existing scheduled event:', updatedEvent);
        return updatedEvent;
      } else {
        // Normalize eventData.eventDetails.startTime and endTime to midnight UTC for storage
        const startDate = new Date(eventData.eventDetails.startTime);
        startDate.setUTCHours(0, 0, 0, 0);
        eventData.eventDetails.startTime = new Date(startDate);
        eventData.eventDetails.endTime = new Date(startDate);
        eventData.eventDetails.endTime.setUTCHours(23, 59, 59, 999);

        // Create new event
        const newEvent = new ScheduledEvent({
          eventDetails: eventData.eventDetails,
          scheduledTime: new Date(eventData.scheduledTime),
          selectedUsers: eventData.selectedUsers,
          status: 'pending'
        });

        const savedEvent = await newEvent.save();
        console.log('Created new scheduled event:', savedEvent);
        return savedEvent;
      }
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

       // Update selectedUsers with the actual list of users invited
       event.selectedUsers = usersToInvite;

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

      // Create a ScheduledEvent record for immediate sends
      const scheduledEvent = new ScheduledEvent({
        eventDetails: eventDetails,
        scheduledTime: new Date(), // Set scheduled time to now for immediate sends
        selectedUsers: usersToInvite, // Store the list of users who received the invitation
        status: 'pending' // Mark as completed immediately
      });
      await scheduledEvent.save();

      return {
        success: true,
        message: `Invitations sent to ${usersToInvite.length} users`,
        scheduledEventId: scheduledEvent._id // Optionally return the ID of the created event
      };
    } catch (error) {
      console.error('Error sending immediate invitations:', error);
      throw error;
    }
  }
}

module.exports = ScheduledEventService;


