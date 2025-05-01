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

    server.get(
      '/chat-history/:userUuid/:targetUserUuid',
      async (request, reply) => {
        try {
          const { userUuid, targetUserUuid } = request.params as {
            userUuid: string;
            targetUserUuid: string;
          };

          const getUserResult = await db.execute(sql`
          SELECT id FROM users WHERE uuid = ${userUuid} LIMIT 1
        `);

          const getTargetUserResult = await db.execute(sql`
          SELECT id FROM users WHERE uuid = ${targetUserUuid} LIMIT 1
        `);

          if (!getUserResult.rows.length || !getTargetUserResult.rows.length) {
            return reply
              .code(404)
              .send({ error: 'One or both users not found' });
          }

          const userId = getUserResult.rows[0].id;
          const targetUserId = getTargetUserResult.rows[0].id;

          const sharedChatroomsResult = await db.execute(sql`
          SELECT uc1.chatroom_id 
          FROM user_chatrooms uc1
          JOIN user_chatrooms uc2 ON uc1.chatroom_id = uc2.chatroom_id
          WHERE uc1.user_id = ${userId} AND uc2.user_id = ${targetUserId}
          LIMIT 1
        `);

          if (!sharedChatroomsResult.rows.length) {
            return reply.send({ messages: [] });
          }

          const extractedChatroomId = sharedChatroomsResult.rows[0].chatroom_id;

          // Get messages from this chatroom with sender information
          const getMessagesResult = await db.execute(sql`
            SELECT m.id, m.user_id, m.content, m.created_at, u.name as sender_name, u.uuid as sender_uuid
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.chatroom_id = ${extractedChatroomId}
            ORDER BY m.created_at ASC
          `);

          // Format messages for client
          const formattedMessages = getMessagesResult.rows.map((msg) => ({
            senderId: msg.sender_uuid,
            senderName: msg.sender_name,
            message: msg.content,
            timestamp: msg.created_at,
            isSelf: msg.sender_uuid === userUuid,
          }));

          return reply.send({ formattedMessages });
        } catch (error) {
          console.error('Error fetching chat history:', error);
          return reply
            .code(500)
            .send({ error: 'Failed to fetch chat history' });
        }
      }
    );

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
              const targetUserId = connectedUsers[targetId].dbUserId;
              let extractedChatroomId;

              if (!userId || !targetUserId) {
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

              const getSharedChatroomsResult = await db.execute(sql`
                SELECT uc1.chatroom_id 
                FROM user_chatrooms uc1
                JOIN user_chatrooms uc2 ON uc1.chatroom_id = uc2.chatroom_id
                WHERE uc1.user_id = ${userId} AND uc2.user_id = ${targetUserId}
                LIMIT 1
              `);

              if (getSharedChatroomsResult.rows.length === 0) {
                const newChatroomResult = await db.execute(sql`
                  INSERT INTO chatrooms (name) 
                  VALUES (${`room_${senderUuid}_${targetId}`}) 
                  RETURNING id
                `);

                extractedChatroomId = newChatroomResult.rows[0].id;

                await db.execute(sql`
                  INSERT INTO user_chatrooms (user_id, chatroom_id) 
                  VALUES (${userId}, ${extractedChatroomId}), (${targetUserId}, ${extractedChatroomId})
                `);
              } else {
                extractedChatroomId =
                  getSharedChatroomsResult.rows[0].chatroom_id;
              }

              // Insert the message
              await db.execute(sql`
                INSERT INTO messages (chatroom_id, user_id, content) 
                VALUES (${extractedChatroomId}, ${userId}, ${message})
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

        socket.on(
          'fetch-chat-history',
          async ({ targetId }: { targetId: string }) => {
            const senderUuid = socketToUuid[socket.id];
            if (!senderUuid || !connectedUsers[senderUuid]) {
              console.log('Unknown sender, cannot fetch chat history');
              return;
            }

            try {
              let chatroomId;
              const getUserResult = await db.execute(sql`
               SELECT id 
               FROM users 
               WHERE uuid = ${senderUuid} 
               LIMIT 1
               `);

              const getTargetUserResult = await db.execute(sql`
               SELECT id 
               FROM users 
               WHERE uuid = ${targetId} 
               LIMIT 1
               `);

              if (
                !getUserResult.rows.length ||
                !getTargetUserResult.rows.length
              ) {
                socket.emit('chat-history', {
                  error: 'One or both users not found',
                  messages: [],
                });
                return;
              }

              const userId = getUserResult.rows[0].id;
              const targetUserId = getTargetUserResult.rows[0].id;

              const sharedChatroomsQuery = sql`
              SELECT uc1.chatroom_id 
              FROM user_chatrooms uc1
              JOIN user_chatrooms uc2 ON uc1.chatroom_id = uc2.chatroom_id
              WHERE uc1.user_id = ${userId} AND uc2.user_id = ${targetUserId}
              LIMIT 1
              `;

              const getSharedChatroomsResult =
                await db.execute(sharedChatroomsQuery);

              if (getSharedChatroomsResult.rows.length === 0) {
                const newChatroomResult = await db.execute(sql`
                  INSERT INTO chatrooms (name) 
                  VALUES (${`room_${senderUuid}_${targetId}`}) 
                  RETURNING id
                `);

                chatroomId = newChatroomResult.rows[0].id;

                await db.execute(sql`
                INSERT INTO user_chatrooms (user_id, chatroom_id) 
                VALUES (${userId}, ${chatroomId}), (${targetUserId}, ${chatroomId})
                `);
                socket.emit('chat-history', { messages: [] });
                return;
              } else {
                chatroomId = getSharedChatroomsResult.rows[0].chatroom_id;
              }

              const getMessagesResult = await db.execute(sql`
                SELECT m.id, m.user_id, m.content, m.created_at, u.name as sender_name, u.uuid as sender_uuid
                FROM messages m
                JOIN users u ON m.user_id = u.id
                WHERE m.chatroom_id = ${chatroomId}
                ORDER BY m.created_at ASC
              `);

              const formattedMessages = getMessagesResult.rows.map((msg) => ({
                senderId: msg.sender_uuid,
                senderName: msg.sender_name,
                message: msg.content,
                timestamp: msg.created_at,
                isSelf: msg.sender_uuid === senderUuid,
              }));

              socket.emit('chat-history', { messages: formattedMessages });
            } catch (error) {
              console.error('Error fetching chat history:', error);
              socket.emit('chat-history', {
                error: 'Failed to fetch chat history',
                messages: [],
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
