export type Language = "cpp" | "python";

export type RunStatus = "idle" | "queued" | "running" | "success" | "error";

export interface RunCodeRequest {
    code: string;
    roomId: string;
    language: Language;
    stdin?: string;
}

export interface RunCodeResponse {
    jobId: string;
    status: "queued";
}

export interface PlaygroundResultEvent {
    jobId: string;
    success: boolean;
    output: string;
    error?: string;
}

export interface ExecutionStartedEvent {
    jobId: string;
    status: "running";
}
