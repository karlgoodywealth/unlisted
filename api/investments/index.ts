import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../lib/auth.js";
import { listInvestments, createInvestment } from "../lib/storage.js";
import { insertInvestmentSchema } from "../../shared/schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    try {
      const invs = await listInvestments();
      return res.status(200).json(invs);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    const parsed = insertInvestmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const inv = await createInvestment(parsed.data);
      return res.status(201).json(inv);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
