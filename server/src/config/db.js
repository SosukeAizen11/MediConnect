import mongoose from 'mongoose';
import { config } from './env.js';
import logger from '../utils/logger.js';

const connectDB = async () => {
    try {
        mongoose.set('bufferCommands', false);
        await mongoose.connect(config.MONGO_URI);
        logger.info('MongoDB Connected');
    } catch (error) {
        logger.error(`MongoDB Connection Error: ${error.message}`);
        logger.error('Server is running without database connection. Ensure MongoDB is running locally.');
    }
};

export default connectDB;
