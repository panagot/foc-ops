import { http, createPublicClient } from "viem";
import { calibration, mainnet } from "@filoz/synapse-core/chains";

/** ~30s Filecoin epoch — used to convert runway epochs → days. */
export const EPOCHS_PER_DAY = 2_880n;

const RPC = {
  mainnet: process.env.FOC_RPC_URL || "https://api.node.glif.io/rpc/v1",
  calibration:
    process.env.FOC_CALIBRATION_RPC_URL ||
    "https://api.calibration.node.glif.io/rpc/v1",
};

export function resolveNetwork(name = "calibration") {
  const key = String(name).toLowerCase();
  if (key === "mainnet" || key === "filecoin") {
    return { id: "mainnet", chain: mainnet, rpcUrl: RPC.mainnet };
  }
  if (key === "calibration" || key === "calibnet" || key === "testnet") {
    return {
      id: "calibration",
      chain: calibration,
      rpcUrl: RPC.calibration,
    };
  }
  throw new Error(`Unknown network "${name}". Use calibration|mainnet.`);
}

export function makePublicClient(networkName) {
  const net = resolveNetwork(networkName);
  const client = createPublicClient({
    chain: net.chain,
    transport: http(net.rpcUrl),
  });
  return { ...net, client };
}
