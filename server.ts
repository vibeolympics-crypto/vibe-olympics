/**
 * Custom Next.js Server with Socket.io
 * 
 * Socket.io를 Next.js와 통합하기 위한 커스텀 서버
 * 
 * @usage
 * Development: npx ts-node server.ts
 * Production: node dist/server.js
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./src/lib/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Socket.io 서버 초기화 (httpServer를 전달)
  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server initialized on /api/socket`);
  });
});
