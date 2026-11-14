/**
 * FVM TierRegistry helpers (Calibration / Mainnet).
 * Contract source: contracts/TierRegistry.sol
 */
import { keccak256, stringToHex, encodeFunctionData } from "viem";
import { makePublicClient } from "../config.js";

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deploymentsDir = path.join(__dirname, "../../deployments");

function loadDeployed(network) {
  const env =
    network === "mainnet"
      ? process.env.FOC_TIER_REGISTRY_MAINNET
      : process.env.FOC_TIER_REGISTRY_CALIBRATION;
  if (env) return env;
  const file = path.join(deploymentsDir, `${network}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")).address || null;
  } catch {
    return null;
  }
}

export const TIER_REGISTRY = {
  get calibration() {
    return loadDeployed("calibration");
  },
  get mainnet() {
    return loadDeployed("mainnet");
  },
};

/** Filecoin Calibration — for wallet_addEthereumChain */
export const CALIBRATION_CHAIN = {
  chainId: "0x4cb2f", // 314159
  chainIdDecimal: 314159,
  chainName: "Filecoin Calibration",
  nativeCurrency: { name: "tFIL", symbol: "tFIL", decimals: 18 },
  rpcUrls: [
    process.env.FOC_CALIBRATION_RPC_URL ||
      "https://api.calibration.node.glif.io/rpc/v1",
  ],
  blockExplorerUrls: ["https://calibration.filfox.info/en"],
};

export const tierRegistryAbi = [
  {
    type: "function",
    name: "recordPromotion",
    stateMutability: "nonpayable",
    inputs: [
      { name: "warmPieceCid", type: "bytes32" },
      { name: "coldRefHash", type: "bytes32" },
      { name: "policyId", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getPromotion",
    stateMutability: "view",
    inputs: [{ name: "warmPieceCid", type: "bytes32" }],
    outputs: [
      { name: "coldRefHash", type: "bytes32" },
      { name: "policyId", type: "bytes32" },
      { name: "promotedAt", type: "uint64" },
    ],
  },
  {
    type: "function",
    name: "promotions",
    stateMutability: "view",
    inputs: [{ name: "warmPieceCid", type: "bytes32" }],
    outputs: [
      { name: "coldRefHash", type: "bytes32" },
      { name: "policyId", type: "bytes32" },
      { name: "promotedAt", type: "uint64" },
      { name: "operator", type: "address" },
    ],
  },
  {
    type: "event",
    name: "Promoted",
    inputs: [
      { name: "warmPieceCid", type: "bytes32", indexed: true },
      { name: "coldRefHash", type: "bytes32", indexed: false },
      { name: "policyId", type: "bytes32", indexed: false },
      { name: "operator", type: "address", indexed: true },
      { name: "promotedAt", type: "uint64", indexed: false },
    ],
  },
];

export function registryAddress(network) {
  const key = network === "mainnet" ? "mainnet" : "calibration";
  return TIER_REGISTRY[key];
}

export function cidDigest(cidOrRef) {
  return keccak256(stringToHex(String(cidOrRef)));
}

export function encodeRecordPromotion({ warmPieceCid, coldRef, policyId }) {
  const warm = cidDigest(warmPieceCid);
  const cold = cidDigest(coldRef || `cold:${warmPieceCid}`);
  const policy = cidDigest(policyId || "foc-ops-default");
  const data = encodeFunctionData({
    abi: tierRegistryAbi,
    functionName: "recordPromotion",
    args: [warm, cold, policy],
  });
  return { warm, cold, policy, data };
}

export async function readPromotion(network, warmPieceCid) {
  const address = registryAddress(network);
  if (!address) {
    return {
      deployed: false,
      address: null,
      network,
      note: "Set FOC_TIER_REGISTRY_CALIBRATION after deploy (scripts/deploy-registry.mjs)",
    };
  }
  const { client } = makePublicClient(network);
  const warm = cidDigest(warmPieceCid);
  const row = await client.readContract({
    address,
    abi: tierRegistryAbi,
    functionName: "promotions",
    args: [warm],
  });
  const [coldRefHash, policyId, promotedAt, operator] = row;
  const empty = coldRefHash === `0x${"0".repeat(64)}`;
  return {
    deployed: true,
    address,
    network,
    warmDigest: warm,
    found: !empty,
    coldRefHash,
    policyId,
    promotedAt: Number(promotedAt),
    operator,
  };
}

export function registryStatus(network = "calibration") {
  const address = registryAddress(network);
  const encoded = encodeRecordPromotion({
    warmPieceCid: "bafkzcibexample-warm-demo",
    coldRef: "bafkzcibexample-cold-demo",
    policyId: "promoteAfterDays:30",
  });
  return {
    network,
    deployed: Boolean(address),
    address,
    abiFunctions: ["recordPromotion", "getPromotion", "promotions"],
    sampleCalldata: encoded.data,
    sampleDigests: {
      warm: encoded.warm,
      cold: encoded.cold,
      policy: encoded.policy,
    },
    calibrationChain: CALIBRATION_CHAIN,
  };
}
