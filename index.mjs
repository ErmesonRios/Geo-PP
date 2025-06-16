import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import mainRouter from "./routes/mainRouter.mjs";
import cors from "cors";
import getServerIPs from "./utils/getServerIPs.mjs";
import { execa } from "execa";
import { configDotenv } from "dotenv";
import { createServer } from "http";
import { initSocket } from "./utils/socket.mjs";
configDotenv();

const app = express();
const httpServer = createServer(app);
const PORT = 80;
const TCP_PORT = process.env.TCP_PORT;
const __dirname = import.meta.dirname;

initSocket(httpServer);

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    helpers: {
      isZip: function (fileName) {
        return fileName.toLowerCase().endsWith(".zip");
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use("/", mainRouter);

let tcpServer = execa(
  "str2str",
  [
    "-in",
    "serial://ttyACM0:115200:8:n:1#ubx",
    "-out",
    `tcpsvr://:${TCP_PORT}#nmea`,
  ],
  {
    timeout: 0,
    all: true,
  }
);

httpServer.listen(PORT, () => {
  console.log(`Servidor ouvindo em http://${getServerIPs()[0].address}/`);
});
