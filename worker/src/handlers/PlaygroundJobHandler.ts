import { Job } from 'bullmq';
import { PlaygroundJobData, PlaygroundJobSandboxResult } from '../types';
import { createPlaygroundJobFiles, cleanupPlaygroundJobFiles } from '../services/PlaygroundJobFileService';
import { executePlaygroundJobSandbox, getLanguageExtension } from '../services/PlaygroundJobSandboxService';

export const processPlaygroundJob = async (job: Job<PlaygroundJobData>): Promise<PlaygroundJobSandboxResult> => {
    const { code, language, stdin = '' } = job.data;
    const jobId = job.id || 'unknown-job';

    console.log(`[JobHandler] Processing job ${jobId}`);

    const extension = getLanguageExtension(language);
    if (!extension) {
        throw new Error(`[JobHandler] Unsupported language: ${language}`);
    }

    // Step 1: Create isolated environment
    const { jobDir } = await createPlaygroundJobFiles(jobId, extension, code, stdin);

    try {
        // Step 2: Execute code in sandbox
        const result = await executePlaygroundJobSandbox(jobDir, language);
        console.log(`[JobHandler] Job ${jobId} finished. Success: ${result.success}`);
        return result;
    }
    catch (error) {
        console.error(`[JobHandler] Critical error during job ${jobId}:`, error);
        throw error;
    } 
    finally {
        // Step 3: Always Cleanup
        await cleanupPlaygroundJobFiles(jobId);
    }
};