import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env .REDIS_PORT || '6379', 10), 

    PLAYGROUND_QUEUE_NAME: "playground-execution-queue",
    JUDGE_QUEUE_NAME: "judge-execution-queue",

    PLAYGROUND_WORKER_CONCURRENCY: 2,
    JUDGE_WORKER_CONCURRENCY: 2,
};


