import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: "l2web.sid",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.isProduction,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(publicRoutes);
app.use(authRoutes);
app.use(accountRoutes);
app.use(apiRoutes);

app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Error interno del servidor");
});

app.listen(config.port, () => {
  console.log(`Web running on ${config.baseUrl}`);
});