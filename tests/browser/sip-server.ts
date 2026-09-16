import { createHash } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";

/**
 * Test-only in-memory SIP registrar/proxy. Exercises actual JsSIP authentication,
 * INVITE/answer/ACK/BYE, hold re-INVITEs, and browser WebRTC between two clients.
 * This fixture is not shipped and is not a production PBX.
 */
export async function startTestSipServer(): Promise<{
  url: string;
  methods: string[];
  close: () => Promise<void>;
}> {
  const server = new WebSocketServer({
    host: "127.0.0.1",
    port: 0,
    handleProtocols: () => "sip",
  });
  await new Promise<void>((resolve) => server.on("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing socket address");
  const registrations = new Map<string, WebSocket>();
  const dialogs = new Map<string, [WebSocket, WebSocket]>();
  const methods: string[] = [];
  const md5 = (value: string) => createHash("md5").update(value).digest("hex");
  server.on("connection", (socket) => {
    socket.on("message", (raw) => {
      const text = raw.toString();
      if (text === "\r\n\r\n") {
        socket.send("\r\n");
        return;
      }
      const lines = text.split("\r\n");
      const headers: Record<string, string> = {};
      for (const line of lines.slice(1)) {
        if (!line) break;
        const at = line.indexOf(":");
        if (at > 0)
          headers[line.slice(0, at).toLowerCase()] = line.slice(at + 1).trim();
      }
      const reply = (status: string, extra: string[] = []) => {
        socket.send(
          [
            `SIP/2.0 ${status}`,
            `Via: ${headers.via}`,
            `From: ${headers.from}`,
            `To: ${headers.to}${headers.to.includes(";tag=") ? "" : ";tag=test-server"}`,
            `Call-ID: ${headers["call-id"]}`,
            `CSeq: ${headers.cseq}`,
            ...extra,
            "Content-Length: 0",
            "",
            "",
          ].join("\r\n"),
        );
      };
      const method = lines[0].split(" ")[0];
      if (method !== "SIP/2.0") methods.push(method);
      if (method === "REGISTER") {
        if (!headers.authorization) {
          reply("401 Unauthorized", [
            'WWW-Authenticate: Digest realm="test-pbx", nonce="test-nonce", algorithm=MD5, qop="auth"',
          ]);
          return;
        }
        const auth = Object.fromEntries(
          Array.from(
            headers.authorization.matchAll(/(\w+)=(?:"([^"]*)"|([^,\s]+))/g),
            (m) => [m[1], m[2] ?? m[3]],
          ),
        );
        const ha1 = md5(`${auth.username}:test-pbx:fixture-password`);
        const ha2 = md5(`REGISTER:${auth.uri}`);
        const expected = md5(
          `${ha1}:test-nonce:${auth.nc}:${auth.cnonce}:${auth.qop}:${ha2}`,
        );
        if (auth.response !== expected) {
          reply("403 Forbidden");
          return;
        }
        const user = /sip:([^@>]+)@/.exec(headers.to)?.[1];
        if (user) registrations.set(user, socket);
        reply("200 OK", [`Contact: ${headers.contact}`, "Expires: 600"]);
        return;
      }
      const callId = headers["call-id"];
      let dialog = dialogs.get(callId);
      if (!dialog && method === "INVITE") {
        const user = /^INVITE sip:([^@]+)@/.exec(lines[0])?.[1];
        const peer = user && registrations.get(user);
        if (!peer) {
          reply("404 Not Found");
          return;
        }
        dialog = [socket, peer];
        dialogs.set(callId, dialog);
        reply("100 Trying");
      }
      if (dialog) {
        const target = dialog[0] === socket ? dialog[1] : dialog[0];
        if (target.readyState === 1) target.send(text);
      } else if (method !== "SIP/2.0" && method !== "ACK")
        reply("481 Call/Transaction Does Not Exist");
    });
  });
  return {
    url: `ws://127.0.0.1:${address.port}`,
    methods,
    close: async () => {
      for (const socket of server.clients) socket.terminate();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
