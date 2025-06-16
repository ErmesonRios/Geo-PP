import { execa } from "execa";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { randomBytes } from "crypto";
import { getIO } from "../utils/socket.mjs";
import getFileSize from "../utils/getFileSize.mjs";

const __dirname = import.meta.dirname;
const RECORDED_DIR = path.join(__dirname, "../recorded");

class RtkController {
  static process = null;
  static io = getIO();

  static async record(req, res) {
    const { name } = req.body;

    if (!RtkController.io) RtkController.io = getIO();

    if (!name) {
      return res
        .status(400)
        .json({ err: true, msg: "Nome não pode estar vazio!" });
    }

    const sanitizedName = RtkController.sanitizeFilename(name);

    if (!fs.existsSync(RECORDED_DIR)) {
      fs.mkdirSync(RECORDED_DIR, { recursive: true });
    }

    const date = RtkController.getDate();

    let fileName = `${date}-${sanitizedName}.ubx`;
    let filePath = path.join(RECORDED_DIR, fileName);

    if (fs.existsSync(filePath)) {
      fileName = `${date}-${sanitizedName}-${RtkController.generateToken()}.ubx`;
      filePath = path.join(RECORDED_DIR, fileName);
    }

    try {
      const uri = `file://${filePath}`;

      RtkController.process = execa(
        "str2str",
        ["-in", "tcpcli://localhost:5000#ubx", "-out", uri],
        {
          timeout: 0,
          all: true,
        }
      );

      RtkController.process.all?.on("data", async (chunk) => {
        console.log(chunk.toString());
        RtkController.io.emit("recording", await getFileSize([fileName]));
      });

      res.json({ name: fileName, msg: "gravando..." });
    } catch (err) {
      console.error("Falha ao iniciar gravação:", err);
      res.status(500).json({ err: true, msg: "Falha ao executar str2str" });
    }
  }

  static stopRecord() {
    if (!RtkController.process) {
      return;
    }

    const proc = RtkController.process;
    proc.once("exit", (code) => {
      if (code !== 0) {
        console.error(`str2str terminou com erro: ${code}`);
      }
    });

    proc.kill();
  }

  static async getAllRecorded() {
    const files = await fs.promises.readdir(RECORDED_DIR);

    return await getFileSize(files);
  }

  static async renameFile(req, res) {
    const { file, newName } = req.body;
    if (!file || !newName) {
      return res.status(400).send("Campos vazios!");
    }

    const oldPath = path.join(RECORDED_DIR, file);
    const newFileName = file.replace(
      /^(\d{2}-\d{2}-\d{4})(?:-(.*?))?(\..+)$/,
      `$1-${RtkController.sanitizeFilename(newName)}`
    );
    const newPath = path.join(RECORDED_DIR, newFileName);

    console.log(oldPath, newPath);

    if (!fs.existsSync(oldPath)) {
      return res.status(404).send("Arquivo não encontrado!");
    }
    if (fs.existsSync(newPath)) {
      return res.status(409).send("Já existe um arquivo com esse nome!");
    }

    try {
      fs.renameSync(oldPath, newPath);
      res.json({ newName: newFileName });
    } catch {
      res.status(500).send("Erro ao renomear arquivo");
    }
  }

  static async deleteFile(req, res) {
    const { file } = req.body;
    if (!file) {
      return res.status(400).send("Nome do arquivo inválido!");
    }

    const filePath = path.join(RECORDED_DIR, file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Arquivo não encontrado!");
    }

    try {
      fs.unlinkSync(filePath);
      res.send("Arquivo deletado com sucesso!");
    } catch {
      res.status(500).send("Erro ao deletar arquivo");
    }
  }

  static async downloadFile(req, res) {
    const { file } = req.params;
    if (!file) {
      return res.status(400).send("Nome do arquivo inválido!");
    }

    const filePath = path.join(RECORDED_DIR, file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Arquivo não encontrado!");
    }

    res.setHeader("Content-Type", "application/octet-stream");
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", () => {
      res.status(500).send("Erro ao processar o arquivo.");
    });
    fileStream.pipe(res);
  }

  static async genZip(req, res) {
    if (!fs.existsSync(RECORDED_DIR)) {
      return res.status(404).send("Arquivos não encontrados!");
    }

    const date = RtkController.getDate();
    let zipName = `${date}.zip`;
    let zipPath = path.join(RECORDED_DIR, zipName);

    if (fs.existsSync(zipPath)) {
      zipName = `${date}-${RtkController.generateToken()}.zip`;
      zipPath = path.join(RECORDED_DIR, zipName);
    }

    try {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", async () => {
        res.json({
          msg: "Arquivo gerado com sucesso!",
          file: await getFileSize([zipName]),
        });
      });

      output.on("error", () => {
        res.status(500).send("Falha ao escrever o arquivo ZIP.");
      });
      archive.on("error", () => {
        res.status(500).send("Falha ao gerar o ZIP.");
      });

      archive.pipe(output);
      archive.glob("**/*", {
        cwd: RECORDED_DIR,
        dot: true,
        ignore: ["**/*.zip"],
      });
      await archive.finalize();
    } catch {
      res.status(500).send("Erro ao zipar arquivos");
    }
  }

  static getDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }

  static sanitizeFilename(raw, replacement = "-") {
    const safe = raw.replace(/[\/\\\s]+/g, replacement);
    return safe;
  }

  static generateToken(bytes = 3) {
    return randomBytes(bytes).toString("hex");
  }
}

export default RtkController;
