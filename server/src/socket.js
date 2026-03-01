import { Server } from 'socket.io';
import logger from './utils/logger.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        }
    });

    io.on('connection', (socket) => {
        logger.info(`Client connected: ${socket.id}`);

        // Join room specific to a clinic
        socket.on('join:clinic', (clinicId) => {
            socket.join(`clinic:${clinicId}`);
            logger.info(`Socket ${socket.id} joined room clinic:${clinicId}`);
        });

        socket.on('leave:clinic', (clinicId) => {
            socket.leave(`clinic:${clinicId}`);
            logger.info(`Socket ${socket.id} left room clinic:${clinicId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized');
    }
    return io;
};
