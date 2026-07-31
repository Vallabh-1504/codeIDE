import { Worker, Job } from 'bullmq';
import { ENV } from '../config/env';
import { redisConnection } from '../config/redis';
import { processPlaygroundJob } from '../handlers/PlaygroundJobHandler';
import { PlaygroundJobData } from '../types';

const QUEUE_NAME = ENV.PLAYGROUND_QUEUE_NAME;

export const setupPlaygroundWorker = () => {
    const worker = new Worker<PlaygroundJobData>(
        QUEUE_NAME,
        async (job: Job<PlaygroundJobData>) => {
            // Pass the job payload straight to handler ("Controller")
            return await processPlaygroundJob(job);
        },
        {
            connection: redisConnection as any,
            concurrency: 2, 
        }
    );

    worker.on('ready', () => {
        console.log(`[Worker] Ready and polling queue: ${QUEUE_NAME}`);
    });

    worker.on('failed', (job, err) => {
        const jobId = job?.id || 'unknown';
        console.error(`[Worker] Job ${jobId} failed: ${err.message}`);
    });

    return worker;
};