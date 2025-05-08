const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Add diagnostic endpoint
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