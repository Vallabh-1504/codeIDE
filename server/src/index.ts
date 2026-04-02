import express, {Request, Response, NextFunction} from 'express';
import { Queue, QueueEvents } from 'bullmq';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());


// http server and attaching socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

const PORT = Number(process.env.PORT) || 3000;

const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';

const QUEUE_NAME = 'code-execution-queue';
const codeExecutionQueue = new Queue(QUEUE_NAME, {
    connection:{
        host: REDIS_HOST,
        port: REDIS_PORT,
    }
});

// Create QueueEvents to listen for job completion
const queueEvents = new QueueEvents(QUEUE_NAME, {
    connection:{
        host: REDIS_HOST,
        port: REDIS_PORT,
    }
});

// Listen for job completion and broadcast results to the room
queueEvents.on('completed', async ({ jobId, returnvalue }: any) =>{
    console.log(`[server] Job ${jobId} completed.`);
    
    try {
        const job = await codeExecutionQueue.getJob(jobId);
        if(job){
            const { roomId } = job.data;
            
            // parse returnvalue if it's a string, otherwise fallback to job.returnvalue, BullMQ behaviour
            let result = typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue;
            result = result || job.returnvalue;
            
            // Broadcast execution result to all clients in the room
            io.to(roomId).emit('execution-result', {
                jobId: jobId,
                success: result?.success,
                output: result?.output,
                error: result?.error
            });
        }
    }
    catch(err){
        console.error(`[server] Error broadcasting job ${jobId} completion:`, err);
    }
});

// Listen for job failure and broadcast error to the room
queueEvents.on('failed', async ({ jobId, failedReason }: any) =>{
    console.log(`[server] Job ${jobId} failed.`);
    
    try{
        const job = await codeExecutionQueue.getJob(jobId);
        if(job){
            const { roomId } = job.data;
            
            // Broadcast execution error to all clients in the room
            io.to(roomId).emit('execution-result', {
                jobId: jobId,
                success: false,
                output: '',
                error: failedReason
            });
        }
    }
    catch(err){
        console.error(`[server] Error broadcasting job ${jobId} failure:`, err);
    }
});

// socket.io connection
io.on('connection', (socket) =>{
    console.log(`User Connected:${socket.id}`);

    socket.on('join-room', (roomId) =>{
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('disconnect', () =>{
        console.log(`User disconnected: ${socket.id}`);
    });
});

// api routes

app.get('/', (req: Request, res: Response) =>{
    res.status(200).json({ message: "server is running on PORT:", PORT });
});

app.post('/run', async (req: Request, res: Response, next: NextFunction) =>{
    const {code, roomId} = req.body;

    if(!code){
        return res.status(400).json({ error: "Code is required" });
    }

    if(!roomId){
        return res.status(400).json({ error: "Room ID is required" });
    }

    try{
        const job = await codeExecutionQueue.add('execution-job', { code: code, roomId: roomId });

        console.log(`[server] ${job.id} added to queue for room ${roomId}.`);

        // Broadcast "running" status to all clients in the room
        io.to(roomId).emit('execution-started', {
            jobId: job.id,
            status: 'running'
        });

        res.status(202).json({
            jobId: job.id,
            status: "queued",
        });
    }
    catch(err){
        console.error("Queue Error:", err);
        res.status(500).json({ error: "Failed to queue job" });
    }
});

// GET /status/:id -> check job status
app.get('/status/:id', async (req, res) => {
    const jobId = req.params.id;

    if(!jobId){
        return res.status(400).json({ error: "Job ID required" });
    }

    try {
        const job = await codeExecutionQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        // Check state
        const state = await job.getState(); // completed, failed, active, waiting
        const result = job.returnvalue; // output of job from worker

        res.status(200).json({
            jobId,
            state,
            result: state === 'completed' ? result : null,
            error: job.failedReason
        });

    }
    catch (err){
        res.status(500).json({ error: "Failed to fetch status" });
    }
});

server.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
});