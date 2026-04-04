import { Router } from "express";
import { getServerStatus } from "../services/serverStatusService.js";

const router = Router();

router.get("/api/status", async (_req, res) => {
  const status = await getServerStatus();
  res.json(status);
});

export default router;