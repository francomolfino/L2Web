import { Router } from "express";
import { getServerStatus } from "../services/serverStatusService.js";
import {
  getOnlinePlayersCount,
  getTopPvp,
  getTopPk
} from "../services/statsService.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const status = await getServerStatus();
    const onlinePlayers = await getOnlinePlayersCount();
    const topPvp = await getTopPvp(5);
    const topPk = await getTopPk(5);

    res.render("home", {
      status,
      onlinePlayers,
      topPvp,
      topPk,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error("HOME ERROR:", error);

    res.render("home", {
      status: { online: false },
      onlinePlayers: 0,
      topPvp: [],
      topPk: [],
      user: null
    });
  }
});

router.get("/rankings", async (req, res) => {
  try {
    const topPvp = await getTopPvp(50);
    const topPk = await getTopPk(50);

    res.render("rankings", {
      topPvp,
      topPk,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error("RANKINGS ERROR:", error);

    res.render("rankings", {
      topPvp: [],
      topPk: [],
      user: null
    });
  }
});

export default router;