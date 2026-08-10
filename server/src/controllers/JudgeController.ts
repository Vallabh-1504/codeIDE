import { Request, Response } from 'express';
import { judgeQueue } from '../queues/JudgeQueue';
import { JudgeJobData } from '../types';
import { Question } from '../models/Question';
import { Submission } from '../models/Submission';

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

export const getQuestionsController = async (_req: Request, res: Response): Promise<void> => {
    try {
        const questions = await Question.find().select('questionId title').sort('questionId');
        res.status(200).json(questions);
    }
    catch (error) {
        console.error("[JudgeController] Questions List Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch questions" });
    }
};

export const getQuestionController = async (req: Request, res: Response): Promise<void> => {
    const questionId = Number(req.params.questionId);

    if (!questionId || Number.isNaN(questionId)) {
        res.status(400).json({ error: "Valid questionId is required" });
        return;
    }

    try {
        const question = await Question.findOne({ questionId }).select('questionId title content sampleTestCases');

        if (!question) {
            res.status(404).json({ error: "Question not found" });
            return;
        }

        res.status(200).json(question);
    }
    catch (error) {
        console.error("[JudgeController] Question Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch question" });
    }
};

export const getSubmissionsController = async (req: Request, res: Response): Promise<void> => {
    const { userId, questionId } = req.query;

    if (!userId || !questionId || typeof userId !== 'string' || typeof questionId !== 'string') {
        res.status(400).json({ error: "userId and questionId are required" });
        return;
    }

    try {
        const submissions = await Submission.find({ userId, questionId: Number(questionId) })
            .sort('-createdAt')
            .limit(50);

        res.status(200).json(submissions);
    }
    catch (error) {
        console.error("[JudgeController] Submissions Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
};