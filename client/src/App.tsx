import { useEffect, useRef, useState } from "react";
import "./App.css";
import useDebounce from "./hooks/useDebounce";

function App() {
  const [username, setUsername] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");
  const [users, setUsers] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const wsRef = useRef<unknown>(null);
  const ignoreRef = useRef(false);

  const log = (msg: string) => {
    setLogs((l) => [...l, msg]);
  };

  const join = () => {
    if (!username) return alert("Enter Username");

    const ws = new WebSocket("ws://localhost:8000");
    wsRef.current = ws;

    ws.onopen = () => {
      log("-> connected");
      ws.send(JSON.stringify({ type: "join", name: username }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      log("<- " + JSON.stringify(msg));

      if (msg.type === "error") {
        alert(msg.message);
        return;
      }

      if (msg.type === "sync") {
        setJoined(true);
        setContent(msg.content);
        setUsers(msg.users);
      }

      if (msg.type === "edit" && msg.name != username) {
        ignoreRef.current = true;
        setContent(msg.content);
        ignoreRef.current = false;
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

  const debouncedContent = useDebounce(content);

  useEffect(() => {
    if (ignoreRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      wsRef.current?.send(
        JSON.stringify({
          type: "edit",
          content: debouncedContent,
        })
      );
    }, 0);

    return () => clearTimeout(timeout);
  }, [debouncedContent]);

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
              onChange={(e) => setContent(e.target.value)}
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
