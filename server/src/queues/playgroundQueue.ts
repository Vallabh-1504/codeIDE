import { Queue, QueueEvents } from 'bullmq';
import { Server } from 'socket.io';
import { ENV } from '../config/env';
import { PlaygroundJobData } from '../types/index';
import { handlePlaygroundCompletion, handlePlaygroundFailure } from '../handlers/PlaygroundQueueHandler';
import { redisConnection } from '../config/redis';

const QUEUE_NAME = ENV.PLAYGROUND_QUEUE_NAME;

// Queue Producer
export const playgroundQueue = new Queue<PlaygroundJobData>(QUEUE_NAME, {
    connection : redisConnection as any
});

// inject IO instance to broadcast results
export const setupPlaygroundQueueListeners = (io: Server) => {
    // Queue listener
    const queueEvents = new QueueEvents(QUEUE_NAME, {
        connection: redisConnection as any
    });

    queueEvents.waitUntilReady().then(() => {
        console.log(`[QueueEvents] Ready and listening to queue: ${QUEUE_NAME}`);
    });

    queueEvents.on('completed', async ({ jobId, returnvalue }: any) => {
        await handlePlaygroundCompletion(io, playgroundQueue, jobId, returnvalue);        
    });


    queueEvents.on('failed', async ({ jobId, failedReason }: any) => {
        await handlePlaygroundFailure(io, playgroundQueue, jobId, failedReason);    
        });
};

