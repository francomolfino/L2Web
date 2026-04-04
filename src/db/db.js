import * as mariadb from "mariadb";
import { config } from "../config.js";

export const db = mariadb.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  connectionLimit: 10
});