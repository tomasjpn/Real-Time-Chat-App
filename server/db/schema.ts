import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatrooms = pgTable('chatrooms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userChatrooms = pgTable(
  'user_chatrooms',
  {
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    chatroomId: integer('chatroom_id').references(() => chatrooms.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.chatroomId] }),
  })
);

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatroomId: integer('chatroom_id').references(() => chatrooms.id, {
    onDelete: 'cascade',
  }),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
