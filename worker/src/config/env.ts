import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env .REDIS_PORT || '6379', 10), 
    QUEUE_NAME: "code-execution-queue",
}
