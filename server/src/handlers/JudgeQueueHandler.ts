import { Server } from 'socket.io';
import { Queue } from 'bullmq';
import { JudgeJobData, JudgeJobSandboxResult } from '../types';

export const handleJudgeCompletion = async (
    io: Server, 
    judgeQueue: Queue<JudgeJobData>, 
    jobId: string, 
    returnvalue: any
) => {
    try {
        const job = await judgeQueue.getJob(jobId);
        if(!job) return;

        // Extract roomId that we will inject during the HTTP request
        const { roomId, questionId } = job.data as any; 
        
        const result: JudgeJobSandboxResult = typeof returnvalue === 'string' 
            ? JSON.parse(returnvalue) 
            : returnvalue;
        
        io.to(roomId).emit('judge-result', {
            jobId,
            questionId,
            success: true,
            data: result
        });
    }
    catch (err) {
        console.error(`[JudgeResultHandler] Error processing job ${jobId}:`, err);
    }
};

export const handleJudgeFailure = async (
    io: Server, 
    judgeQueue: Queue<JudgeJobData>, 
    jobId: string, 
    failedReason: string
) => {
    try {
        const job = await judgeQueue.getJob(jobId);
        if (!job) return;

        const { roomId, questionId } = job.data as any;
        
        io.to(roomId).emit('judge-result', {
            jobId,
            questionId,
            success: false,
            error: failedReason
        });
    }
    catch (err) {
        console.error(`[JudgeResultHandler] Error processing failure for job ${jobId}:`, err);
    }
};