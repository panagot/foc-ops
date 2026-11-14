#!/usr/bin/env node
/**
 * Generate a local Calibration test wallet (gitignored under .wallets/).
 * Usage: node scripts/gen-local-wallet.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, ".wallets");
mkdirSync(dir, { recursive: true });

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);
const out = {
  network: "calibration",
  chainId: 314159,
  address: account.address,
  privateKey,
  createdAt: new Date().toISOString(),
  note: "LOCAL TEST ONLY — gitignored. Fund via Calibration tFIL faucet.",
};

const file = path.join(dir, "calibration-test.json");
writeFileSync(file, JSON.stringify(out, null, 2));
writeFileSync(
  path.join(root, ".env.local"),
  [
    "FOC_DEMO_NETWORK=calibration",
    "FOC_CALIBRATION_RPC_URL=https://api.calibration.node.glif.io/rpc/v1",
    `FOC_DEMO_ADDRESS=${account.address}`,
    `FOC_PRIVATE_KEY=${privateKey}`,
    "",
  ].join("\n")
);

console.log("Wrote", file);
console.log("Address", account.address);
console.log("Also wrote .env.local (gitignored)");
console.log("Next: fund tFIL → https://faucet.calibnet.chainsafe-fil.io/  (or current Calibration faucet)");
console.log("Then: npm run demo   and Connect wallet / Live Calibration");
