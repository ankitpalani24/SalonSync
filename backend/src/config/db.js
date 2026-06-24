const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salonsync');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Do not crash the server in dev mode if MongoDB is not running; fall back gracefully
    console.log('Server running in standalone mode (no live database connection).');
  }
};

module.exports = connectDB;
