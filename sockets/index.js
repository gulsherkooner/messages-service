import { Server } from 'socket.io';
import { Message } from '../models/index.js';

const onlineUsers = new Map();
const activeCalls = new Map();

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
  });

  io.on('connection', (socket) => {
    console.log('🟢 Socket connected:', socket.id);

    socket.on('join', ({ userId }) => {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });

    socket.on('message', async (data) => {
      try {
        const saved = await Message.create({ ...data, status: 'sent' });
        const receiverSocketId = onlineUsers.get(data.receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message', saved.toJSON());
        }
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('typing', ({ userId, receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { userId, isTyping });
      }
    });

    // In your server code (index.js)
    socket.on('call-user', (data) => {
      console.log('Call request from:', data.from, 'to:', data.userToCall);
      const recipientSocket = onlineUsers.get(data.userToCall);
      if (recipientSocket) {
        io.to(recipientSocket).emit('incoming-call', {
          from: data.from,
          signal: data.signalData,
          isVideo: data.isVideo
        });
      } else {
        console.log('Recipient not found');
        // Notify caller that recipient is unavailable
        io.to(socket.id).emit('call-failed', {
          reason: 'Recipient unavailable'
        });
      }
    });

    socket.on('accept-call', (data) => {
      console.log('Call accepted from:', data.to);
      const recipientSocket = onlineUsers.get(data.to);
      if (recipientSocket) {
        io.to(recipientSocket).emit('call-accepted', {
          signal: data.signal
        });
      }
    });

    socket.on('end-call', ({ to }) => {
      const socketId = onlineUsers.get(to);
      if (socketId) {
        io.to(socketId).emit('call-ended');
      }
      activeCalls.delete(`${socket.userId}-${to}`);
      activeCalls.delete(`${to}-${socket.userId}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));

        // Clean up any active calls
        activeCalls.forEach((_, key) => {
          if (key.startsWith(socket.userId)) {
            const [from, to] = key.split('-');
            const socketId = onlineUsers.get(to);
            if (socketId) {
              io.to(socketId).emit('call-ended');
            }
            activeCalls.delete(key);
          }
        });
      }
      console.log('🔴 Socket disconnected:', socket.id);
    });
  });
};