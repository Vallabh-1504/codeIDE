import { setupWorker } from './workers/PlaygroundWorkerSetup';
import { redisConnection } from './config/redis';

console.log("Worker server started, waiting for jobs");

// 1. Initialize the BullMQ Worker
const worker = setupWorker();

// Graceful shutdown management
const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing worker...`);

    // Stop accepting new jobs and finish the current ones
    await worker.close();

    // Sever the Redis connection cleanly
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
