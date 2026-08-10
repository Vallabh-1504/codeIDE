import mongoose, { Schema, Document } from "mongoose";
import { TestCaseVerdict } from "../types";

export interface ISubmission extends Document {
    userId: string;
    questionId: number;
    language: 'cpp' | 'python';
    status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compile Error' | 'Internal Error';
    passedCases: number;
    totalCases: number;
    totalTime: number;
    totalMemory: number;
    verdicts: TestCaseVerdict[];
}

const TestCaseVerdictSchema = new Schema<TestCaseVerdict>({
    status: { type: String, enum: ['AC', 'WA', 'TLE', 'RE', 'CE'], required: true },
    time: { type: Number, required: true },
    expectedOutput: { type: String },
    actualOutput: { type: String },
    errorDetails: { type: String },
}, { _id: false });

const SubmissionSchema = new Schema<ISubmission>({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    questionId: {
        type: Number,
        required: true,
        index: true,
    },
    language: {
        type: String,
        enum: ['cpp', 'python'],
        required: true,
    },
    status: {
        type: String,
        enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compile Error', 'Internal Error'],
        required: true,
    },
    passedCases: { type: Number, required: true },
    totalCases: { type: Number, required: true },
    totalTime: { type: Number, required: true },
    totalMemory: { type: Number, required: true },
    verdicts: [TestCaseVerdictSchema],
}, {
    timestamps: true,
});

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
