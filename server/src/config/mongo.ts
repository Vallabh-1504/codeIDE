import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async () => {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        console.log('[server] MongoDB connected successfully');
    } 
    catch (error) {
        console.error('[server] MongoDB connection error:', error);
        process.exit(1);
    }
};