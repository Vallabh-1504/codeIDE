import { Server } from 'socket.io';
import { Queue } from 'bullmq';
import { PlaygroundJobData, PlaygroundJobSandboxResult } from '../types';

export const handlePlaygroundCompletion = async (
    io: Server, 
    playgroundQueue: Queue<PlaygroundJobData>, 
    jobId: string, 
    returnvalue: any
) => {
    try {
        const job = await playgroundQueue.getJob(jobId);
        if (!job) return;

        const { roomId } = job.data;
        const result: PlaygroundJobSandboxResult = typeof returnvalue === 'string' 
            ? JSON.parse(returnvalue) 
            : returnvalue;
        
        // Emit result back to client
        io.to(roomId).emit('playground-result', {
            jobId,
            success: result?.success,
            output: result?.output,
            error: result?.error
        });
    }
    catch(err){
        console.error(`[ResultHandler] Error processing job ${jobId}:`, err);
    }
};

export const handlePlaygroundFailure = async (
    io: Server, 
    playgroundQueue: Queue<PlaygroundJobData>, 
    jobId: string, 
    failedReason: string
) => {
    try {
        const job = await playgroundQueue.getJob(jobId);
        if (!job) return;

        const { roomId } = job.data;
        
        // Emitting the failure back to the client
        io.to(roomId).emit('playground-result', {
            jobId,
            success: false,
            output: '',
            error: failedReason
        });
    }
    catch(err){
        console.error(`[ResultHandler] Error processing failure for job ${jobId}:`, err);
    }
};