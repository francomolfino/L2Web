import * as mariadb from "mariadb";
import { config } from "../config.js";

export const db = mariadb.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  connectionLimit: 10
});