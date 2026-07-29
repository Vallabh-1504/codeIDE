import mongoose, { Schema, Document } from "mongoose";

export interface ITestCase extends Document {
    questionId: number;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

const TestCaseSchema = new Schema<ITestCase>({
    questionId: { 
        type: Number, 
        required: true, 
        index: true 
    },
    input: {
        type: String,
        required: true
    },

    expectedOutput: {
        type: String,
        required: true,
    },

    isHidden: {
        type: Boolean,
        default: true,
        required: true,
    },
});

export const TestCase = mongoose.model<ITestCase>('TestCase', TestCaseSchema);
