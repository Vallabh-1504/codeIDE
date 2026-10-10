import express, {Request, Response, NextFunction} from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import { ENV } from './config/env';
import { connectDB } from './config/mongo';

import playgroundRoutes from './routes/playgroundRoutes';
import judgeRoutes from './routes/judgeRoutes';

import { setupSocketHandlers } from './sockets/socketHandler';
import { setupPlaygroundQueueListeners } from './queues/playgroundQueue';
import { setupJudgeQueueListeners } from './queues/JudgeQueue';

// 1. Initialize Express app
const app = express();

// 2. Initialize middleware
const allowedOrigins = [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'];

app.use(express.json());
app.use(cors({
    origin: allowedOrigins
}));

// 3. Health Check
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: "CodeStudio API Server running", port: ENV.PORT });
});

// 4. REST Routes
app.use('/api/v1/playground', playgroundRoutes);
app.use('/api/v1/judge', judgeRoutes);

// 5. HTTP server and socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
    }
});

// 6. Initialize Handlers & Listeners
setupSocketHandlers(io);
setupPlaygroundQueueListeners(io);
setupJudgeQueueListeners(io);

// 7. Boot
const startServer = async () => {
    await connectDB();
    server.listen(ENV.PORT, () => {
        console.log(`[server] API Server running on port ${ENV.PORT}`);
    });
};

startServer();