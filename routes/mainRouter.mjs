import { Router } from "express";
import RtkController from "../controllers/RtkController.mjs";
import GpsdController from "../controllers/GpsdController.mjs";
import getServerIPs from "../utils/getServerIPs.mjs";

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

router.get("/gpsd", (req, res) => {
  res.render("gpsd", {
    label: "Pagina Inicial",
    style: "gpsd",
    script: "gpsd",
  });
});

router.post("/record", RtkController.record);
router.post("/stopRecord", RtkController.stopRecord);
router.post("/renameFile", RtkController.renameFile);
router.post("/deleteFile", RtkController.deleteFile);
router.post("/genZip", RtkController.genZip);
router.get("/download/:file", RtkController.downloadFile);

router.get("/gpsdStream", GpsdController.gpsdStream);

export default router;
