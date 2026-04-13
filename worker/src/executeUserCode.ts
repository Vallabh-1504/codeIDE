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
        // Reverting flags: Compiler warnings cannot catch runtime I/O failures
        getCommand: (fileName, outName) => `g++ -O2 ${fileName} -o ${outName} && ./${outName}`
    },
    python: {
        extension: 'py',
        getCommand: (fileName) => `python3 ${fileName}`
    },
};

// 2. Main function for execution engine
export const executeUserCode = (jobId: string, code: string, language: string, stdin: string): Promise<ExecutionResult> => {
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
        const inputName = `${jobId}_input.txt`;
        const filePath = path.join(OUTPUT_DIR, fileName);        
        const inputPath = path.join(OUTPUT_DIR, inputName);

        // 1. write user' code and input to file system
        try{
            fs.writeFileSync(filePath, code);
            fs.writeFileSync(inputPath, stdin);
        }
        catch(err){
            return resolve({
                success: false,
                output: "",
                error: "Failed to write code/input to file system."
            });
        }

        // 2. Construct Docker Command (inject the stdin via shell redirection `<`)
        const runCommand = config.getCommand(fileName, outName);
        
        const dockerCommand = `docker run --rm \
            --network none \
            --memory 100m \
            -v "${OUTPUT_DIR}:/app" \
            cee-image \
            /bin/sh -c "${runCommand} < ${inputName}"`;

        console.log(`[worker] Executing job ${jobId}`);

        // 3. Execute Docker command with timeout of 5 sec, timeout to check for TLE error
        exec(dockerCommand, {timeout: 5000}, (error, stdout, stderr) => { 

            // delete files after execution
            try{
                if(fs.existsSync(filePath)){
                    fs.unlinkSync(filePath);
                }
                
                const outPath = path.join(OUTPUT_DIR, outName);
                if(fs.existsSync(outPath)){
                    fs.unlinkSync(outPath);
                }

                if(fs.existsSync(inputPath)){
                    fs.unlinkSync(inputPath);
                }
            }
            catch(cleanUpError){
                console.error(`[worker] Failed to cleanup files for ${fileName}`);
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