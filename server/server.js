import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './src/app.js';
import { config } from './src/config/env.js';
import connectDB from './src/config/db.js';
import logger from './src/utils/logger.js';
import { initSocket } from './src/socket.js';

// Connect to Database
connectDB();

const httpServer = createServer(app);
initSocket(httpServer);

const server = httpServer.listen(config.PORT, () => {
    logger.info(`Server running in ${config.NODE_ENV} mode on port http://localhost:${config.PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.PORT} is already in use. Please use a different port or kill the process using it.`);
        process.exit(1);
    }
    throw error;
});
