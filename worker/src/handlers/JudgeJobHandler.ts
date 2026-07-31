import { Job } from 'bullmq';
import { JudgeJobData } from '../types';
import { TestCase } from '../models/Testcase';
import { Question } from '../models/Question';
import { createJudgeJobFiles, cleanupJudgeJobFiles } from '../services/JudgeJobFileService';
import { executeJudgeJobSandbox } from '../services/JudgeJobSandboxService';

export const processJudgeJob = async (job: Job<JudgeJobData>) => {
    const { jobType, questionId, language, code } = job.data;
    const jobId = job.id || 'unknown-judge-job';
    let jobDir: string | null = null;

    console.log(`[JudgeHandler] Executing ${jobType} for Question ${questionId} (Job: ${jobId})`);

    try{
        // 1. Fetch the testcases to run the code on, based on execution type
        let testCasesToEvaluate;

        // Route the query based on the execution type
        if (jobType === 'run') {
            // Fetch only the sample test cases embedded in the Question document
            const question = await Question.findOne({ questionId })
                .select('sampleTestCases')
                .lean();
            
            if (!question || !question.sampleTestCases.length) {
                throw new Error(`No sample test cases found for Question ${questionId}`);
            }
            testCasesToEvaluate = question.sampleTestCases;
        }
        else {
            // Fetch all hidden test cases from the dedicated collection
            testCasesToEvaluate = await TestCase.find({ questionId }).lean();
            
            if (!testCasesToEvaluate.length) {
                throw new Error(`No hidden test cases found for Question ${questionId}`);
            }
        }

        

        // 2. Create isolated environment
        const fileData  = await createJudgeJobFiles(jobId, language, code, testCasesToEvaluate);
        jobDir = fileData.jobDir;

        // 3. Trigger the docker engine
        const result = await executeJudgeJobSandbox(jobDir);
        return result;
    }
    catch (error) {
        console.error(`[JudgeHandler] Error on job ${jobId}:`, error);
        throw error;
    } 
    finally {
        if (jobDir) {
            await cleanupJudgeJobFiles(jobId);
        }
    }
};