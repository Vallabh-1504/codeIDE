import { Worker, Job } from 'bullmq';
import { ENV } from '../config/env';
import { redisConnection } from '../config/redis';
import { JudgeJobData } from '../types';
// import { processJudgeJob } from '../handlers/judgeHandler';

const QUEUE_NAME = ENV.PLAYGROUND_QUEUE_NAME;

export const setupJudgeWorker = () =>{
    const worker = new Worker<JudgeJobData>(
        QUEUE_NAME,
        async (job: Job<JudgeJobData>) => {
            // Pass the job payload straight to handler ("Controller")
            // return await processJudgeJob(job);
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
