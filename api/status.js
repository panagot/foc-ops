import { statusPayload, queryFromReq } from "../src/demo/handlers.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  const q = queryFromReq(req);
  const body = await statusPayload({
    address: q.address,
    scenario: q.scenario || "live",
  });
  res.status(200).json(body);
}
