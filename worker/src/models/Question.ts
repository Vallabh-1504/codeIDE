import mongoose, {Schema, Document} from "mongoose";


// for sample cases for UI rendering
export interface ISampleTestCase {
    input: string;
    expectedOutput: string;
}

export interface IQuestion extends Document{
	questionId: Number;
	title: string;
	content: string;
	sampleTestCases: ISampleTestCase[];
}

const QuestionSchema = new Schema<IQuestion>({
    questionId: {
        type: Number,
        required: true,
        unique: true,
    },
    title: { 
        type: String, 
        required: true,
    },
    content: { 
        type: String, 
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

