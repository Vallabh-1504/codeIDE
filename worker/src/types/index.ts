export interface PlaygroundJobData {
    code: string;
    language: 'cpp' | 'python';
    stdin?: string;
}

export interface JudgeJobData{
    jobType: 'run' | 'submit';
    questionId: number;
    language: 'cpp' | 'python';
    code: string;
    userId: string;
}

export interface PlaygroundJobSandboxResult{
    success: boolean;
    output: string;
    error?: string;
}

// The exact structure runner.py must write to results.json
export interface JudgeJobSandboxResult {
    status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compile Error' | 'Internal Error';
    totalTime: number;      // Sum of all test case execution times
    totalMemory: number;    // Max memory used (can default to 0 if hard to track initially)
    passedCases: number;
    totalCases: number;
    verdicts: TestCaseVerdict[]; // Granular details for each test case
}

export interface PlaygroundJobSandboxResult{
    success: boolean;
    output: string;
    error?: string;
}


export interface LanguageConfig{
    extension: string,
    getCommand: (fileName: string, outName: string) => string;
}

export interface TestCaseVerdict {
    status: 'AC' | 'WA' | 'TLE' | 'RE';
    time: number;
    expectedOutput?: string; // Only populated for 'run' / sample cases
    actualOutput?: string;   // Only populated for 'run' / sample cases
    errorDetails?: string;   // Stack trace or compilation errors
}
