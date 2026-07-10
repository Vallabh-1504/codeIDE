export interface PlaygroundJobData {
    code: string;
    language: 'cpp' | 'python';
    stdin?: string;
}

export interface ExecutionResult{
    success: boolean;
    output: string;
    error?: string;
}

export interface LanguageConfig{
    extension: string,
    getCommand: (fileName: string, outName: string) => string;
}

export interface JudgeJobData{
    jobType: 'run' | 'submit';
    questionId: number;
    language: 'cpp' | 'python';
    code: string;
    userId: string;
}