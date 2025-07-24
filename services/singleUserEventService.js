// services/singleUserEvent.service.js
const ScheduledEvent = require('../models/scheduledEvent');
const { transporter } = require('../config/email.config');
const { generateICalEvent } = require('../utils/ical.utils');

function compareDates(isoString, dateString) {
  return isoString.split('T')[0] === dateString;
}


class SingleUserEventService {
    
    // static async scheduleAndNotify({ eventDetails, selectedUser }) {
    //     // console.log('📨 Received input:', input); // ← Check this
    //     console.log('📨 scheduleAndNotify received:', { eventDetails, selectedUser });

//     // const { eventDetails, selectedUser } = input;
static async scheduleAndNotify(input) {
    if (!input) {
      console.error('❌ No input provided to scheduleAndNotify');
      throw new Error('No data passed to scheduler');
    }
    else {
        console.log('📨 Received input:', input); // ← Check this
    }
  
    const { eventDetails, selectedUser } = input;
  
    // if (!eventDetails || !selectedUser) {
    //   console.error('❌ Missing eventDetails or selectedUser in scheduleAndNotify');
    //   throw new Error('Malformed scheduler payload');
    // }

    try {
    //   if (!eventDetails || !selectedUser || !selectedUser.email) {
    //     throw new Error('Missing required eventDetails or selectedUser');
    //   }

      // 🔎 Check for existing event
      const candidates = await ScheduledEvent.find({
        'eventDetails.summary': eventDetails.summary,
        'eventDetails.location': eventDetails.location,
        'eventDetails.organizer.email': eventDetails.organizer?.email
      });

      const existingEvent = candidates.find(event =>
        compareDates(event.eventDetails.startTime.toISOString(), eventDetails.startTime.toISOString().split('T')[0])
      );

      let finalEvent;

      if (existingEvent) {
        // 🛠 Update existing
        const update = {
          $set: {
            'eventDetails.endTime': new Date(eventDetails.endTime),
            'eventDetails.description': eventDetails.description,
            'eventDetails.location': eventDetails.location,
            'eventDetails.organizer': eventDetails.organizer,
            scheduledTime: new Date(),
            status: 'pending'
          },
          $addToSet: {
            selectedUsers: selectedUser
          }
        };

        finalEvent = await ScheduledEvent.findByIdAndUpdate(existingEvent._id, update, { new: true });
      } else {
        // 🆕 Create new
        const startDate = new Date(eventDetails.startTime);
        startDate.setUTCHours(0, 0, 0, 0);
        eventDetails.startTime = new Date(startDate);
        eventDetails.endTime = new Date(startDate);
        eventDetails.endTime.setUTCHours(23, 59, 59, 999);

        const newEvent = new ScheduledEvent({
          eventDetails,
          scheduledTime: new Date(),
          selectedUsers: [selectedUser],
          status: 'pending'
        });

        finalEvent = await newEvent.save();
      }

      // 📧 Send email invite
      const mailOptions = {
        from: eventDetails.organizer.email,
        to: selectedUser.email,
        subject: eventDetails.summary,
        text: 'Please find the calendar event attached.',
        html: '<p>Please find the calendar event attached. Click to add to your calendar.</p>',
        icalEvent: {
          filename: 'invitation.ics',
          method: 'REQUEST',
          content: generateICalEvent({
            ...eventDetails,
            to: selectedUser
          })
        }
      };

      await transporter.sendMail(mailOptions);

      return {
        success: true,
        eventId: finalEvent._id,
        message: 'Event scheduled and invitation sent.'
      };
    } catch (error) {
      console.error('❌ Error in SingleUserEventService.scheduleAndNotify:', error.message);
      throw error;
    }
  }
}

module.exports = SingleUserEventService;
