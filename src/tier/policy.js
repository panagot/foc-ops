import { readFile } from "node:fs/promises";

/**
 * @typedef {{ pieceCid: string, tier?: string, storedAt: string, lastAccessAt?: string, sizeBytes?: number }} InventoryItem
 * @typedef {{ promoteAfterDays: number, minSizeBytes?: number, sourceTiers?: string[], targetTier?: string }} TierPolicy
 */

export async function loadJson(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

/**
 * Dry-run: which warm pieces would promote to cold under the policy.
 * @param {{ policy: TierPolicy, inventory: InventoryItem[], now?: Date }} opts
 */
export function evaluateTier(opts) {
  const now = opts.now ?? new Date();
  const policy = opts.policy;
  const source = new Set(policy.sourceTiers ?? ["warm", "fwss"]);
  const target = policy.targetTier ?? "cold";
  const minSize = policy.minSizeBytes ?? 0;
  const afterMs = (policy.promoteAfterDays ?? 30) * 86_400_000;

  /** @type {Array<InventoryItem & { reason: string, target: string, ageDays: number }>} */
  const promote = [];
  /** @type {Array<InventoryItem & { reason: string }>} */
  const skip = [];

  for (const item of opts.inventory) {
    const tier = (item.tier ?? "warm").toLowerCase();
    if (!source.has(tier)) {
      skip.push({ ...item, reason: `tier=${tier} not in source` });
      continue;
    }
    if ((item.sizeBytes ?? 0) < minSize) {
      skip.push({ ...item, reason: `size < minSizeBytes` });
      continue;
    }
    const storedAt = Date.parse(item.storedAt);
    if (Number.isNaN(storedAt)) {
      skip.push({ ...item, reason: "invalid storedAt" });
      continue;
    }
    const ageDays = (now.getTime() - storedAt) / 86_400_000;
    if (now.getTime() - storedAt < afterMs) {
      skip.push({
        ...item,
        reason: `age ${ageDays.toFixed(1)}d < ${policy.promoteAfterDays}d`,
      });
      continue;
    }
    promote.push({
      ...item,
      reason: `age ${ageDays.toFixed(1)}d >= ${policy.promoteAfterDays}d`,
      target,
      ageDays: Math.round(ageDays * 10) / 10,
    });
  }

  return { promote, skip, target, evaluatedAt: now.toISOString() };
}
