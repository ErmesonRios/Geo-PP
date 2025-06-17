import { Router } from "express";
import RtkController from "../controllers/RtkController.mjs";
import GpsdController from "../controllers/GpsdController.mjs";
import getServerIPs from "../utils/getServerIPs.mjs";
import { execa } from "execa";

const router = Router();

router.get("/", async (req, res) => {
  const files = await RtkController.getAllRecorded();

  res.render("home", {
    label: "Satelites",
    redirect: "gpsd",
    style: "home",
    files,
    script: "home",
    ip: getServerIPs()[0].address,
  });
});

router.post("/powerOff", async (req, res) => {
  try {
    execa("sudo", ["shutdown", "-h", "now"]);

    res.json({ offline: true });
  } catch (err) {
    console.error("Falha ao executar shutdown:", err);
  }
});

router.post("/record", RtkController.record);
router.post("/stopRecord", RtkController.stopRecord);
router.post("/renameFile", RtkController.renameFile);
router.post("/deleteFile", RtkController.deleteFile);
router.post("/genZip", RtkController.genZip);
router.get("/download/:file", RtkController.downloadFile);

router.get("/gpsdStream", GpsdController.gpsdStream);

export default router;
