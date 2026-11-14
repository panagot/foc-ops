#!/usr/bin/env node
/**
 * foc-ops localhost console — X100 capability theater.
 * Prompt: grant/PROMPT_X100_DEMO.md
 * Open http://localhost:5310
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal } from "./load-env.js";
import { fetchRunway, formatUsdfcWei } from "./finops/runway.js";
import { evaluateTier, loadJson } from "./tier/policy.js";
import {
  scenarioStatus,
  couplingEstimate,
  SCENARIO_IDS,
} from "./demo/scenarios.js";
import { probeNetwork } from "./chain/network.js";
import {
  registryStatus,
  encodeRecordPromotion,
  readPromotion,
  CALIBRATION_CHAIN,
} from "./chain/registry.js";

loadEnvLocal();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pub = path.join(root, "public");
const PORT = Number(process.env.PORT || 5310);
const DEFAULT_ADDRESS =
  process.env.FOC_DEMO_ADDRESS ||
  "0x0000000000000000000000000000000000000001";
const NETWORK = process.env.FOC_DEMO_NETWORK || "calibration";

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

function parseAddress(raw) {
  const a = (raw || DEFAULT_ADDRESS).trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(a)) return null;
  return a;
}

async function statusPayload({ address, scenario }) {
  const started = Date.now();
  const addr = parseAddress(address) || DEFAULT_ADDRESS;
  const mode = scenario || "live";

  if (mode !== "live" && SCENARIO_IDS.includes(mode)) {
    const s = scenarioStatus(mode, addr);
    return { ...s, scrapeMs: Date.now() - started, scrapedAt: new Date().toISOString() };
  }

  try {
    const status = await fetchRunway({ address: addr, network: NETWORK });
    return {
      ...status,
      mode: "live",
      scenario: "live",
      scrapeMs: Date.now() - started,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      address: addr,
      network: NETWORK,
      mode: "live",
      scenario: "live",
      scrapeMs: Date.now() - started,
      scrapedAt: new Date().toISOString(),
    };
  }
}

async function loadInventory() {
  try {
    return await loadJson(path.join(root, "examples/inventory.demo.json"));
  } catch {
    return await loadJson(path.join(root, "examples/inventory.example.json"));
  }
}

async function tierPayload(query) {
  const basePolicy = await loadJson(
    path.join(root, "examples/policy.example.json")
  );
  const promoteAfterDays = query.promoteAfterDays
    ? Number(query.promoteAfterDays)
    : basePolicy.promoteAfterDays;
  const minSizeBytes = query.minSizeBytes
    ? Number(query.minSizeBytes)
    : basePolicy.minSizeBytes ?? 0;
  const policy = {
    ...basePolicy,
    promoteAfterDays,
    minSizeBytes,
  };
  const inventory = await loadInventory();
  const result = evaluateTier({ policy, inventory });
  const coupling = couplingEstimate(result.promote);
  return {
    ...result,
    policy,
    inventoryCount: inventory.length,
    coupling,
  };
}

function metricsText(s) {
  if (s.error) return `# error ${s.error}\n`;
  const runway = s.runwayDays === null ? -1 : s.runwayDays;
  const gross = s.grossCoverageDays === null ? -1 : s.grossCoverageDays;
  const alertNum =
    s.alert === "ok" ? 0 : s.alert === "low_runway" ? 1 : 2;
  return [
    `# HELP foc_ops_runway_days Days until Filecoin Pay deficit. -1 = infinite.`,
    `# TYPE foc_ops_runway_days gauge`,
    `foc_ops_runway_days{network="${s.network}",address="${s.address}",scenario="${s.scenario || "n/a"}"} ${runway}`,
    `foc_ops_gross_coverage_days{network="${s.network}"} ${gross}`,
    `foc_ops_available_usdfc{network="${s.network}"} ${Number(BigInt(s.availableFunds || "0")) / 1e18}`,
    `foc_ops_alert{network="${s.network}"} ${alertNum}`,
    `# human available=${formatUsdfcWei(s.availableFunds || "0")} alert=${s.alert}`,
    `# PromQL would fire: foc_ops_alert > 0 or foc_ops_runway_days < 14`,
    "",
  ].join("\n");
}

function dryRunSteps(tier) {
  const steps = [
    {
      t: 0,
      level: "info",
      msg: `read inventory · ${tier.inventoryCount} pieces`,
    },
    {
      t: 120,
      level: "info",
      msg: `apply policy · promoteAfterDays=${tier.policy.promoteAfterDays} minSizeBytes=${tier.policy.minSizeBytes}`,
    },
    {
      t: 240,
      level: "ok",
      msg: `would promote ${tier.promote.length} · skip ${tier.skip.length}`,
    },
  ];
  for (const p of tier.promote.slice(0, 12)) {
    steps.push({
      t: 300 + steps.length * 40,
      level: "promote",
      msg: `PROMOTE ${p.pieceCid.slice(0, 22)}… age ${p.ageDays}d → ${p.target}`,
      pieceCid: p.pieceCid,
      intent: {
        action: "warm_to_cold",
        pieceCid: p.pieceCid,
        targetTier: p.target,
        sizeBytes: p.sizeBytes,
        reason: p.reason,
        registryCalldataPreview: `register(bytes warm, bytes cold) /* unsigned · Calibration */`,
      },
    });
  }
  steps.push({
    t: 900,
    level: "coupling",
    msg: `coupling · +${tier.coupling.runwayDaysGained}d runway if ${tier.coupling.promoteCount} promotes execute (demo model)`,
    coupling: tier.coupling,
  });
  return steps;
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
      const body = await statusPayload({
        address: q.address,
        scenario: q.scenario || "live",
      });
      return json(res, body);
    }

    if (url.pathname === "/api/tier") {
      const body = await tierPayload(q);
      return json(res, body);
    }

    if (url.pathname === "/api/dry-run") {
      const tier = await tierPayload(q);
      return json(res, {
        evaluatedAt: tier.evaluatedAt,
        policy: tier.policy,
        coupling: tier.coupling,
        promote: tier.promote,
        skipCount: tier.skip.length,
        steps: dryRunSteps(tier),
      });
    }

    if (url.pathname === "/api/network") {
      try {
        const body = await probeNetwork(q.network || NETWORK);
        return json(res, body);
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
      const net = q.network || NETWORK;
      const status = registryStatus(net);
      let sampleRead = null;
      if (q.pieceCid && status.deployed) {
        try {
          sampleRead = await readPromotion(net, q.pieceCid);
        } catch (err) {
          sampleRead = {
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }
      const firstPromote = q.warm
        ? encodeRecordPromotion({
            warmPieceCid: q.warm,
            coldRef: q.cold,
            policyId: q.policyId,
          })
        : status.sampleCalldata
          ? encodeRecordPromotion({
              warmPieceCid: "bafkzcibexample-warm-demo",
              coldRef: "bafkzcibexample-cold-demo",
              policyId: "promoteAfterDays:30",
            })
          : null;
      return json(res, {
        ...status,
        calibrationChain: CALIBRATION_CHAIN,
        walletTxTemplate: status.deployed
          ? {
              to: status.address,
              data: firstPromote?.data || status.sampleCalldata,
              value: "0x0",
              chainId: CALIBRATION_CHAIN.chainId,
            }
          : null,
        sampleRead,
        deployHint:
          "FOC_PRIVATE_KEY=0x… node scripts/deploy-registry.mjs --network calibration",
      });
    }

    if (url.pathname === "/api/metrics-text") {
      const s = await statusPayload({
        address: q.address,
        scenario: q.scenario || "live",
      });
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(metricsText(s));
      return;
    }

    if (url.pathname === "/metrics") {
      const s = await statusPayload({
        address: q.address,
        scenario: q.scenario || "live",
      });
      if (s.error) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`# error ${s.error}\n`);
        return;
      }
      res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
      res.end(metricsText(s));
      return;
    }

    if (url.pathname.startsWith("/grant/")) {
      const g = path.join(root, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ""));
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
  console.log(`default=live Calibration · drills via ?scenario=low_runway|healthy|deficit`);
  console.log(`prompt → grant/PROMPT_X100_DEMO.md · strategy → grant/GRANT_STRATEGY.md`);
});
