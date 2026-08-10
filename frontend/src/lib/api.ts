import axios from "axios";
import { RunCodeRequest, RunCodeResponse } from "@/types/playground";
import { Question, QuestionSummary, Submission, SubmitJudgeRequest, SubmitJudgeResponse } from "@/types/judge";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const apiClient = axios.create({
    baseURL: `${API_URL}/api/v1`,
});

export const runCode = async (payload: RunCodeRequest): Promise<RunCodeResponse> => {
    const response = await apiClient.post<RunCodeResponse>("/playground/run", payload);
    return response.data;
};

export const getQuestions = async (): Promise<QuestionSummary[]> => {
    const response = await apiClient.get<QuestionSummary[]>("/judge/questions");
    return response.data;
};

export const getQuestion = async (questionId: number): Promise<Question> => {
    const response = await apiClient.get<Question>(`/judge/questions/${questionId}`);
    return response.data;
};

export const submitJudge = async (payload: SubmitJudgeRequest): Promise<SubmitJudgeResponse> => {
    const response = await apiClient.post<SubmitJudgeResponse>("/judge/submit", payload);
    return response.data;
};

export const getSubmissions = async (userId: string, questionId: number): Promise<Submission[]> => {
    const response = await apiClient.get<Submission[]>("/judge/submissions", {
        params: { userId, questionId },
    });
    return response.data;
};
