import {
  statusPayload,
  metricsText,
  queryFromReq,
} from "../src/demo/handlers.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  const q = queryFromReq(req);
  const s = await statusPayload({
    address: q.address,
    scenario: q.scenario || "live",
  });
  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.status(s.error ? 500 : 200).send(metricsText(s));
}
