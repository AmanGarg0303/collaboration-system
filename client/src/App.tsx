import { useEffect, useRef, useState, type ChangeEvent } from "react";
import "./App.css";
import * as Y from "yjs";

function App() {
  const [username, setUsername] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");
  const [users, setUsers] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  const log = (msg: string) => {
    setLogs((l) => [...l, msg]);
  };

  const join = () => {
    if (!username) return alert("Enter Username");

    const ws = new WebSocket("ws://localhost:8000");
    wsRef.current = ws;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const ytext = ydoc.getText("content");

    ytext.observe(() => {
      setContent(ytext.toString());
    });

    ws.onopen = () => {
      log("-> connected");
      ws.send(JSON.stringify({ type: "join", name: username }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "error") {
        alert(msg.message);
        ws.close();
        return;
      }

      log("<- " + JSON.stringify(msg));

      if (msg.type === "sync") {
        const update = base64ToUint8Array(msg.content);
        Y.applyUpdate(ydoc, update);
        setUsers(msg.users);
        setJoined(true);
      }

      if (msg.type === "edit" && msg.name != username) {
        if (!ydocRef.current) return;
        const update = base64ToUint8Array(msg.content);
        Y.applyUpdate(ydoc, update);
      }

      if (msg.type === "join" && msg.name !== username) {
        setUsers((u) => [...u, msg.name]);
      }

      if (msg.type === "leave") {
        setUsers((u) => u.filter((n) => n !== msg.name));
      }
    };

    ws.onclose = () => log("-> disconnected");
  };

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const ydoc = ydocRef.current;
    if (!ydoc) return;

    const ytext = ydoc.getText("content");
    ytext.delete(0, ytext.length);
    ytext.insert(0, val);

    const update = Y.encodeStateAsUpdate(ydoc);
    const msg = {
      type: "edit",
      content: uint8ArrayToBase64(update),
    };

    wsRef.current?.send(JSON.stringify(msg));
  };

  const bottomRef = useRef<HTMLPreElement | null>(null);
  useEffect(() => {
    const el = bottomRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <>
      <div className=" bg-blue-200 min-h-screen min-w-screen p-4">
        <h2 className="text-xl font-medium mb-4">Collaboration Engine </h2>

        {!joined && (
          <>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border rounded-sm px-2 py-1 mr-2.5"
            />
            <button className="btn-primary" onClick={join}>
              Join
            </button>
          </>
        )}

        {joined && (
          <>
            <textarea
              value={content}
              onChange={onChange}
              rows={10}
              className="w-full bg-white rounded-sm px-2 py-1"
            ></textarea>

            <div>
              <strong>Online Users: </strong> {users.join(", ")}
            </div>
          </>
        )}

        <h4 className="text-md mt-5">Logs</h4>
        <pre className="bg-[#eee] p-2.5 h-40 overflow-auto" ref={bottomRef}>
          {logs.join("\n")}
        </pre>
      </div>
    </>
  );
}

export default App;

function uint8ArrayToBase64(u8: Uint8Array) {
  let binary = "";
  const len = u8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8[i] = binary.charCodeAt(i);
  }
  return u8;
}
