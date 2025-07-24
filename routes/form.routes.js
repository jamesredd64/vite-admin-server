const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const { submitForm } = require('../controllers/formController');
const registerTokenRoute = require('./register-token');

const router = express.Router();

// Rate limiting to prevent spam
const formLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 10 });

// Health check route
router.get('/hello', (req, res) => {
  res.status(200).json({ message: 'Hello James from the form API!' });
});

// Register token route
router.use(registerTokenRoute);

// Webflow Form Submission Endpoint with Validation, Security, and Rate Limiting

const SingleUserEventService = require('../services/singleUserEvent.service');
router.post('/submit-form', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      eventName,
      eventLocation,
      eventDate,
      extendedProps
    } = req.body;

    const eventDetails = {
      startTime: new Date(eventDate),
      endTime: new Date(new Date(eventDate).getTime() + 2 * 60 * 60 * 1000),
      summary: eventName,
      description: `Event at ${eventLocation}`,
      location: eventLocation,
      organizer: {
        name: `${firstName} ${lastName}`,
        email
      }
    };

    const selectedUser = {
      email,
      name: `${firstName} ${lastName}`
    };

    await SingleUserEventService.scheduleAndNotify({ eventDetails, selectedUser });

    return res.status(200).json({
      success: true,
      message: 'Event upserted and invite sent.'
    });
  } catch (err) {
    console.error('❌ Error in /upsert-event:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;

// router.post('/submit-form', formLimiter, [
//   body('email').isEmail(),
//   body('firstName').isLength({ min: 2 }),
//   body('lastName').isLength({ min: 2 }),
//   body('eventName').isLength({ min: 2 }),
//   body('eventLocation').isLength({ min: 2 }),
//   body('token').isString().withMessage('Token is required'),
// ], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//   try {
//     // Sanitize message
//     const sanitizedMessage = sanitizeHtml(req.body.message);

//     // Process and store data in MongoDB using controller
//     submitForm(req, res);
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

module.exports = router;
