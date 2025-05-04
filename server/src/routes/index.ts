import { FastifyInstance } from 'fastify';
import { userRoutes } from './userRoute.js';
import chatRoutes from './chatRoute.js';

export async function initializeRoutes(server: FastifyInstance) {
  server.log.info('Initializing API routes');

  server.get('/', async () => {
    return { message: 'Chat server is running' };
  });

  try {
    server.log.info('Registering user routes');
    await server.register(userRoutes);
    server.log.info('User routes registered successfully');
  } catch (error) {
    server.log.error({ err: error }, 'Failed to register user routes');
    throw error;
  }

  try {
    server.log.info('Registering chat routes');
    await server.register(chatRoutes);
    server.log.info('Chat routes registered successfully');
  } catch (error) {
    server.log.error({ err: error }, 'Failed to register chat routes');
    throw error;
  }

  server.log.info('Initializing all routes successfully');
}
