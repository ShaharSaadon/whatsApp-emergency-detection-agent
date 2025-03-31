import mongoose from 'mongoose';
import { env } from '../config';
import logger from './logger';

// Setup database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('📦 Connected to MongoDB successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle database connection events
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Handle application shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error during MongoDB connection closure:', error);
    process.exit(1);
  }
});

export default mongoose;
