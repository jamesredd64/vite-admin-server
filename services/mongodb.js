const mongoose = require("mongoose");
const dbConfig = require("../config/db.config.js");

// Handle deprecation warning
mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    if (!dbConfig.url) {
      throw new Error('MONGODB_URI is not defined');
    }
    
    console.log('Attempting to connect to MongoDB with config:', {
      database: dbConfig.database,
      dbName: dbConfig.options.dbName,
      isDevMode: dbConfig.options.dbName.includes('-dev')
    });
    
    const conn = await mongoose.connect(dbConfig.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: dbConfig.database,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      ssl: true,
      retryWrites: true,
      w: "majority"
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Using database: ${conn.connection.name}`);
    console.log(`Current database settings:`, {
      url: dbConfig.url.split('@')[1], // Log URL without credentials
      databaseName: conn.connection.name,
      collections: Object.keys(conn.connection.collections)
    });
    
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;




