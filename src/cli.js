#!/usr/bin/env node
import { loadEnvLocal } from "./load-env.js";
import { Command } from "commander";
import { fetchRunway, formatUsdfcWei } from "./finops/runway.js";
import { serveMetrics } from "./finops/metrics.js";
import { evaluateTier, loadJson } from "./tier/policy.js";
import { registryAddress, registryStatus, readPromotion } from "./chain/registry.js";
import { probeNetwork } from "./chain/network.js";

loadEnvLocal();

const program = new Command();
program
  .name("foc-ops")
  .description(
    "FOC Lifecycle Ops — Filecoin Pay FinOps + warm→cold tier policy"
  )
  .version("0.1.0");

program
  .command("status")
  .description("Show Filecoin Pay runway / account health (read-only)")
  .requiredOption("-a, --address <addr>", "0x wallet / Pay account")
  .option("-n, --network <net>", "calibration|mainnet", "calibration")
  .option("--json", "machine-readable JSON", false)
  .action(async (opts) => {
    const s = await fetchRunway({
      address: opts.address,
      network: opts.network,
    });
    if (opts.json) {
      console.log(JSON.stringify(s, null, 2));
      return;
    }
    console.log(`foc-ops status  network=${s.network}`);
    console.log(`address         ${s.address}`);
    console.log(`epoch           ${s.epoch}`);
    console.log(`funds           ${formatUsdfcWei(s.funds)}`);
    console.log(`available       ${formatUsdfcWei(s.availableFunds)}`);
    console.log(`lockup          ${formatUsdfcWei(s.totalLockup)}`);
    console.log(`debt            ${formatUsdfcWei(s.debt)}`);
    console.log(
      `runway          ${s.runwayDays === null ? "inf (no spend)" : s.runwayDays + " days"} (${s.runwayInEpochs} epochs)`
    );
    console.log(
      `gross coverage  ${s.grossCoverageDays === null ? "inf" : s.grossCoverageDays + " days"}`
    );
    console.log(`alert           ${s.alert}${s.healthy ? "" : " !"}`);
    const reg = registryAddress(s.network);
    console.log(`tier registry   ${reg || "(not deployed yet - grant M2)"}`);
  });

const tier = program.command("tier").description("Warm→cold tier policy");

tier
  .command("dry-run")
  .description("List inventory items that would promote under a policy")
  .requiredOption("-p, --policy <file>", "policy JSON")
  .requiredOption("-i, --inventory <file>", "inventory JSON array")
  .option("--json", "machine-readable JSON", false)
  .action(async (opts) => {
    const policy = await loadJson(opts.policy);
    const inventory = await loadJson(opts.inventory);
    if (!Array.isArray(inventory)) {
      throw new Error("inventory must be a JSON array");
    }
    const result = evaluateTier({ policy, inventory });
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(
      `foc-ops tier dry-run  promote=${result.promote.length} skip=${result.skip.length} -> ${result.target}`
    );
    for (const p of result.promote) {
      console.log(`  PROMOTE  ${p.pieceCid}  ${p.reason}`);
    }
    if (result.promote.length === 0) {
      console.log("  (nothing to promote)");
    }
  });

program
  .command("metrics")
  .description("Serve Prometheus metrics for Pay runway")
  .requiredOption("-a, --address <addr>", "0x wallet / Pay account")
  .option("-n, --network <net>", "calibration|mainnet", "calibration")
  .option("-p, --port <port>", "listen port", "9108")
  .action(async (opts) => {
    const port = Number(opts.port);
    await serveMetrics({
      address: opts.address,
      network: opts.network,
      port,
    });
    console.log(
      `foc-ops metrics on :${port}  GET /  address=${opts.address} network=${opts.network}`
    );
  });

program
  .command("network")
  .description("Probe live Filecoin RPC (Calibration by default)")
  .option("-n, --network <net>", "calibration|mainnet", "calibration")
  .option("--json", "machine-readable JSON", false)
  .action(async (opts) => {
    const n = await probeNetwork(opts.network);
    if (opts.json) {
      console.log(JSON.stringify(n, null, 2));
      return;
    }
    console.log(
      `foc-ops network  ${n.network} chainId=${n.chainId} block=${n.blockNumber} latency=${n.latencyMs}ms match=${n.chainMatch}`
    );
  });

const registry = program
  .command("registry")
  .description("FVM TierRegistry status / read");

registry
  .command("status")
  .description("Show deploy address + sample calldata")
  .option("-n, --network <net>", "calibration|mainnet", "calibration")
  .option("--json", "machine-readable JSON", false)
  .action(async (opts) => {
    const s = registryStatus(opts.network);
    if (opts.json) {
      console.log(JSON.stringify(s, null, 2));
      return;
    }
    console.log(`foc-ops registry  network=${s.network}`);
    console.log(`deployed          ${s.deployed}`);
    console.log(`address           ${s.address || "(run scripts/deploy-registry.mjs)"}`);
    console.log(`sample calldata   ${s.sampleCalldata.slice(0, 66)}…`);
  });

registry
  .command("get")
  .description("Read on-chain promotion for a warm PieceCID")
  .requiredOption("--piece <cid>", "warm PieceCID string")
  .option("-n, --network <net>", "calibration|mainnet", "calibration")
  .option("--json", "machine-readable JSON", false)
  .action(async (opts) => {
    const row = await readPromotion(opts.network, opts.piece);
    if (opts.json) {
      console.log(JSON.stringify(row, null, 2));
      return;
    }
    console.log(JSON.stringify(row, null, 2));
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
