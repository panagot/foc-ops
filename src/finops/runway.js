import { getAccountSummary } from "@filoz/synapse-core/pay";
import { EPOCHS_PER_DAY, makePublicClient } from "../config.js";

const MAX_UINT = (1n << 256n) - 1n;

/**
 * Read-only Filecoin Pay health for an address.
 * @param {{ address: `0x${string}`, network?: string }} opts
 */
export async function fetchRunway(opts) {
  const { address, network = "calibration" } = opts;
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Valid --address 0x… is required");
  }

  const { id, client, rpcUrl } = makePublicClient(network);
  const summary = await getAccountSummary(client, { address });

  const runwayDays = epochsToDays(summary.runwayInEpochs);
  const grossDays = epochsToDays(summary.grossCoverageInEpochs);
  const healthy = summary.debt === 0n && summary.runwayInEpochs !== 0n;

  return {
    network: id,
    rpcUrl,
    address,
    epoch: summary.epoch.toString(),
    funds: summary.funds.toString(),
    availableFunds: summary.availableFunds.toString(),
    totalLockup: summary.totalLockup.toString(),
    debt: summary.debt.toString(),
    lockupRatePerEpoch: summary.lockupRatePerEpoch.toString(),
    runwayInEpochs: summary.runwayInEpochs.toString(),
    grossCoverageInEpochs: summary.grossCoverageInEpochs.toString(),
    runwayDays,
    grossCoverageDays: grossDays,
    healthy,
    alert:
      summary.debt > 0n
        ? "deficit"
        : runwayDays !== null && runwayDays < 14
          ? "low_runway"
          : "ok",
  };
}

function epochsToDays(epochs) {
  if (epochs === MAX_UINT) return null; // infinite / no spend
  if (epochs === 0n) return 0;
  const days = Number(epochs) / Number(EPOCHS_PER_DAY);
  return Math.round(days * 100) / 100;
}

export function formatUsdfcWei(weiStr) {
  const wei = BigInt(weiStr);
  const whole = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  const fracStr = frac.toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${fracStr} USDFC`;
}
