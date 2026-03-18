import { worker } from './worker';
import { redisConnection } from './redis';

console.log("[worker] Worker server started, waiting for jobs");

worker.on('ready', () => {
    console.log("[worker] Worker is ready to process jobs");
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing worker...`);
    await worker.close();
    await redisConnection.quit();
    console.log('Worker closed.');
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle unhandled errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
