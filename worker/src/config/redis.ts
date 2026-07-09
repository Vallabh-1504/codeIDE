import Redis from 'ioredis';
import { ENV } from './env';

// connection to redis
export const redisConnection = new Redis({
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    maxRetriesPerRequest: null,
});

redisConnection.on('connect', () =>{
    console.log(`[Redis] redis Connected`);
});

redisConnection.on('error', (err) =>{
    console.error('[Redis] Error connecting:', err);
});
