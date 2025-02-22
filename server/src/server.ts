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

  server.io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('new-user', (userName: string) => {
      connectedUsers[socket.id] = userName;
      // Send the user their own socket ID and the current user list
      socket.emit('self-id', socket.id);
      server.io.emit('user-list', connectedUsers);
    });

    socket.on(
      'private-message',
      ({ targetId, message }: { targetId: string; message: string }) => {
        const senderName = connectedUsers[socket.id];
        console.log(
          `Private message from ${senderName} to ${targetId}: ${message}`
        );

        // Send to specific socket ID
        server.io.to(targetId).emit('receive-private-message', {
          senderId: socket.id,
          senderName: senderName,
          message: message,
        });
      }
    );
    // Handle socket disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      delete connectedUsers[socket.id]; // Clean up disconnected user
      console.log('User disconnected:', connectedUsers);
      server.io.emit('user-list', connectedUsers);
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
