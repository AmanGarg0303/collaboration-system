import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import redis from "./redisConnection.js";
import pool from "./dbConnect.js";
import { setupWebSocket } from "./ws.js";

dotenv.config();
const PORT = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
setupWebSocket(server);

app.get("/dummy", (req, res) => {
  res.status(200).json({ message: "Hello from server" });
});

server.listen(PORT, () => {
  console.log(`Server listening on PORT: ${PORT}`);
});
