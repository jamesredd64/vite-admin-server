const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller.js');

// Routes
// const { getAllEvents } = require('./controllers/eventsController');

// Route to fetch all events


module.exports = router;

router.post('/', calendarController.createEvent);
router.get('/', calendarController.getEvents);
router.get('/all', calendarController.getAllEvents);
router.get('/:id', calendarController.getEventById);  // This will now handle auth0Id
router.patch('/:id', calendarController.updateEvent);
router.delete('/:id', calendarController.deleteEvent);
router.get('/debug/connection', async (req, res) => {
    try {
      // Get the MongoDB connection
      const db = mongoose.connection.db;
      
      // List all collections
      const collections = await db.listCollections().toArray();
      
      // Get the calendar events collection stats
      const stats = await db.collection('calendar_events').stats();
      
      // Get a sample document
      const sampleDoc = await db.collection('calendar_events')
        .findOne({}, { sort: { _id: -1 } });
  
      res.json({
        database: db.databaseName,
        collections: collections.map(c => c.name),
        calendarEventsStats: {
          documentCount: stats.count,
          totalSize: stats.size,
          avgDocumentSize: stats.avgObjSize
        },
        sampleDocument: sampleDoc
      });
    } catch (error) {
      console.error('Database diagnostic error:', error);
      res.status(500).json({
        error: 'Failed to get database diagnostics',
        details: error.message
      });
    }
  });

module.exports = router;


