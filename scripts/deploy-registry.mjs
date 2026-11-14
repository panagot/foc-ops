#!/usr/bin/env node
/**
 * Deploy TierRegistry to Filecoin Calibration (or mainnet).
 *
 * Requires:
 *   FOC_PRIVATE_KEY=0x…   (Calibration wallet with tFIL)
 *   npm i -D solc   (one-time compile) OR pass --bytecode 0x…
 *
 * Usage:
 *   node scripts/deploy-registry.mjs --network calibration
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createWalletClient,
  createPublicClient,
  http,
  encodeDeployData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { calibration, mainnet } from "@filoz/synapse-core/chains";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = process.argv.slice(2);
const network =
  args.includes("--network") && args[args.indexOf("--network") + 1]
    ? args[args.indexOf("--network") + 1]
    : "calibration";

const pk = process.env.FOC_PRIVATE_KEY;
if (!pk || !/^0x[a-fA-F0-9]{64}$/.test(pk)) {
  console.error("Set FOC_PRIVATE_KEY=0x… (64 hex) with Calibration tFIL");
  process.exit(1);
}

async function compile() {
  const bytecodeArg = args.includes("--bytecode")
    ? args[args.indexOf("--bytecode") + 1]
    : null;
  if (bytecodeArg?.startsWith("0x")) {
    return { bytecode: bytecodeArg, abi: null };
  }
  let solc;
  try {
    solc = (await import("solc")).default;
  } catch {
    console.error(
      "Install solc: npm i -D solc   OR pass --bytecode 0x… from forge/hardhat"
    );
    process.exit(1);
  }
  const source = readFileSync(
    path.join(root, "contracts/TierRegistry.sol"),
    "utf8"
  );
  const input = {
    language: "Solidity",
    sources: { "TierRegistry.sol": { content: source } },
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const art = out.contracts?.["TierRegistry.sol"]?.TierRegistry;
  if (!art?.evm?.bytecode?.object) {
    console.error(out.errors || "compile failed");
    process.exit(1);
  }
  return {
    bytecode: `0x${art.evm.bytecode.object}`,
    abi: art.abi,
  };
}

const chain = network === "mainnet" ? mainnet : calibration;
const rpc =
  network === "mainnet"
    ? process.env.FOC_RPC_URL || "https://api.node.glif.io/rpc/v1"
    : process.env.FOC_CALIBRATION_RPC_URL ||
      "https://api.calibration.node.glif.io/rpc/v1";

const { bytecode, abi } = await compile();
const account = privateKeyToAccount(pk);
const wallet = createWalletClient({
  account,
  chain,
  transport: http(rpc),
});
const publicClient = createPublicClient({ chain, transport: http(rpc) });

const data = encodeDeployData({
  abi: abi || [],
  bytecode,
  args: [],
});

console.log(`deploying TierRegistry → ${network} from ${account.address}`);
const hash = await wallet.sendTransaction({ data });
console.log(`tx ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
const address = receipt.contractAddress;
console.log(`TierRegistry @ ${address}`);

const outDir = path.join(root, "deployments");
mkdirSync(outDir, { recursive: true });
const meta = {
  network,
  address,
  txHash: hash,
  deployer: account.address,
  deployedAt: new Date().toISOString(),
  chainId: chain.id,
};
writeFileSync(
  path.join(outDir, `${network}.json`),
  JSON.stringify(meta, null, 2)
);
console.log(`wrote deployments/${network}.json`);
console.log(
  network === "mainnet"
    ? `export FOC_TIER_REGISTRY_MAINNET=${address}`
    : `export FOC_TIER_REGISTRY_CALIBRATION=${address}`
);
