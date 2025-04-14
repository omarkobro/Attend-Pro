import http from "http";
import { Server } from "socket.io";

// This function will accept the Express app and bind it to the HTTP server
let server;
let io;

const initializeSocket = (app) => {
  // Create HTTP server and bind Express to it
  server = http.createServer(app);

  // Create Socket.IO server using the HTTP server
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust if needed
    },
  });

  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("join-session", (groupId) => {
      socket.join(`session-${groupId}`);
      console.log(`User ${socket.id} joined session-${groupId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export { initializeSocket, server, io };
