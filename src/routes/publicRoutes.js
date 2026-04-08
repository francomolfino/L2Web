import { Router } from "express";
import { getServerStatus } from "../services/serverStatusService.js";
import {
  getOnlinePlayersCount,
  getTopPvp,
  getTopPk
} from "../services/statsService.js";
import { serverInfo } from "../data/serverInfo.js";
import { news } from "../data/news.js";
import { formatDate } from "../utils/dateUtils.js";

const router = Router();

router.get("/", async (req, res) => {
  const formattedNews = news.map(n => ({
    ...n,
    formattedDate: formatDate(n.publishedAt)
  }));

  try {
    const status = await getServerStatus();
    const onlinePlayers = await getOnlinePlayersCount();
    const topPvp = await getTopPvp(5);
    const topPk = await getTopPk(5);

    return res.render("home", {
      status,
      onlinePlayers,
      topPvp,
      topPk,
      serverInfo,
      latestNews: formattedNews.slice(0, 3)
    });
  } catch (error) {
    console.error("HOME ERROR:", error);

    return res.render("home", {
      status: { online: false },
      onlinePlayers: 0,
      topPvp: [],
      topPk: [],
      serverInfo,
      latestNews: formattedNews.slice(0, 3)
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

router.get(["/download", "/donwload"], (req, res) => {
  return res.redirect("/downloads");
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

router.get("/news", (req, res) => {
  const formattedNews = news.map(n => ({
    ...n,
    formattedDate: formatDate(n.publishedAt)
  }));

  return res.render("news-list", {
    newsList: formattedNews
  });
});

router.get("/news/:slug", (req, res) => {
  const article = news.find((item) => item.slug === req.params.slug);

  if (!article) {
    return res.status(404).render("error", {
      title: "404",
      message: "Noticia no encontrada"
    });
  }

  return res.render("news-article", {
    article: {
      ...article,
      formattedDate: formatDate(article.publishedAt)
    }
  });
});

export default router;
