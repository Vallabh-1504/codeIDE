import express, {Request, Response, NextFunction} from 'express';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

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

app.get('/', (req: Request, res: Response) =>{
    res.status(200).json({ message: "server is running on PORT:", PORT });
});

app.post('/run', async (req: Request, res: Response, next: NextFunction) =>{
    const {code} = req.body;

    if(!code){
        return res.status(400).json({ error: "Code is required" });
    }

    try{
        const job = await codeExecutionQueue.add('execution-job', { code: code });

        console.log(`[server] ${job.id} added to queue.`);

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

app.listen(PORT, () =>{
    console.log(`API Server running on port ${PORT}`);
});