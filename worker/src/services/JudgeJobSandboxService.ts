import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { JudgeJobSandboxResult } from '../types';

export const executeJudgeJobSandbox = (jobDir: string): Promise<JudgeJobSandboxResult> => {
    return new Promise((resolve, reject) => {
        // 1. Construct the Docker Command
        // mount the specific job directory and execute runner.py
        const dockerCommand = `docker run --rm \
            --network none \
            --memory 512m \
            --cpus 1.0 \
            -v "${jobDir}:/app" \
            cee-image \
            /bin/sh -c "python3 /app/runner.py"`;

        // 2. Execute with a Node-level safety timeout
        // 60-second limit to protect the worker server
        // (in case the Docker daemon itself hangs or the container deadlocks)
        exec(dockerCommand, { timeout: 60000 }, async (error, stdout, stderr) => {
            // 3. Get the Result dumped from Sandbox to results.json
            const resultsFilePath = path.join(jobDir, 'results.json');

            try {
                // 4. Read the verdict dumped by the Python script
                const fileContent = await fs.readFile(resultsFilePath, 'utf-8');
                const resultData: JudgeJobSandboxResult = JSON.parse(fileContent);
                
                resolve(resultData);
            }
            catch (readError) {
                // 5. Handle catastrophic sandbox failures (e.g., OOM killer destroyed container)
                console.error(`[JudgeExecution] Failed to parse results.json in ${jobDir}. Error:`, error?.message || stderr);
                
                resolve({
                    status: 'Internal Error',
                    totalTime: 0,
                    totalMemory: 0,
                    passedCases: 0,
                    totalCases: 0,
                    verdicts: [],
                });
            }
        });
    });
};