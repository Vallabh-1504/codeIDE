import { Language } from "./playground";

export type JobType = "run" | "submit";

export type JudgeStatus =
    | "Accepted"
    | "Wrong Answer"
    | "Time Limit Exceeded"
    | "Runtime Error"
    | "Compile Error"
    | "Internal Error";

export type VerdictStatus = "AC" | "WA" | "TLE" | "RE";

export interface SampleTestCase {
    input: string;
    expectedOutput: string;
}

export interface Question {
    questionId: number;
    title: string;
    content: string;
    sampleTestCases: SampleTestCase[];
}

export interface QuestionSummary {
    questionId: number;
    title: string;
}

export interface SubmitJudgeRequest {
    code: string;
    language: Language;
    questionId: number;
    jobType: JobType;
    userId: string;
    roomId: string;
}

export interface SubmitJudgeResponse {
    jobId: string;
    status: "queued";
}

export interface TestCaseVerdict {
    status: VerdictStatus;
    time: number;
    expectedOutput?: string;
    actualOutput?: string;
    errorDetails?: string;
}

export interface JudgeJobSandboxResult {
    status: JudgeStatus;
    totalTime: number;
    totalMemory: number;
    passedCases: number;
    totalCases: number;
    verdicts: TestCaseVerdict[];
}

export interface JudgeResultEvent {
    jobId: string;
    questionId: number;
    success: boolean;
    data?: JudgeJobSandboxResult;
    error?: string;
}

export interface Submission {
    _id: string;
    userId: string;
    questionId: number;
    language: Language;
    status: JudgeStatus;
    passedCases: number;
    totalCases: number;
    totalTime: number;
    totalMemory: number;
    verdicts: TestCaseVerdict[];
    createdAt: string;
}
