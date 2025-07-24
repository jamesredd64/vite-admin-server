const { validationResult } = require('express-validator');
const SingleUserEventService = require('../services/singleUserEventService');

const submitForm = async (req, res) => {
  // Validate incoming request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn('⚠️ Validation errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Log raw incoming body
  console.log('📥 Incoming controller payload:', req.body);

  try {
    let { eventDetails, selectedUser } = req.body;

    // If the payload isn’t structured properly, rebuild from flat fields
    if (!eventDetails || !selectedUser) {
      const {
        firstName = '',
        lastName = '',
        email = '',
        eventName = '',
        eventLocation = '',
        eventDate = ''
      } = req.body;

      eventDetails = {
        startTime: new Date(eventDate),
        endTime: new Date(new Date(eventDate).getTime() + 2 * 60 * 60 * 1000),
        summary: eventName,
        description: `Event at ${eventLocation}`,
        location: eventLocation,
        organizer: {
          name: `${firstName} ${lastName}`.trim(),
          email
        }
      };

      selectedUser = {
        name: `${firstName} ${lastName}`.trim(),
        email
      };

      console.log('🔧 Rebuilt eventDetails & selectedUser:', { eventDetails, selectedUser });
    }

    // Final debug log before calling the service
    console.log('📨 Calling scheduleAndNotify with:', { eventDetails, selectedUser });

    // Trigger email + event scheduling
    await SingleUserEventService.scheduleAndNotify({ eventDetails, selectedUser });

    return res.status(200).json({
      success: true,
      message: 'Form submitted, event scheduled, and invite sent.'
    });
  } catch (error) {
    console.error('❌ Error in submitForm handler:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { submitForm };
