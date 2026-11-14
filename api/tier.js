import { tierPayload, queryFromReq } from "../src/demo/handlers.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  const body = await tierPayload(queryFromReq(req));
  res.status(200).json(body);
}
