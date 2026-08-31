const { getIO } = require('../config/socket');

const sendToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
    console.log(`Socket notification sent to user:${userId} for event ${event}`);
  } catch (error) {
    console.warn(`WebSocket notice not sent (user:${userId}):`, error.message);
  }
};

const sendToRole = (tenantId, roleName, event, data) => {
  try {
    const io = getIO();
    const targetRoom = tenantId ? `tenant:${tenantId}:role:${roleName}` : `role:${roleName}`;
    io.to(targetRoom).emit(event, data);
    console.log(`Socket notification sent to ${targetRoom} for event ${event}`);
  } catch (error) {
    console.warn(`WebSocket notice not sent (role:${roleName}, tenant:${tenantId}):`, error.message);
  }
};

const broadcastToTenant = (tenantId, event, data) => {
  try {
    const io = getIO();
    if (tenantId) {
      io.to(`tenant:${tenantId}`).emit(event, data);
      console.log(`Socket broadcast sent to tenant:${tenantId} for event ${event}`);
    } else {
      io.emit(event, data);
      console.log(`Socket global broadcast sent for event ${event}`);
    }
  } catch (error) {
    console.warn(`WebSocket broadcast not sent (tenant:${tenantId}):`, error.message);
  }
};

module.exports = {
  sendToUser,
  sendToRole,
  broadcastToTenant,
};
