import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRunway, formatUsdfcWei } from "../finops/runway.js";
import { evaluateTier, loadJson } from "../tier/policy.js";
import {
  scenarioStatus,
  couplingEstimate,
  SCENARIO_IDS,
} from "./scenarios.js";
import { probeNetwork } from "../chain/network.js";
import {
  registryStatus,
  encodeRecordPromotion,
  readPromotion,
  CALIBRATION_CHAIN,
} from "../chain/registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.join(__dirname, "../..");

export const DEFAULT_ADDRESS =
  process.env.FOC_DEMO_ADDRESS ||
  "0x0000000000000000000000000000000000000001";
export const NETWORK = process.env.FOC_DEMO_NETWORK || "calibration";

export function parseAddress(raw) {
  const a = (raw || DEFAULT_ADDRESS).trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(a)) return null;
  return a;
}

export async function statusPayload({ address, scenario }) {
  const started = Date.now();
  const addr = parseAddress(address) || DEFAULT_ADDRESS;
  const mode = scenario || "live";

  if (mode !== "live" && SCENARIO_IDS.includes(mode)) {
    const s = scenarioStatus(mode, addr);
    return {
      ...s,
      scrapeMs: Date.now() - started,
      scrapedAt: new Date().toISOString(),
    };
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

export async function tierPayload(query) {
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

export function metricsText(s) {
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

export function dryRunSteps(tier) {
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

export async function dryRunPayload(query) {
  const tier = await tierPayload(query);
  return {
    evaluatedAt: tier.evaluatedAt,
    policy: tier.policy,
    coupling: tier.coupling,
    promote: tier.promote,
    skipCount: tier.skip.length,
    steps: dryRunSteps(tier),
  };
}

export async function networkPayload(network) {
  return probeNetwork(network || NETWORK);
}

export async function registryPayload(q) {
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
  const firstPromote = encodeRecordPromotion({
    warmPieceCid: q.warm || "bafkzcibexample-warm-demo",
    coldRef: q.cold || "bafkzcibexample-cold-demo",
    policyId: q.policyId || "promoteAfterDays:30",
  });
  return {
    ...status,
    calibrationChain: CALIBRATION_CHAIN,
    walletTxTemplate: status.deployed
      ? {
          to: status.address,
          data: firstPromote.data,
          value: "0x0",
          chainId: CALIBRATION_CHAIN.chainId,
        }
      : null,
    sampleRead,
    deployHint:
      "FOC_PRIVATE_KEY=0x… node scripts/deploy-registry.mjs --network calibration",
  };
}

export function queryFromReq(req) {
  const host = req.headers?.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  return Object.fromEntries(url.searchParams);
}
