import { WebSocketServer } from "ws";
import {
  getDocument,
  setDocument,
  addUser,
  removeUser,
  userExists,
  getMembers,
} from "./redisCalls.js";

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    let username = null;

    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (error) {
        return;
      }
      console.log("RAW:::", msg);

      // JOIN
      if (msg.type === "join") {
        if (!msg.name) return;

        const exists = await userExists(msg.name);
        if (exists) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Username already taken",
            })
          );
          return;
        }

        username = msg.name;
        await addUser(username);

        ws.send(
          JSON.stringify({
            type: "sync",
            content: await getDocument(),
            users: await getMembers(),
          })
        );

        broadcast(wss, {
          type: "join",
          name: username,
        });

        return;
      }

      // EDIT
      if (msg.type == "edit") {
        if (!username) return;
        await setDocument(msg.content);

        broadcast(wss, {
          type: "edit",
          name: username,
          content: msg.content,
        });

        return;
      }
    });

    ws.on("close", async () => {
      if (!username) return;
      await removeUser(username);

      broadcast(wss, {
        type: "leave",
        name: username,
      });
    });
  });
}

function broadcast(wss, data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
