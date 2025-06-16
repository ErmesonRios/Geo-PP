import { Server as SocketIOServer } from "socket.io";
import RtkController from "../controllers/RtkController.mjs";

let io;

export const initSocket = (httpServer) => {
  io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    console.log("🔌 Cliente conectado", socket.id);

    socket.on("disconnect", () => {
      RtkController.stopRecord();
      console.log("❌ Cliente desconectado:", socket.id);
    });
  });
  return io;
};

export const getIO = () => {
  return io;
};
