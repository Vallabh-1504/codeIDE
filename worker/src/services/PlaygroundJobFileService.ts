import fs from 'fs/promises';
import path from 'path';

// centralized temp folder at the root of your project
const TEMP_DIR = path.resolve(__dirname, '../../temp');

export const createPlaygroundJobFiles = async (jobId: string, extension: string, code: string, stdin: string = '') => {
    // 1. Create isolated directory for this specific job
    const jobDir = path.join(TEMP_DIR, jobId);
    await fs.mkdir(jobDir, { recursive: true });

    // 2. Define the exact file paths
    const codeFilePath = path.join(jobDir, `main.${extension}`);
    const inputFilePath = path.join(jobDir, 'input.txt');
    const outFilePath = path.join(jobDir, 'out'); // for compiled cpp binary

    // 3. Write the files
    await fs.writeFile(codeFilePath, code);
    await fs.writeFile(inputFilePath, stdin);

    return { jobDir, codeFilePath, inputFilePath, outFilePath };
};

export const cleanupPlaygroundJobFiles = async (jobId: string) => {
    const jobDir = path.join(TEMP_DIR, jobId);
    try {
        // Nuke the entire directory and everything inside it cleanly
        await fs.rm(jobDir, { recursive: true, force: true });
    }
    catch (error) {
        console.error(`[FileService] Failed to cleanup directory for job ${jobId}:`, error);
    }
};