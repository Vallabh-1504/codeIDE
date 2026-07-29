import { Request, Response } from 'express';
import { playgroundQueue } from '../queues/playgroundQueue';
import { PlaygroundJobData } from '../types/index';

export const runCodeController = async (req: Request, res: Response): Promise<void> => {
    const { code, roomId, language, stdin } = req.body;

    if (!code || !language || !roomId) {
        res.status(400).json({ error: "Code, language, and Room ID are required" });
        return;
    }

    try {
        const jobData: PlaygroundJobData = { code, roomId, language, stdin: stdin || "" };
        const job = await playgroundQueue.add('execution-job', jobData);

        console.log(`[server] Job ${job?.id} added to playground queue for room ${roomId}.`);

        res.status(202).json({
            jobId: job.id,
            status: "queued",
        });
    }
    catch (err) {
        console.error("Queue Error:", err);
        res.status(500).json({ error: "Failed to queue job" });
    }
};

export const getJobStatusController = async (req: Request, res: Response): Promise<void> => {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!jobId) {
        res.status(400).json({ error: "Job ID required" });
        return;
    }

    try {
        const job = await playgroundQueue.getJob(jobId);

        if (!job) {
            res.status(404).json({ error: "Job not found" });
            return;
        }

        const state = await job.getState();
        const result = job.returnvalue;

        res.status(200).json({
            jobId,
            state,
            result: state === 'completed' ? result : null,
            error: job.failedReason
        });
    }
    catch (err) {
        console.error("Status Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch status" });
    }
};