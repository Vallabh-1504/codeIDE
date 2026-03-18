import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from './config';

// connection to redis
export const redisConnection = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
});

redisConnection.on('connect', () =>{
    console.log(`[Redis] redis Connected`);
});

redisConnection.on('error', (err) =>{
    console.error('[Redis] Error connecting:', err);
});
