import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    PORT: Number(process.env.PORT) || 3001,

    REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',

    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/codestudio',

    PLAYGROUND_QUEUE_NAME : "playground-execution-queue",
    JUDGE_QUEUE_NAME: "judge-execution-queue",
};