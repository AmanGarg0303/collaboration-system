import { WebSocketServer, WebSocket } from "ws";
import { getDocument, setDocument } from "./redisCalls.js";
import * as Y from "yjs";

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });
  const doc = new Y.Doc();

  (async () => {
    const savedState = await getDocument();
    if (savedState) {
      Y.applyUpdate(doc, Buffer.from(savedState, "base64"));
    }
  })();

  const users = new Set();

  wss.on("connection", (ws) => {
    let username = null;

    ws.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (error) {
        return;
      }

      // JOIN
      if (msg.type === "join") {
        if (!msg.name) return;
        if (users.has(msg.name)) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Username already taken",
            })
          );
          return;
        }

        username = msg.name;
        users.add(username);

        ws.send(
          JSON.stringify({
            type: "sync",
            content: Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64"),
            users: Array.from(users),
          })
        );

        broadcast(wss, {
          type: "join",
          name: username,
        });

        return;
      }

      // EDIT
      if (msg.type === "edit") {
        if (!username) return;
        const update = Uint8Array.from(Buffer.from(msg.content, "base64"));
        Y.applyUpdate(doc, update);

        broadcast(wss, {
          type: "edit",
          name: username,
          content: msg.content,
        });
        await setDocument(
          Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64")
        );

        return;
      }
    });

    ws.on("close", async () => {
      if (!username) return;
      users.delete(username);

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
