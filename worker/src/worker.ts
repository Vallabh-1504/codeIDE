import { Worker } from 'bullmq';
import { executeUserCode } from './executeUserCode';
import { redisConnection } from './redis';
import { QUEUE_NAME } from './config';

export const worker = new Worker(QUEUE_NAME, async (job) =>{
    if(!job) return;
    console.log(`[Worker] picked up ${job.id}.`);

    const {code} = job.data;
    if(!code){
        throw new Error("[worker] Job missing 'code'.");
    }

    try {
        const result = await executeUserCode(job.id || 'unknown', code);
        console.log(`[Worker] ${job.id} Finished. Success: ${result.success}`);

        return result; 
    }
    catch(err){
        console.error(`[Worker] error processing job ${job.id}:`, err);
        throw err;
    }
}, {
    connection: redisConnection as any,
    concurrency: 2,
});

worker.on('failed', (job, err) =>{
    if(job){
        console.error(`[Worker] Job ${job.id} Failed: ${err.message}`);
    }
});

