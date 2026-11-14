#!/usr/bin/env node
/**
 * foc-ops localhost console — same handlers as Vercel /api/*.
 * Open http://localhost:5310
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal } from "./load-env.js";
import {
  statusPayload,
  tierPayload,
  dryRunPayload,
  networkPayload,
  registryPayload,
  metricsText,
  NETWORK,
  DEFAULT_ADDRESS,
} from "./demo/handlers.js";

loadEnvLocal();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pub = path.join(root, "public");
const PORT = Number(process.env.PORT || 5310);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function json(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function serveStatic(urlPath, res) {
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.join(
    pub,
    path.normalize(rel).replace(/^(\.\.[/\\])+/, "")
  );
  if (!filePath.startsWith(pub)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404).end("not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);
    const q = Object.fromEntries(url.searchParams);

    if (url.pathname === "/api/status") {
      return json(
        res,
        await statusPayload({
          address: q.address,
          scenario: q.scenario || "live",
        })
      );
    }
    if (url.pathname === "/api/tier") {
      return json(res, await tierPayload(q));
    }
    if (url.pathname === "/api/dry-run") {
      return json(res, await dryRunPayload(q));
    }
    if (url.pathname === "/api/network") {
      try {
        return json(res, await networkPayload(q.network));
      } catch (err) {
        return json(
          res,
          {
            ok: false,
            network: q.network || NETWORK,
            error: err instanceof Error ? err.message : String(err),
          },
          502
        );
      }
    }
    if (url.pathname === "/api/registry") {
      return json(res, await registryPayload(q));
    }
    if (url.pathname === "/api/metrics-text" || url.pathname === "/metrics") {
      const s = await statusPayload({
        address: q.address,
        scenario: q.scenario || "live",
      });
      res.writeHead(s.error && url.pathname === "/metrics" ? 500 : 200, {
        "Content-Type":
          url.pathname === "/metrics"
            ? "text/plain; version=0.0.4"
            : "text/plain; charset=utf-8",
      });
      res.end(metricsText(s));
      return;
    }

    if (url.pathname.startsWith("/grant/")) {
      const g = path.join(
        root,
        path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, "")
      );
      if (!g.startsWith(path.join(root, "grant"))) {
        res.writeHead(403).end("forbidden");
        return;
      }
      try {
        const data = await readFile(g);
        res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
        res.end(data);
        return;
      } catch {
        res.writeHead(404).end("not found");
        return;
      }
    }

    await serveStatic(url.pathname, res);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(err instanceof Error ? err.message : String(err));
  }
});

server.listen(PORT, () => {
  console.log(`foc-ops console → http://localhost:${PORT}`);
  console.log(`default=live Calibration · address=${DEFAULT_ADDRESS}`);
  console.log(`Vercel APIs mirror /api/* · registry via deployments/`);
});
