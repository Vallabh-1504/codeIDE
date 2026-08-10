import { Server } from 'socket.io';
import { Queue } from 'bullmq';
import { JudgeJobData, JudgeJobSandboxResult } from '../types';
import { Submission } from '../models/Submission';

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
        const { roomId, questionId, userId, language, jobType } = job.data as any;

        const result: JudgeJobSandboxResult = typeof returnvalue === 'string'
            ? JSON.parse(returnvalue)
            : returnvalue;

        io.to(roomId).emit('judge-result', {
            jobId,
            questionId,
            success: true,
            data: result
        });

        if (jobType === 'submit') {
            try {
                await Submission.create({
                    userId,
                    questionId,
                    language,
                    status: result.status,
                    passedCases: result.passedCases,
                    totalCases: result.totalCases,
                    totalTime: result.totalTime,
                    totalMemory: result.totalMemory,
                    verdicts: result.verdicts,
                });
            }
            catch (persistErr) {
                console.error(`[JudgeResultHandler] Failed to persist submission for job ${jobId}:`, persistErr);
            }
        }
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