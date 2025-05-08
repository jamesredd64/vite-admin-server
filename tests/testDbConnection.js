const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');

async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', dbConfig.url);
    console.log('Database Name:', dbConfig.database);

    await mongoose.connect(dbConfig.url, {
      dbName: dbConfig.database
    });

    console.log('Connected to MongoDB successfully');

    // Get database information
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(c => console.log(`- ${c.name}`));

    // Check users collection
    const users = await db.collection('users').find().limit(1).toArray();
    if (users.length > 0) {
      console.log('\nSample user:', users[0]._id);
    } else {
      console.log('\nNo users found in database');
    }

  } catch (error) {
    console.error('Database connection test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testDbConnection();