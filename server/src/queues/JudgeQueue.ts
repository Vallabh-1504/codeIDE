import { Queue, QueueEvents } from 'bullmq';
import { Server } from 'socket.io';
import { ENV } from '../config/env';
import { redisConnection } from '../config/redis';
import { JudgeJobData } from '../types';
import { handleJudgeCompletion, handleJudgeFailure } from '../handlers/JudgeQueueHandler';

const QUEUE_NAME = ENV.JUDGE_QUEUE_NAME;

export const judgeQueue = new Queue<JudgeJobData>(QUEUE_NAME, {
    connection: redisConnection as any
});

export const setupJudgeQueueListeners = (io: Server) => {
    const queueEvents = new QueueEvents(QUEUE_NAME, {
        connection: redisConnection as any
    });

    queueEvents.on('completed', async ({ jobId, returnvalue }) => {
        await handleJudgeCompletion(io, judgeQueue, jobId, returnvalue);
    });

    queueEvents.on('failed', async ({ jobId, failedReason }) => {
        await handleJudgeFailure(io, judgeQueue, jobId, failedReason);
    });

    return { judgeQueue, queueEvents };
};