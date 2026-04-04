import dotenv from "dotenv";
dotenv.config();

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET no está definido");
}

export const config = {
  port: Number(process.env.PORT || 3000),
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  sessionSecret: process.env.SESSION_SECRET,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  },
  gameServer: {
    host: process.env.GAME_SERVER_HOST || "127.0.0.1",
    port: Number(process.env.GAME_SERVER_PORT || 7777)
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 0),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM
  },
  tokenExpirationMinutes: Number(process.env.TOKEN_EXPIRATION_MINUTES || 30),
  isProduction: process.env.NODE_ENV === "production"
};