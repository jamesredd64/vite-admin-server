const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const { submitForm } = require('../controllers/formController');

// Access route from browser
// http://localhost:5000/api/users/forms/hello

const router = express.Router();

// Rate limiting to prevent spam
const formLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 10 });

// Health check route
router.get('/hello', (req, res) => {
    res.status(200).json({ message: 'Hello James from the form API!' });
  });

// Webflow Form Submission Endpoint with Validation, Security, and Rate Limiting
router.post('/submit-form', formLimiter, [
  body('email').isEmail(),
  body('firstName').isLength({ min: 2 }),
  body('lastName').isLength({ min: 2 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  // API authentication check
  const secretToken = req.headers['x-webflow-token'];
  if (secretToken !== process.env.WEBFLOW_SECRET) return res.status(403).json({ error: 'Unauthorized' });

  try {
    // Sanitize message
    const sanitizedMessage = sanitizeHtml(req.body.message);

    // Process and store data in MongoDB using controller
    submitForm(req, res, sanitizedMessage);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

