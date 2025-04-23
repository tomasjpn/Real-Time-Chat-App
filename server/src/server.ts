import cors from '@fastify/cors';
import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import fastifyPostgres from '@fastify/postgres';
import { db, initializeDatabase } from '../db/config/db.js';
import { sql } from 'drizzle-orm';
import { CONFIG } from '../db/config/config.js';

const server = Fastify({
  logger: true,
});

async function startServer() {
  try {
    // Run database migrations
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error('Failed to initialize database');
    }

    // Register PostgreSQL
    await server.register(fastifyPostgres, {
      connectionString: CONFIG.db.connectionString,
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

    // Example route using the database
    server.get('/users', async () => {
      try {
        const users = await db.execute(sql`SELECT * FROM users`);
        return users;
      } catch (error) {
        console.error('Error fetching users:', error);
        return { error: 'Failed to fetch users' };
      }
    });

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

        socket.on('new-user', async (userName: string) => {
          connectedUsers[socket.id] = userName;

          try {
            const tableInfoQuery = await db.execute(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = 'users'
            `);

            console.log(
              'Available columns:',
              tableInfoQuery.rows.map((row) => row.column_name)
            );

            // Insert the user into the database
            const userResult = await db.execute(sql`
              INSERT INTO users (name) VALUES (${userName}) RETURNING *
            `);
            console.log('User insert result:', userResult);

            // extract UserID
            let userId;
            if (Array.isArray(userResult) && userResult.length > 0) {
              // If it's an array of rows
              userId = userResult[0].id;
            } else if (userResult.rows && userResult.rows.length > 0) {
              // If it's a pg-style result object
              userId = userResult.rows[0].id;
            } else {
              throw new Error('Could not retrieve user ID from insert result');
            }

            // Insert the chatroom
            const chatroomResult = await db.execute(sql`
              INSERT INTO chatrooms (name) VALUES (${`room_${socket.id}`}) RETURNING *
            `);
            console.log('Chatroom insert result:', chatroomResult);

            let chatroomId;
            if (Array.isArray(chatroomResult) && chatroomResult.length > 0) {
              chatroomId = chatroomResult[0].id;
            } else if (chatroomResult.rows && chatroomResult.rows.length > 0) {
              chatroomId = chatroomResult.rows[0].id;
            } else {
              throw new Error(
                'Could not retrieve chatroom ID from insert result'
              );
            }

            // Link the user to the chatroom
            await db.execute(sql`
              INSERT INTO user_chatrooms (user_id, chatroom_id) 
              VALUES (${userId}, ${chatroomId})
            `);

            // Send the user their own socket ID and the current user list
            socket.emit('self-id', socket.id);
            server.io.emit('user-list', connectedUsers);
          } catch (error) {
            console.error('Error creating new user:', error);
          }
        });

        socket.on(
          'private-message',
          async ({
            targetId,
            message,
          }: {
            targetId: string;
            message: string;
          }) => {
            const senderName = connectedUsers[socket.id];
            console.log(
              `Private message from ${senderName} to ${targetId}: ${message}`
            );

            try {
              // Find the user ID from the name
              const usersResult = await db.execute(sql`
                SELECT id FROM users WHERE name = ${senderName} LIMIT 1
              `);
              console.log('User select result:', usersResult);

              let userId;
              if (Array.isArray(usersResult) && usersResult.length > 0) {
                userId = usersResult[0].id;
              } else if (usersResult.rows && usersResult.rows.length > 0) {
                userId = usersResult.rows[0].id;
              } else {
                console.log(
                  'User not found in database, sending message without saving to DB'
                );

                server.io.to(targetId).emit('receive-private-message', {
                  senderId: socket.id,
                  senderName: senderName,
                  message: message,
                });
                return;
              }

              // Find the chatroom associated with this communication
              const userChatroomsResult = await db.execute(sql`
                SELECT chatroom_id FROM user_chatrooms WHERE user_id = ${userId} LIMIT 1
              `);

              console.log('User chatrooms result:', userChatroomsResult);

              let chatroomId;
              if (
                Array.isArray(userChatroomsResult) &&
                userChatroomsResult.length > 0
              ) {
                chatroomId = userChatroomsResult[0].chatroom_id;
              } else if (
                userChatroomsResult.rows &&
                userChatroomsResult.rows.length > 0
              ) {
                chatroomId = userChatroomsResult.rows[0].chatroom_id;
              } else {
                console.log(
                  'Chatroom not found, sending message without saving to DB'
                );

                server.io.to(targetId).emit('receive-private-message', {
                  senderId: socket.id,
                  senderName: senderName,
                  message: message,
                });
                return;
              }

              // Insert the message
              await db.execute(sql`
                INSERT INTO messages (chatroom_id, user_id, content) 
                VALUES (${chatroomId}, ${userId}, ${message})
              `);

              server.io.to(targetId).emit('receive-private-message', {
                senderId: socket.id,
                senderName: senderName,
                message: message,
              });
            } catch (error) {
              console.error('Error sending private message:', error);
              server.io.to(targetId).emit('receive-private-message', {
                senderId: socket.id,
                senderName: senderName,
                message: message,
              });
            }
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

    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

startServer();
