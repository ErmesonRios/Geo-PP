import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import mainRouter from "./routes/mainRouter.mjs";
import cors from "cors";
import getServerIPs from "./utils/getServerIPs.mjs";

const app = express();
const PORT = 3000;
const __dirname = import.meta.dirname;

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

app.listen(PORT, () => {
  console.log(
    `Servidor iniciado com sucesso em ${getServerIPs()[0].address}:${PORT}!`
  );
});
