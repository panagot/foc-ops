/** FinOps scenario fixtures for capability-theater demos (Calibration-shaped). */

const W = (n) => BigInt(Math.round(n * 1e18)).toString();

/**
 * @param {'healthy'|'low_runway'|'deficit'} id
 * @param {string} [address]
 */
export function scenarioStatus(id, address = "0xDemo000000000000000000000000000000000001") {
  const epoch = String(2_450_000 + Math.floor(Date.now() / 30_000) % 10_000);
  const base = {
    network: "calibration",
    rpcUrl: "scenario://fixture",
    address,
    epoch,
    mode: "scenario",
    scenario: id,
  };

  if (id === "healthy") {
    return {
      ...base,
      funds: W(500),
      availableFunds: W(320),
      totalLockup: W(180),
      debt: W(0),
      lockupRatePerEpoch: W(0.0008),
      runwayInEpochs: String(Math.round(45 * 2880)),
      grossCoverageInEpochs: String(Math.round(62 * 2880)),
      runwayDays: 45.2,
      grossCoverageDays: 62.1,
      healthy: true,
      alert: "ok",
    };
  }

  if (id === "deficit") {
    return {
      ...base,
      funds: W(40),
      availableFunds: W(0),
      totalLockup: W(95),
      debt: W(55),
      lockupRatePerEpoch: W(0.004),
      runwayInEpochs: "0",
      grossCoverageInEpochs: "0",
      runwayDays: 0,
      grossCoverageDays: 0,
      healthy: false,
      alert: "deficit",
    };
  }

  // low_runway (default story)
  return {
    ...base,
    funds: W(85),
    availableFunds: W(22),
    totalLockup: W(63),
    debt: W(0),
    lockupRatePerEpoch: W(0.0012),
    runwayInEpochs: String(Math.round(6.2 * 2880)),
    grossCoverageInEpochs: String(Math.round(11.4 * 2880)),
    runwayDays: 6.2,
    grossCoverageDays: 11.4,
    healthy: true,
    alert: "low_runway",
  };
}

/** Estimate warm→cold savings: ~0.18 USDFC/day per GiB warm (demo model). */
export function couplingEstimate(promote) {
  const bytes = promote.reduce((s, p) => s + (p.sizeBytes || 0), 0);
  const gib = bytes / 1024 ** 3;
  const burnSavedPerDay = Math.round(gib * 0.18 * 1000) / 1000;
  const runwayDaysGained = Math.round(burnSavedPerDay * 4.2 * 10) / 10; // demo multiplier
  return {
    promoteCount: promote.length,
    bytes,
    gib: Math.round(gib * 1000) / 1000,
    burnSavedPerDayUsdfc: burnSavedPerDay,
    runwayDaysGained,
    model:
      "Demo model: ~0.18 USDFC/day per GiB warm avoided after cold promote. Not a chain quote.",
  };
}

export const SCENARIO_IDS = ["low_runway", "healthy", "deficit", "live"];
