import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { Question } from '../src/models/Question';
import { TestCase } from '../src/models/TestCase';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codestudio';
const SEEDS_DIR = path.join(__dirname, 'seeds');

// Transforms the JSON arrays into raw standard I/O strings
// Append trailing newline to simulate pressing 'Enter' at the end of input stream.
const formatTestCase = (tc: any) => {
    const inputStr = Array.isArray(tc.input) ? tc.input.join('\n') + '\n' : tc.input;
    const outputStr = Array.isArray(tc.expectedOutput) ? tc.expectedOutput.join('\n') + '\n' : tc.expectedOutput;
    
    return {
        ...tc,
        input: inputStr,
        expectedOutput: outputStr
    };
};

const runSeeder = async () => {
    try {
        // Connect to DB
        await mongoose.connect(MONGO_URI);
        console.log("[Seeder] mongodb connected")

        console.log("[Seeder] Wiping existing data");
        await Question.deleteMany({});
        await TestCase.deleteMany({});

        const questionFolders = await fs.readdir(SEEDS_DIR);
        let seededCount = 0;

        for (const folder of questionFolders) {
            const folderPath = path.join(SEEDS_DIR, folder);
            const stat = await fs.stat(folderPath);
            
            // Ignore static files at the root of /seeds if any exist
            if (!stat.isDirectory()) continue;

            // 1. Read files from the question directory
            const metadata = JSON.parse(await fs.readFile(path.join(folderPath, 'metadata.json'), 'utf-8'));
            const markdownContent = await fs.readFile(path.join(folderPath, 'description.md'), 'utf-8');
            
            // Read sample cases
            const rawSampleCases = JSON.parse(await fs.readFile(path.join(folderPath, 'sample-cases.json'), 'utf-8'));

            // Safely read and parse hidden cases, handling cases where the file is empty.
            const hiddenCasesContent = await fs.readFile(path.join(folderPath, 'hidden-cases.json'), 'utf-8');
            const rawHiddenCases = hiddenCasesContent.trim() ? JSON.parse(hiddenCasesContent) : [];

            // 2. Process Arrays into Raw Strings for the UI samples
            const sampleTestCases = rawSampleCases.map(formatTestCase);
            
            // 3. Construct and insert the main Question Document
            const questionDoc = {
                ...metadata,
                content: markdownContent,
                sampleTestCases: sampleTestCases
            };
            await Question.create(questionDoc);

            // 4. Process and insert BOTH sample and hidden test cases into the TestCase collection.
            const sampleCasesForJudge = rawSampleCases.map((tc: any) => ({
                ...formatTestCase(tc),
                questionId: metadata.questionId,
                isHidden: false
            }));

            const hiddenCases = rawHiddenCases.map((tc: any) => ({
                ...formatTestCase(tc),
                questionId: metadata.questionId,
                isHidden: true
            }));

            // Combine all cases for the judge
            const allTestCasesForJudge = [...sampleCasesForJudge, ...hiddenCases];

            if (allTestCasesForJudge.length > 0) {
                await TestCase.insertMany(allTestCasesForJudge);
            }

            console.log(`Seeded Question ${metadata.questionId}: ${metadata.title}`);
            seededCount++;
        }

        console.log(`\n[Seeder] Successfully seeded ${seededCount} questions.`);
        process.exit(0);
    }
    catch (error) {
        console.error("[Seeder] Fatal Error during seeding:", error);
        process.exit(1);
    }
};

runSeeder();