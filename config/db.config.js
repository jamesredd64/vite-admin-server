const config = {
  url: process.env.MONGODB_URI || 'mongodb+srv://jredd2013:X9iwELRRwqCCb7kc@mern-cluster.oistpfp.mongodb.net/?retryWrites=true&w=majority',
  database: 'mongo_users-react-dev',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'mongo_users-react-dev',
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority'
  }
};


module.exports = config;
