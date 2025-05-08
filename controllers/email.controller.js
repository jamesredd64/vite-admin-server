const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
// const { generateICalEvent } = require('../utils/ical-generator');
const ScheduledEventService = require('../services/scheduledEvents.service');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function generateICalEvent(event) {
  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uuidv4()}@${process.env.DOMAIN || 'stagholme.com'}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startTime)}
DTEND:${formatDate(event.endTime)}
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
LOCATION:${event.location}
ORGANIZER;CN=${event.organizer?.name || 'Event Organizer'}:mailto:${event.organizer?.email || process.env.EMAIL_FROM}
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${event.to.name || event.to.email}:mailto:${event.to.email}
END:VEVENT
END:VCALENDAR`;
}

// Verify transporter configuration
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email transporter verification failed:', error);
    return false;
  }
};

// Helper function to send email
const sendMailAsync = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, body, attachments } = req.body;

    // Enhanced validation with detailed errors
    const validationErrors = [];
    if (!to) validationErrors.push('recipient email (to) is required');
    if (!subject) validationErrors.push('subject is required');
    if (!body) validationErrors.push('email body is required');

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validationErrors,
        receivedData: { to, subject, bodyPresent: !!body }
      });
    }

    // Verify transporter before sending
    const isVerified = await verifyTransporter();
    if (!isVerified) {
      throw new Error('Email service not properly configured');
    }

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Your Application Name',
        address: process.env.EMAIL_FROM
      },
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: body,
      attachments: attachments || []
    };

    const info = await sendMailAsync(mailOptions);

    return res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in sendEmail controller:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

exports.getEmailConfig = async (req, res) => {
  try {
    const isTransporterVerified = await verifyTransporter();

    res.json({
      config: {
        emailFrom: process.env.EMAIL_FROM,
        emailFromName: process.env.EMAIL_FROM_NAME,
        isConfigured: !!process.env.EMAIL_FROM && !!process.env.EMAIL_APP_PASSWORD,
        isVerified: isTransporterVerified,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getEmailConfig controller:', error);
    res.status(500).json({
      error: 'Failed to get email configuration',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

exports.sendBulkEmails = async (req, res) => {
  try {
    const { recipients, subject, body, attachments } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Recipients array is required and must not be empty'
      });
    }

    // Verify transporter before sending
    const isVerified = await verifyTransporter();
    if (!isVerified) {
      throw new Error('Email service not properly configured');
    }

    const emailPromises = recipients.map(recipient => {
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Your Application Name',
          address: process.env.EMAIL_FROM
        },
        to: recipient,
        subject,
        html: body,
        attachments: attachments || []
      };

      return sendMailAsync(mailOptions);
    });

    const results = await Promise.allSettled(emailPromises);

    const summary = {
      total: recipients.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      details: results.map((result, index) => ({
        recipient: recipients[index],
        status: result.status,
        messageId: result.status === 'fulfilled' ? result.value.messageId : null,
        error: result.status === 'rejected' ? result.reason.message : null,
        timestamp: new Date().toISOString()
      }))
    };

    return res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Error in sendBulkEmails controller:', error);
    return res.status(500).json({
      error: 'Failed to send bulk emails',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

exports.sendEventInvitation = async (req, res) => {
    try {
        const { eventData, mailOptions } = req.body;

        if (!eventData || !mailOptions) {
            return res.status(400).json({
                success: false,
                message: 'Both eventData and mailOptions are required'
            });
        }

        const { startTime, endTime, summary, description, location, to } = eventData;

        // Merge the event data into the mail options
        const finalMailOptions = {
            ...mailOptions,
            from: process.env.EMAIL_USER,
            icalEvent: {
                filename: 'invitation.ics',
                method: 'REQUEST',
                content: generateICalEvent(eventData)
            }
        };

        const info = await transporter.sendMail(finalMailOptions);
        res.json({
            success: true,
            message: `Invitation sent to ${to.email}`,
            response: info.response
        });

    } catch (error) {
        console.error('Error in sendEventInvitation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send invitation',
            error: error.message
        });
    }
};

exports.sendBulkEventInvitations = async (req, res) => {
    try {
        const { eventDetails, attendees } = req.body;

        if (!Array.isArray(attendees) || attendees.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Recipients array is required and must not be empty'
            });
        }

        const results = await Promise.all(attendees.map(async (to) => {
            const eventDetailsWithAttendee = {
                startTime: new Date(eventDetails.startTime),
                endTime: new Date(eventDetails.endTime),
                summary: eventDetails.summary,
                description: eventDetails.description,
                location: eventDetails.location,
                to
            };

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: to.email,
                subject: eventDetails.summary,
                text: 'Please find the calendar event attached.',
                html: '<p>Please find the calendar event attached. Click to add to your calendar.</p>',
                icalEvent: {
                    filename: 'invitation.ics',
                    method: 'REQUEST',
                    content: generateICalEvent(eventDetailsWithAttendee)
                }
            };

            const info = await transporter.sendMail(mailOptions);
            return {
                email: to.email,
                status: 'sent',
                response: info.response
            };
        }));

        res.json({
            success: true,
            message: `Bulk invitations sent to ${attendees.length} recipients`,
            results
        });

    } catch (error) {
        console.error('Error in sendBulkEventInvitations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send bulk invitations',
            error: error.message
        });
    }
};

exports.scheduleEventInvitation = async (req, res) => {
    try {
        // Simple health check response
        if (req.method === 'GET') {
            return res.status(200).json({
                success: true,
                message: 'Schedule event invitation endpoint is available',
                timestamp: new Date().toISOString()
            });
        }

        // Existing POST logic
        console.log('Received schedule event request with body:', req.body);
        const { eventDetails, scheduledTime, selectedUsers } = req.body;

        if (!eventDetails || !scheduledTime) {
            console.log('Validation failed:', { eventDetails: !!eventDetails, scheduledTime: !!scheduledTime });
            return res.status(400).json({
                success: false,
                message: 'Event details and scheduled time are required'
            });
        }

        console.log('Attempting to schedule event with:', {
            eventDetails,
            scheduledTime: new Date(scheduledTime),
            selectedUsers
        });

        const scheduledEvent = await ScheduledEventService.scheduleEvent({
            eventDetails,
            scheduledTime: new Date(scheduledTime),
            selectedUsers
        });

        console.log('Event scheduled successfully:', scheduledEvent);

        res.json({
            success: true,
            message: 'Event scheduled successfully',
            scheduledEvent
        });

    } catch (error) {
        console.error('Error in scheduleEventInvitation:', {
            error: error.message,
            stack: error.stack,
            requestBody: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Failed to schedule invitation',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
// exports.scheduleEventInvitation = async (req, res) => {
//     try {
//         const { eventDetails, scheduledTime, selectedUsers } = req.body;

//         if (!eventDetails || !scheduledTime) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Event details and scheduled time are required'
//             });
//         }

//         const scheduledEvent = await ScheduledEventService.scheduleEvent({
//             eventDetails,
//             scheduledTime: new Date(scheduledTime),
//             selectedUsers
//         });

//         res.json({
//             success: true,
//             message: 'Event scheduled successfully',
//             scheduledEvent
//         });

//     } catch (error) {
//         console.error('Error in scheduleEventInvitation:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to schedule invitation',
//             error: error.message
//         });
//     }
// };






