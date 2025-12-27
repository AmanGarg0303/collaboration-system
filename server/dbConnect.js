import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

pool.on("connect", () => {
  console.log("Postgres connected.");
});

pool.on("error", (err) => {
  console.log("Postgres err:", err);
});

export default pool;
