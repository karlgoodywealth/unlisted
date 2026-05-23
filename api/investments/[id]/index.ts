import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../../lib/auth.js";
import {
  getInvestment,
  updateInvestment,
  deleteInvestment,
} from "../../lib/storage.js";
import { updateInvestmentSchema } from "../../../shared/schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    if (req.method === "GET") {
      const inv = await getInvestment(id);
      if (!inv) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(inv);
    }

    if (req.method === "PATCH") {
      const parsed = updateInvestmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const inv = await updateInvestment(id, parsed.data);
      if (!inv) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(inv);
    }

    if (req.method === "DELETE") {
      const ok = await deleteInvestment(id);
      if (!ok) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ ok: true });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
