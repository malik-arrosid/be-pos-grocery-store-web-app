import { Pool } from "pg";
import config from "../config/config.js";

const pool = new Pool(config.db);

pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("Database connected successfully");
  }
});

export default pool;
