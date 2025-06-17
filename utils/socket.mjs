import { Server as SocketIOServer } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    console.log("🔌 Cliente conectado", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ Cliente desconectado:", socket.id);
    });
  });
  return io;
};

export const getIO = () => {
  return io;
};
