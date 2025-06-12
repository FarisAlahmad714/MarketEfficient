// lib/database.js
const mongoose = require('mongoose');
const logger = require('./logger').default;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 50, // Increased pool size for better concurrency
      minPoolSize: 5,  // Maintain minimum connections
      serverSelectionTimeoutMS: 10000, // Increased timeout for reliability
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000, // Close idle connections after 30s
      retryWrites: true,
      writeConcern: { w: 'majority' },
      // Connection monitoring
      heartbeatFrequencyMS: 10000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        logger.log('MongoDB connected successfully');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
          logger.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
        });
        
        // Load all models after connection
        require('../models/index');
        return mongoose;
      })
      .catch((err) => {
        logger.error('MongoDB connection failed:', err);
        cached.promise = null; // Reset so we can retry
        throw err;
      });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  
  return cached.conn;
}

module.exports = connectDB;