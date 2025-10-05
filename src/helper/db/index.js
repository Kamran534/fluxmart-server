import mongoose from 'mongoose';

// Configure global mongoose settings early
mongoose.set('strictQuery', true);

let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  const dbName = process.env.MONGODB_DB_NAME; // optional override

  const connectionOptions = {
    // Stable defaults
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 0),
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SRV_TIMEOUT_MS || 10000),
    socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000),
    // Indexes in prod can be controlled by migrations
    autoIndex: process.env.NODE_ENV !== 'production',
    // appName helps with server-side diagnostics
    appName: process.env.MONGODB_APP_NAME || 'fluxmart-server',
    // Only set dbName if provided to avoid overriding connection string db
    ...(dbName ? { dbName } : {}),
  };

  try {
    // Attach connection event logs once
    if (mongoose.connection.listeners('connected').length === 0) {
      mongoose.connection.on('connected', () => {
        console.log(` MongoDB connected `.bgGreen.black.bold);
      });
      mongoose.connection.on('error', (err) => {
        console.log(` MongoDB connection error: ${err.message} `.bgRed.white.bold);
      });
      mongoose.connection.on('disconnected', () => {
        console.log(' MongoDB disconnected '.bgYellow.black.bold);
      });
    }

    await mongoose.connect(mongoUri, connectionOptions);
    isConnected = true;
    return mongoose.connection;
  } catch (error) {
    isConnected = false;
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (!isConnected) return;
  try {
    await mongoose.connection.close();
  } finally {
    isConnected = false;
  }
};

export const getDatabaseConnection = () => mongoose.connection;

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseConnection,
};


