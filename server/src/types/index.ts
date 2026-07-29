export interface PlaygroundJobData {
    code: string;
    language: 'cpp' | 'python';
    stdin?: string;
    roomId: string;
    // jobId: string;
}

export interface PlaygroundJobSandboxResult{
    success: boolean;
    output: string;
    error?: string;
}