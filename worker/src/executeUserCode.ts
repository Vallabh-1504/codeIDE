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

interface  LanguageConfig{
    extension: string,
    getCommand: (fileName: string, outName: string) => string;
}

const LANGUAGES: Record<string, LanguageConfig> = {
    cpp: {
        extension: 'cpp',
        getCommand: (fileName, outName) => `g++ ${fileName} -o ${outName} && ./${outName}`
    },
    python: {
        extension: 'py',
        getCommand: (fileName) => `python3 ${fileName}`
    },
};

// 2. Main function for execution engine
export const executeUserCode = (jobId: string, code: string, language: string): Promise<ExecutionResult> => {
    return new Promise((resolve, reject) => {
        const config = LANGUAGES[language];

        if(!config){
            return resolve({
                success: false,
                output: "",
                error: "Unsupported language"
            });
        }

        const fileName = `${jobId}_user_code.${config.extension}`;
        const outName = `${jobId}_user_code.out`; 
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
        const runCommand = config.getCommand(fileName, outName);
        
        const dockerCommand = `docker run --rm \
            --network none \
            --memory 100m \
            -v "${OUTPUT_DIR}:/app" \
            cee-image \
            /bin/sh -c "${runCommand}"`;

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