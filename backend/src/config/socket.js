const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.user = decoded; // Attach user payload (id, role)
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role}, Tenant: ${socket.user.tenantId})`);

    // Join tenant room for broad tenant-scoped alerts
    if (socket.user.tenantId) {
      socket.join(`tenant:${socket.user.tenantId}`);
      
      // Join room based on user role scoped per tenant (prevents cross-tenant leaks!)
      if (socket.user.role) {
        socket.join(`tenant:${socket.user.tenantId}:role:${socket.user.role}`);
      }
    } else {
      // Platform / Super Admins join global channels if needed
      if (socket.user.role) {
        socket.join(`role:${socket.user.role}`);
      }
    }

    // Join user-specific room for direct notifications (e.g., grade inputs, payment receipts)
    socket.join(`user:${socket.user.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
