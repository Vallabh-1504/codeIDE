import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

// 1. Create output directory to store temporary code
const OUTPUT_DIR = path.join(__dirname, '../temp');
if(!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR, {recursive: true});
}

export interface ExecutionResult{
    success: boolean;
    output: string;
    error?: string;
}

// 2. Main function for execution engine
export const executeUserCode = (jobId: string, code: string): Promise<ExecutionResult> => {
    return new Promise((resolve, reject) => {
        const fileName = `${jobId}_user_code.cpp`;
        const outName = `${jobId}_user_code.out`; // Compiled binary
        const filePath = path.join(OUTPUT_DIR, fileName);

        // 1. write user' code to file
        try{
            fs.writeFileSync(filePath, code);
        }
        catch(err){
            return resolve({
                success: false,
                output: "",
                error: "Failed to write code to file system."
            });
        }

        // 2. Construct Docker Command
        const dockerCommand = `docker run --rm \
            --network none \
            --memory 100m \
            -v "${OUTPUT_DIR}:/app" \
            cpp-runner-image \
            /bin/sh -c "g++ ${fileName} -o /tmp/${outName} && /tmp/${outName}"`;

        console.log(`[worker] Executing job ${jobId}`);

        // 3. Execute Docker command with timeout of 5 sec, timeout to check for TLE error
        exec(dockerCommand, {timeout: 5000}, (error, stdout, stderr) => { 

            // delete file after execution
            try{
                if(fs.existsSync(filePath)){
                    fs.unlinkSync(filePath);
                }
                
                const outPath = path.join(OUTPUT_DIR, outName);
                if(fs.existsSync(outPath)){
                    fs.unlinkSync(outPath);
                }

            }
            catch(cleanUpError){
                console.error(`[worker] Failed to cleanup file ${fileName}`);
            }

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