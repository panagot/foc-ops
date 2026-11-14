import { networkPayload, queryFromReq } from "../src/demo/handlers.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  const q = queryFromReq(req);
  try {
    const body = await networkPayload(q.network);
    res.status(200).json(body);
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
