import { makePublicClient } from "../config.js";

/**
 * Prove real Calibration (or mainnet) connectivity — always, even when FinOps uses scenarios.
 */
export async function probeNetwork(network = "calibration") {
  const started = Date.now();
  const { id, rpcUrl, client, chain } = makePublicClient(network);
  const [blockNumber, chainId] = await Promise.all([
    client.getBlockNumber(),
    client.getChainId(),
  ]);
  return {
    ok: true,
    network: id,
    chainId: Number(chainId),
    expectedChainId: chain.id,
    chainMatch: Number(chainId) === chain.id,
    blockNumber: blockNumber.toString(),
    rpcUrl,
    latencyMs: Date.now() - started,
    probedAt: new Date().toISOString(),
  };
}
