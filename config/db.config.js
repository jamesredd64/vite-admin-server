const config = {
  url: process.env.MONGODB_URI || 'mongodb+srv://showcase_admin:wt2TSeIH5dLdHtxw@showcase.vd6up8i.mongodb.net/?retryWrites=true&w=majority&appName=showcase',
  database: 'showcase-collection',
  options: {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    dbName: 'showcase-collection',
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
    autoIndex: true
      // process.env.NODE_ENV !== 'production' // Disable auto-indexing
  }
};

module.exports = config;