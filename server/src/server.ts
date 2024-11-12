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

    // Listen for "chat-message" event from client
    socket.on('chat-message', (data: string) => {
      console.log('Received chat-message event from client:', data);

      // Emit the "secret" message back to the client
      socket.broadcast.emit('test', data);
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
      console.log('A user disconnected');
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
