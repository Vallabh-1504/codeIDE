import mongoose, {Schema, Document} from "mongoose";


// for sample cases for UI rendering
export interface ISampleTestCase {
    input: string;
    expectedOutput: string;
}

export interface IQuestion extends Document{
	questionId: Number;
	title: string;
	description: string;
	inputFormat: string;
	outputFormat: string;
	constraints: string[];
	sampleTestCases: ISampleTestCase[];
}

const QuestionSchema = new Schema<IQuestion>({
    questionId: {
        type: Number,
        required: true,
    },
    title: { 
        type: String, 
        required: true,
    },
    description: { 
        type: String, 
        required: true,
    },
    inputFormat: {
        type: String,
        required: true,
    },
    outputFormat: {
        type: String,
        required: true,
    },
    constraints: {
        type: [String],
        required: true,
    },
    sampleTestCases: [{
        input: { 
            type: String, 
            required: true 
        },
        expectedOutput: { 
            type: String, 
            required: true 
        },
    }],
}, { 
    timestamps: true 
});


export const Question = mongoose.model<IQuestion>('Question', QuestionSchema); 

