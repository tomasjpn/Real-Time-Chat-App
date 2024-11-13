import cors from '@fastify/cors';
import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';

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

// Default "/" Path
server.get('/', async () => {
  return { message: 'Chat server is running' };
});

const userNames = {};

// Set up the socket event listeners
server.ready((err) => {
  if (err) throw err;

  /*
   * "io" => represents the Socket.IO server instance;
   *   - server.io.on => WebSocket connections and communication between clients and the server;
   *
   * socket.on => no real-time Websocket connection from Socket.IO rather just fastify own events
   */
  server.io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('new-user', (name: string) => {
      userNames[socket.id] = name;
      socket.broadcast.emit('user-connected', userNames);
    });

    // Listen for "chat-message" event from client
    socket.on('chat-message', (data: string) => {
      console.log('Received chat-message event from client:', data);

      // Emit the message back to the client
      socket.broadcast.emit('serverTransferedMessage', {
        message: data,
        userName: userNames[socket.id],
      });
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
      delete userNames[socket.id]; // Clean up disconnected user
      socket.broadcast.emit('user-connected', userNames);
      console.log('User disconnected:', userNames);
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
