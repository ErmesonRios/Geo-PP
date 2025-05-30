import RtkController from "./RtkController.mjs";
import gpsd from "node-gpsd";

class GpsdController {
  static daemon = null;
  static listener = null;

  static async gpsdStream(req, res) {
    if (RtkController.process && !RtkController.process.killed) {
      RtkController.process.kill();
      await new Promise((resolve) => RtkController.process.on("exit", resolve));
    }

    await GpsdController.stopListener();
    await GpsdController.stopGpsdDaemon();

    GpsdController.startGpsd();

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const listener = new gpsd.Listener({
      hostname: "localhost",
      port: 2947,
      parse: true,
    });
    GpsdController.listener = listener;

    listener.connect(() => {
      listener.watch({ class: "WATCH", json: true, nmea: false });
    });

    listener.on("SKY", (msg) => {
      if (Array.isArray(msg.satellites)) {
        const usedCount = msg.satellites.filter((s) => s.used).length;
        res.write(`data: ${usedCount}\n\n`);
      }
    });

    listener.on("error", (err) => {
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
        device: "/dev/ttyACM0",
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
