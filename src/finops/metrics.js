import http from "node:http";
import { fetchRunway, formatUsdfcWei } from "./runway.js";

/**
 * Serve Prometheus text exposition for FOC Pay runway.
 */
export async function serveMetrics({ address, network, port = 9108 }) {
  const server = http.createServer(async (_req, res) => {
    try {
      const s = await fetchRunway({ address, network });
      const runway = s.runwayDays === null ? -1 : s.runwayDays;
      const gross = s.grossCoverageDays === null ? -1 : s.grossCoverageDays;
      const body = [
        `# HELP foc_ops_runway_days Days until Filecoin Pay deficit (available funds). -1 = infinite/no spend.`,
        `# TYPE foc_ops_runway_days gauge`,
        `foc_ops_runway_days{network="${s.network}",address="${s.address}"} ${runway}`,
        `# HELP foc_ops_gross_coverage_days Gross deposit coverage in days. -1 = infinite.`,
        `# TYPE foc_ops_gross_coverage_days gauge`,
        `foc_ops_gross_coverage_days{network="${s.network}",address="${s.address}"} ${gross}`,
        `# HELP foc_ops_available_usdfc Available (unreserved) USDFC funds.`,
        `# TYPE foc_ops_available_usdfc gauge`,
        `foc_ops_available_usdfc{network="${s.network}",address="${s.address}"} ${Number(BigInt(s.availableFunds)) / 1e18}`,
        `# HELP foc_ops_debt_usdfc Payment debt (0 = healthy).`,
        `# TYPE foc_ops_debt_usdfc gauge`,
        `foc_ops_debt_usdfc{network="${s.network}",address="${s.address}"} ${Number(BigInt(s.debt)) / 1e18}`,
        `# HELP foc_ops_alert 0=ok 1=low_runway 2=deficit`,
        `# TYPE foc_ops_alert gauge`,
        `foc_ops_alert{network="${s.network}",address="${s.address}"} ${s.alert === "ok" ? 0 : s.alert === "low_runway" ? 1 : 2}`,
        `# foc-ops human: available=${formatUsdfcWei(s.availableFunds)} alert=${s.alert}`,
        "",
      ].join("\n");
      res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`# error: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  });

  await new Promise((resolve) => server.listen(port, resolve));
  return { port, server };
}
