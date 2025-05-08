const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');

// Debug middleware
router.use((req, res, next) => {
  console.log('Email Route:', req.method, req.url, req.body);
  next();
});

// Service health check endpoint
router.get('/bulk-event-invitation', (req, res) => {
  res.json({
    status: 'active',
    service: 'Bulk Event Invitation Email Service',
    timestamp: new Date().toISOString(),
    endpoints: {
      post: {
        url: '/api/email/bulk-event-invitation',
        method: 'POST',
        requiredFields: {
          eventDetails: {
            summary: 'string',
            description: 'string',
            location: 'string',
            startTime: 'Date',
            endTime: 'Date'
          },
          attendees: [
            {
              email: 'string',
              name: 'string (optional)'
            }
          ]
        },
        example: {
          eventDetails: {
            summary: "Team Meeting",
            description: "Monthly team sync",
            location: "Conference Room A",
            startTime: "2024-03-20T10:00:00Z",
            endTime: "2024-03-20T11:00:00Z"
          },
          attendees: [
            { email: "user1@example.com", name: "User One" },
            { email: "user2@example.com", name: "User Two" }
          ]
        }
      }
    },
    documentation: "Send POST request with eventDetails and attendees array to send bulk invitations"
  });
});

// POST routes
router.post('/event-invitation', emailController.sendEventInvitation);
router.post('/bulk-event-invitation', emailController.sendBulkEventInvitations);
router.get('/schedule-event-invitation', emailController.scheduleEventInvitation);
router.post('/schedule-event-invitation', emailController.scheduleEventInvitation);

module.exports = router;






