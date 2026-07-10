import { exec } from 'child_process';
import { ExecutionResult, LanguageConfig } from '../types';

const LANGUAGES: Record<string, LanguageConfig> = {
    cpp: {
        extension: 'cpp',
        // compile output to 'out', then run it.
        getCommand: () => `g++ -O2 /app/main.cpp - o /app/out && /app/out`
    },
    python: {
        extension: 'py',
        getCommand: () => `python3 /app/main.py`
    },
};

export const getLanguageExtension = (language: string): string | null => {
    return LANGUAGES[language]?.extension || null;
};

// 2. Main function for execution engine
export const executePlaygroundJobSandbox = (jobDir: string, language: string): Promise<ExecutionResult> => {
    return new Promise((resolve, reject) => {
        const config = LANGUAGES[language];

        if(!config){
            return resolve({
                success: false,
                output: "",
                error: "Unsupported language"
            });
        }

        const runCommand = config.getCommand("/app", "/app");

        // mount the isolated jobDir, and not whole temp folder
        // 2. Construct Docker Command (inject the stdin via shell redirection `<`)
        const dockerCommand = `docker run --rm \
            --network none \
            --memory 100m \
            -v "${jobDir}:/app" \
            cee-image \
            /bin/sh -c "${runCommand} < /app/input.txt"`;

        // 3. Execute Docker command with timeout of 5 sec, timeout to check for TLE error
        exec(dockerCommand, {timeout: 5000}, (error, stdout, stderr) => { 
            if(error){
                // check if it was timeout or compilation error
                if(error.killed){
                    resolve({
                        success: false,
                        output: "Time Limit Exceeded (5s)",
                        error: "Process terminated due to timeout",
                    });
                }
                else{
                    resolve({
                        success: false,
                        output: stdout,
                        error: stderr || error.message,
                    });
                }
            }

            // Return the succesful execution output
            resolve({
                success: true,
                output: stdout,
            });
        });
    });
};

