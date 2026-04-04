import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import { getServerStatus } from "./services/serverStatusService.js";

import { db } from "./db/db.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

app.get("/", async (req, res) => {
  const status = await getServerStatus();
  res.render("home", {
    status,
    user: req.session?.user || null
  });
});

app.get("/test-db", async (_req, res) => {
  try {
    const rows = await db.query(
      "SELECT DATABASE() AS db, USER() AS user, CURRENT_USER() AS currentUser, VERSION() AS version"
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      message: error.message,
      code: error.code,
      errno: error.errno
    });
  }
});

app.use(authRoutes);
app.use(accountRoutes);
app.use(apiRoutes);

app.listen(config.port, () => {
  console.log(`Web running on http://localhost:${config.port}`);
});