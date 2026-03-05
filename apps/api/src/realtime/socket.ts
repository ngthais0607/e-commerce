import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Initialize Socket.IO server and set up event handlers.
 * This provides realtime chat for orders between customers and staff/admin.
 */
export function initSocket(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = verifyToken(token.replace('Bearer ', ''));
      socket.data.userId = decoded.userId;
      socket.data.role = (decoded as { userId: number; role?: string }).role;
      next();
    } catch (_error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    log.info('Socket connected', { userId, socketId: socket.id });

    socket.on('join-order-room', (orderId) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
    });

    socket.on('leave-order-room', (orderId) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    socket.on('join-order-room', (orderId) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
    });

    socket.on('leave-order-room', (orderId) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    socket.on('join-support-conv', (conversationId) => {
      if (!conversationId) return;
      socket.join(`support:conv:${conversationId}`);
      socket.join(`support:user:${userId}`);
    });

    socket.on('leave-support-conv', (conversationId) => {
      if (!conversationId) return;
      socket.leave(`support:conv:${conversationId}`);
    });

    if (socket.data.role === 'ADMIN' || socket.data.role === 'STAFF') {
      socket.join('support:staff');
    }

    socket.on('disconnect', () => {
      log.info('Socket disconnected', { userId, socketId: socket.id });
    });
  });

  return io;
}

export function emitOrderMessage(io, orderId, message) {
  io.to(`order:${orderId}`).emit('order-message', { orderId, message });
}

export function emitSupportMessage(io, conversationId, message) {
  io.to(`support:conv:${conversationId}`).emit('support-message', { conversationId, message });
  io.to('support:staff').emit('support-message', { conversationId, message });
}

export function emitSupportAssignment(io, conversationId, conversation) {
  io.to(`support:conv:${conversationId}`).emit('support-assigned', { conversation });
  io.to('support:staff').emit('support-assigned', { conversation });
}

export function emitSupportClosure(io, conversationId) {
  io.to(`support:conv:${conversationId}`).emit('support-closed', { conversationId });
}

export function emitSupportNew(io, conversation) {
  io.to('support:staff').emit('support-new', { conversation });
}


