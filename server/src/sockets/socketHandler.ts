import { Server, Socket } from 'socket.io';

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`[socket] User Connected: ${socket.id}`);

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
            console.log(`[socket] User ${socket.id} joined room ${roomId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[socket] User disconnected: ${socket.id}`);
        });
        
        socket.on('execution-started', ({ roomId, jobId }) => {
            io.to(roomId).emit('execution-started', { jobId, status: 'running' });
        });
    });
};