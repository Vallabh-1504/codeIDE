import { Request, Response } from 'express';
import { judgeQueue } from '../queues/JudgeQueue';
import { JudgeJobData } from '../types';

export const submitJudgeCode = async (req: Request, res: Response): Promise<void> => {
    const { code, language, questionId, jobType, userId, roomId } = req.body;

    if (!code || !language || !questionId || !jobType || !userId || !roomId) {
        res.status(400).json({ error: "Missing required fields for judge submission" });
        return;
    }

    try {
        // Construct the payload matching the worker's expectation, plus the roomId
        const jobData: JudgeJobData & { roomId: string } = { 
            jobType, // 'run' or 'submit'
            questionId, 
            language, 
            code, 
            userId,
            roomId 
        };
        
        console.log(`[JudgeController] Adding ${jobType} job for question ${questionId}`);
        const job = await judgeQueue.add('judge-job', jobData);

        res.status(202).json({
            jobId: job.id,
            status: "queued",
        });
    }
    catch (error) {
        console.error("[JudgeController] Queue Error:", error);
        res.status(500).json({ error: "Failed to queue judge job" });
    }
};