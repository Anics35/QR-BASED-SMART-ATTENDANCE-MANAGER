const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Added options for better stability on slow networks
    await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 50000, // Increase timeout to 50s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log('DB connection established ✅');
  } catch (err) {
    console.error('DB connection failed ❌', err.message);
    // Don't exit immediately, let it retry (optional, but good for dev)
    // process.exit(1); 
  }
};

module.exports = connectDB;