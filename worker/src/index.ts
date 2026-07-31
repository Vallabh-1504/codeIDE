import dotenv from 'dotenv';
dotenv.config();

import { setupPlaygroundWorker } from './workers/PlaygroundWorkerSetup';
import { setupJudgeWorker } from './workers/JudgeWorkerSetup';
import { redisConnection } from './config/redis';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codeStudio';

console.log("Worker server starting...");

// Initiailze MongoDB
mongoose.connect(MONGO_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'error connecting to mongoDb'));
db.once('open', () => console.log('mongoDB connected to worker server'));

// Initialize the BullMQ Workers
const Playgroundworker = setupPlaygroundWorker();
const JudgeWorker = setupJudgeWorker();

// Graceful shutdown management
const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing worker...`);

    // Stop accepting new jobs and finish the current ones
    await Promise.all([
        Playgroundworker.close(),
        JudgeWorker.close(),
    ]);

    // close the Redis connection
    await redisConnection.quit();

    console.log('Worker closed. Exiting process');
    process.exit(0);
};

// Listen for termination signals from the OS or Docker
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle unhandled errors, so do not leave zombie process or docker container
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
