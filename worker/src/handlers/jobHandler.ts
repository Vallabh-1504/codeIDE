import { Job } from 'bullmq';
import { PlaygroundJobData, ExecutionResult } from '../types';
import { createJobFiles, cleanupJobFiles } from '../services/FileService';
import { executeCode, getLanguageExtension } from '../services/ExecutionService';

export const processPlaygroundJob = async (job: Job<PlaygroundJobData>): Promise<ExecutionResult> => {
    const { code, language, stdin = '' } = job.data;
    const jobId = job.id || 'unknown-job';

    console.log(`[JobHandler] Processing job ${jobId}`);

    const extension = getLanguageExtension(language);
    if (!extension) {
        throw new Error(`[JobHandler] Unsupported language: ${language}`);
    }

    // Step 1: Create isolated environment
    const { jobDir } = await createJobFiles(jobId, extension, code, stdin);

    try {
        // Step 2: Execute code in sandbox
        const result = await executeCode(jobDir, language);
        console.log(`[JobHandler] Job ${jobId} finished. Success: ${result.success}`);
        return result;
    }
    catch (error) {
        console.error(`[JobHandler] Critical error during job ${jobId}:`, error);
        throw error;
    } 
    finally {
        // Step 3: Always Cleanup
        await cleanupJobFiles(jobId);
    }
};