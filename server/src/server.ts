import cors from '@fastify/cors';
import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import MAX_USERS_PER_CHAT from '../../src/defs/app-def.js';

const server = Fastify({
  logger: true,
});

// Register CORS
await server.register(cors, {
  origin: ['http://localhost:5173'], // Vite-React app's origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Register the Fastify-socket.io
await server.register(fastifyIO, {
  // This is the correct way to add the `cors` option
  cors: {
    origin: ['http://localhost:5173'], // Allow the Vite-React app's origin
    methods: ['GET', 'POST'],
  },
});

//-----------------------------------------------------------------------------//

// Default "/" Path
server.get('/', async () => {
  return { message: 'Chat server is running' };
});

const connectedUsers: Record<string, string> = {};

// Set up the socket event listeners
server.ready((err) => {
  if (err) throw err;

  /*
   * "io" => represents the Socket.IO server instance;
   *   - server.io.on => WebSocket connections and communication between clients and the server;
   *
   * socket.on => no real-time Websocket connection from Socket.IO rather just fastify own events
   */

  server.io.use((socket, next) => {
    const currentUserCount = Object.keys(connectedUsers).length;

    if (currentUserCount >= MAX_USERS_PER_CHAT) {
      const error = new Error('Chat room is full');
      error.name = 'UserLimitError';
      return next(error);
    }
    next();
  });
  server.io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('new-user', (userName: string) => {
      connectedUsers[socket.id] = userName;

      // Broadcast updated user list
      server.io.emit('user-connected', connectedUsers);
    });

    // Listen for "chat-message" event from client
    socket.on('chat-message', (message: string) => {
      console.log('Received chat-message event from client:', message);

      // Emit the message back to the client
      socket.broadcast.emit('serverTransferedMessage', {
        message,
        userName: connectedUsers[socket.id],
      });
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
      delete connectedUsers[socket.id]; // Clean up disconnected user
      socket.broadcast.emit('user-connected', connectedUsers);
      console.log('User disconnected:', connectedUsers);
    });
  });
});

// Start the server
try {
  await server.listen({ port: 3000 });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
