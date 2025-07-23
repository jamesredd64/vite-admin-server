const express = require('express');
const router = express.Router();
// const ScheduledEventService = require('../../services/scheduledEvents.service.js');
const SingleUserEventService = require('../../services/singleUserEventService.js');
const formController = require('../../controllers/formController.js');

router.post('/', async (req, res) => {
  try {
    const formData = req.body;
    
    console.log('📬 Received form submission from forms/server.js');
    console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

    // Call scheduleEvent to upsert event
    const scheduledEvent = await SingleUserEventService.scheduleAndNotify(formData.eventData);

    // Send confirmation email
    await formController.sendConfirmationEmail(formData);

    res.status(200).json({
      success: true,
      message: 'Form submission created, event scheduled, and confirmation email sent successfully',
      data: formData
    });
  } catch (error) {
    console.error('Error in submit-form handler:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;
