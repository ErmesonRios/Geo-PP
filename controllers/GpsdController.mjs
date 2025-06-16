import gpsd from "node-gpsd";
import { configDotenv } from "dotenv";
import { execa } from "execa";
configDotenv();

const TCP_PORT = process.env.TCP_PORT;

class GpsdController {
  static daemon = null;
  static listener = null;
  static dateIsSet = false;

  static async gpsdStream(req, res) {
    if (!GpsdController.daemon) {
      GpsdController.startGpsd();
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    if (!GpsdController.listener) {
      const listener = new gpsd.Listener({
        hostname: "localhost",
        port: 2947,
        parse: true,
      });

      GpsdController.listener = listener;
    }

    GpsdController.listener.connect(() => {
      GpsdController.listener.watch({
        class: "WATCH",
        json: true,
        nmea: false,
      });
    });

    GpsdController.listener.on("SKY", (msg) => {
      if (Array.isArray(msg.satellites)) {
        const usedCount = msg.satellites.filter((s) => s.used).length;
        res.write(`data: ${usedCount}\n\n`);
      }
    });

    GpsdController.listener.on("TPV", async (msg) => {
      if (GpsdController.dateIsSet || !msg.time) return;
      const dt = new Date(msg.time);
      const formatted = dt.toISOString().replace("T", " ").replace(/\..+/, "");

      try {
        await execa("sudo", ["timedatectl", "set-time", formatted]);
        console.log(`Data/hora ajustadas para ${formatted} (UTC)`);

        GpsdController.dateIsSet = true;
      } catch (err) {
        console.error("Erro ao ajustar data/hora:", err);
      }
    });

    GpsdController.listener.on("error", (err) => {
      res.write(`event: error\ndata: ${err.message}\n\n`);
    });

    const cleanUp = async () => {
      await GpsdController.stopListener();
      await GpsdController.stopGpsdDaemon();
    };
    req.on("close", cleanUp);
    res.on("finish", cleanUp);
  }

  static startGpsd() {
    if (!GpsdController.daemon) {
      GpsdController.daemon = new gpsd.Daemon({
        program: "gpsd",
        device: `tcp://localhost:${TCP_PORT}`,
      });
      GpsdController.daemon.start();
    }
  }

  static async stopGpsdDaemon() {
    if (!GpsdController.daemon) return;

    const daemon = GpsdController.daemon;
    GpsdController.daemon = null;

    if (!daemon._watcher) return;

    await new Promise((resolve) => {
      daemon.stop(() => {
        resolve();
      });
    });
  }

  static async stopListener() {
    if (GpsdController.listener) {
      await new Promise((resolve) => {
        try {
          GpsdController.listener.unwatch();
          GpsdController.listener.disconnect(() => {
            GpsdController.listener = null;
            resolve();
          });
        } catch {
          GpsdController.listener = null;
          resolve();
        }
      });
    }
  }
}

export default GpsdController;
