import express, {Request, Response, NextFunction} from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import { ENV } from './config/env';
import { connectDB } from './config/mongo';
import playgroundRoutes from './routes/PlaygroundRoutes';
import { setupSocketHandlers } from './sockets/socketHandler';
import { setupPlaygroundQueueListeners } from './queues/playgroundQueue';

// 1. Initialize Express app
const app = express();

// 2. Initialize middleware
app.use(express.json());
app.use(cors());

// 3. Health Check
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: "CodeStudio API Server running", port: ENV.PORT });
});

// 4. REST Routes
app.use('/api/v1/playground', playgroundRoutes);

// 5. HTTP server and socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

// 6. Initialize Handlers & Listeners
setupSocketHandlers(io);
setupPlaygroundQueueListeners(io);

// 7. Boot
const startServer = async () => {
    await connectDB();
    server.listen(ENV.PORT, () => {
        console.log(`[server] API Server running on port ${ENV.PORT}`);
    });
};

startServer();