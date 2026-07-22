const jwt = require("jsonwebtoken");
const logger = require("./logger");

let io = null;

/**
 * Attaches Socket.IO to an existing HTTP server. Each authenticated socket
 * joins a room named after its user id, so controllers can push events to
 * a specific user with `emitToUser(userId, event, payload)` without
 * tracking socket ids themselves. Call this once from server.js — it's a
 * no-op import everywhere else (initSocket is only invoked at boot).
 */
function initSocket(httpServer) {
  const { Server } = require("socket.io");
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    logger.debug(`Socket connected for user ${socket.userId}`);

    socket.on("disconnect", () => {
      logger.debug(`Socket disconnected for user ${socket.userId}`);
    });
  });

  return io;
}

/** Push a real-time event to every open tab/device for one user. No-op if sockets aren't initialized (e.g. in tests). */
function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser };
