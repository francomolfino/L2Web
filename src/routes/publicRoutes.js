import { Router } from "express";
import { getServerStatus } from "../services/serverStatusService.js";
import {
  getOnlinePlayersCount,
  getTopPvp,
  getTopPk
} from "../services/statsService.js";
import { serverInfo } from "../data/serverInfo.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const status = await getServerStatus();
    const onlinePlayers = await getOnlinePlayersCount();
    const topPvp = await getTopPvp(5);
    const topPk = await getTopPk(5);

    return res.render("home", {
      status,
      onlinePlayers,
      topPvp,
      topPk
    });
  } catch (error) {
    console.error("HOME ERROR:", error);

    return res.render("home", {
      status: { online: false },
      onlinePlayers: 0,
      topPvp: [],
      topPk: []
    });
  }
});

router.get("/rankings", async (req, res) => {
  try {
    const topPvp = await getTopPvp(50);
    const topPk = await getTopPk(50);

    return res.render("rankings", {
      topPvp,
      topPk
    });
  } catch (error) {
    console.error("RANKINGS ERROR:", error);

    return res.render("rankings", {
      topPvp: [],
      topPk: []
    });
  }
});

router.get("/downloads", (req, res) => {
  return res.render("downloads", {
    downloads: serverInfo.downloads
  });
});

router.get("/info", (req, res) => {
  return res.render("info", {
    serverInfo
  });
});

export default router;