import fs from 'fs/promises';
import path from 'path';
import { ITestCase } from '../models/Testcase';
import { ISampleTestCase } from '../models/Question';

// centralized temp folder at the root of your project
const TEMP_DIR = path.resolve(__dirname, '../../temp');

export const createJudgeJobFiles = async (
    jobId: string,
    language: string,
    code: string,
    testCases: ITestCase[] | ISampleTestCase[]
) => {
    // 1. Create isolated directory for this specific job
    const jobDir = path.join(TEMP_DIR, jobId);
    await fs.mkdir(jobDir, { recursive: true });

    // 2. Define the exact file paths
    const extension = language === 'cpp' ? 'cpp' : 'py';
    const codeFilePath = path.join(jobDir, `main.${extension}`);
    const testCasesFilePath = path.join(jobDir, 'testcases.json');

    // 3. Write the files, Dump testcases as JSON Files for container script
    await fs.writeFile(codeFilePath, code);
    await fs.writeFile(testCasesFilePath, JSON.stringify(testCases));

    // 3. Write the core engine script into the sandbox
    const staticRunnerPath = path.resolve(__dirname, '../scripts/runner.py');
    const jobRunnerPath = path.join(jobDir, 'runner.py');
    await fs.copyFile(staticRunnerPath, jobRunnerPath);

    return { jobDir, codeFilePath, testCasesFilePath, jobRunnerPath };
};

export const cleanupJudgeJobFiles = async (jobId: string) => {
    const jobDir = path.join(TEMP_DIR, jobId);
    try {
        // Nuke the entire directory and everything inside it cleanly
        await fs.rm(jobDir, { recursive: true, force: true });
    }
    catch (error) {
        console.error(`[JudgeFileService] Cleanup failed for job ${jobId}:`, error);
    }
};


