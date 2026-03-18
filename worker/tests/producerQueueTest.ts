import { Queue } from "bullmq";
import Redis from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

// connection to redis
const redisConnection = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
});


redisConnection.on('connect', () =>{
    console.log('redis Connected');
});
redisConnection.on('error', (err) =>{
    console.error('Error connecting redis:', err);
});

const QUEUE_NAME = "code-execution-queue";
const queue = new Queue(QUEUE_NAME, {connection: redisConnection as any});

const addJob = async() =>{
    console.log('Adding code execution job to queue');

    const code = `
        #include <iostream>
        #include <unistd.h>
        int main(){
            sleep(2); // heavy work
            std::cout << "job executed by CEE" << std::endl;
        }
    `;

    const job = await queue.add(QUEUE_NAME, {
        code: code,
    });

    console.log(`[worker] ${job.id} job added.`);

}

addJob();