import cors from '@fastify/cors';
import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import fastifyPostgres from '@fastify/postgres';
import { db, initializeDatabase } from '../db/config/db.js';
import { sql } from 'drizzle-orm';
import { CONFIG } from '../db/config/config.js';
import { v4 as uuidv4 } from 'uuid';

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
      cors: {
        origin: ['http://localhost:5173'],
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

    //-----------------------------------------------------------------------------//

    // Map to track connected users with their UUID and socket info
    const connectedUsers: Record<
      string,
      {
        socketId: string;
        userName: string;
        dbUserId?: number;
      }
    > = {};

    // Reverse mapping for quick lookup: { socketId: uuid }
    const socketToUuid: Record<string, string> = {};

    type UserRecord = {
      id: number;
      uuid: string;
      name: string;
    };

    type ChatroomRecord = {
      id: number;
      name: string;
    };

    //-----------------------------------------------------------------------------//

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
          try {
            let userUuid: string;
            let userId: number;

            const getExistingUserResult = await db.execute(sql`
              SELECT id, uuid, name FROM users WHERE name = ${userName} LIMIT 1
            `);

            const extractedExistingUser =
              getExistingUserResult.rows &&
              getExistingUserResult.rows.length > 0
                ? (getExistingUserResult.rows[0] as UserRecord)
                : null;

            if (extractedExistingUser) {
              console.log('Existing user found:', extractedExistingUser);
              userUuid = extractedExistingUser.uuid;
              userId = extractedExistingUser.id;
            } else {
              //-----------------------------------------------------------------------------//

              // Generate UUID for the user
              userUuid = uuidv4();

              // Insert the user into the database
              const insertedUserResult = await db.execute(sql`
                INSERT INTO users (uuid, name) VALUES (${userUuid}, ${userName}) RETURNING *
              `);
              console.log('User insert result:', insertedUserResult.rows);

              // Extract user data from the result
              const extractedInsertedUser = Array.isArray(insertedUserResult)
                ? (insertedUserResult[0] as UserRecord)
                : (insertedUserResult.rows[0] as UserRecord);

              userId = extractedInsertedUser.id;
              userUuid = extractedInsertedUser.uuid;

              //-----------------------------------------------------------------------------//

              // Create a new chatroom for this user
              const insertedChatroomResult = await db.execute(sql`
                INSERT INTO chatrooms (name) VALUES (${`room_${userUuid}`}) RETURNING *
              `);
              console.log(
                'Chatroom insert result:',
                insertedChatroomResult.rows
              );

              const extractedInsertedChatroom = Array.isArray(
                insertedChatroomResult
              )
                ? (insertedChatroomResult[0] as ChatroomRecord)
                : (insertedChatroomResult.rows[0] as ChatroomRecord);

              const chatroomId = extractedInsertedChatroom.id;

              //-----------------------------------------------------------------------------//

              await db.execute(sql`
                INSERT INTO user_chatrooms (user_id, chatroom_id) 
                VALUES (${userId}, ${chatroomId})
              `);
            }

            // Store user information in memory
            connectedUsers[userUuid] = {
              socketId: socket.id,
              userName: userName,
              dbUserId: userId,
            };

            // Reverse mapping from socket to UUID
            socketToUuid[socket.id] = userUuid;

            // Send the user their own UUID and the current user list
            socket.emit('self-id', userUuid);

            // Transform the user list to send to clients
            const userListForClients = Object.entries(connectedUsers).reduce(
              (acc, [uuid, data]) => {
                acc[uuid] = data.userName;
                return acc;
              },
              {} as Record<string, string>
            );

            server.io.emit('user-list', userListForClients);
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
            // Get sender's UUID from socketId
            const senderUuid = socketToUuid[socket.id];
            if (!senderUuid || !connectedUsers[senderUuid]) {
              console.log('Unknown sender, message discarded');
              return;
            }

            const senderName = connectedUsers[senderUuid].userName;
            console.log(
              `Private message from ${senderName} (${senderUuid}) to ${targetId}: ${message}`
            );

            if (!connectedUsers[targetId]) {
              console.log('Target user not found:', targetId);
              return;
            }

            const targetSocketId = connectedUsers[targetId].socketId;

            try {
              const userId = connectedUsers[senderUuid].dbUserId;

              if (!userId) {
                console.log(
                  'User ID not found in memory, sending message without saving to DB'
                );
                server.io.to(targetSocketId).emit('receive-private-message', {
                  senderId: senderUuid,
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

              const chatroomResult = Array.isArray(userChatroomsResult)
                ? userChatroomsResult[0]
                : userChatroomsResult.rows[0];

              if (!chatroomResult) {
                console.log(
                  'Chatroom not found, sending message without saving to DB'
                );

                server.io.to(targetSocketId).emit('receive-private-message', {
                  senderId: senderUuid,
                  senderName: senderName,
                  message: message,
                });
                return;
              }
              const chatroomId = chatroomResult.chatroom_id;

              // Insert the message
              await db.execute(sql`
                INSERT INTO messages (chatroom_id, user_id, content) 
                VALUES (${chatroomId}, ${userId}, ${message})
              `);

              server.io.to(targetSocketId).emit('receive-private-message', {
                senderId: senderUuid,
                senderName: senderName,
                message: message,
              });
            } catch (error) {
              console.error('Error sending private message:', error);
              // Send message even if DB operation fails
              server.io.to(targetSocketId).emit('receive-private-message', {
                senderId: senderUuid,
                senderName: senderName,
                message: message,
              });
            }
          }
        );
        // Handle socket disconnection
        socket.on('disconnect', () => {
          console.log('User disconnected:', socket.id);
          // Find and remove user by socket ID
          const userUuid = socketToUuid[socket.id];
          if (userUuid) {
            delete connectedUsers[userUuid];
            delete socketToUuid[socket.id];

            // Transform the user list to send to clients
            const userListForClients = Object.entries(connectedUsers).reduce(
              (acc, [uuid, data]) => {
                acc[uuid] = data.userName;
                return acc;
              },
              {} as Record<string, string>
            );

            server.io.emit('user-list', userListForClients);
          }
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
