import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../lib/auth.js";
import { updateRound, deleteRound } from "../lib/storage.js";
import { updateRoundSchema } from "../../shared/schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    if (req.method === "PATCH") {
      const parsed = updateRoundSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const r = await updateRound(id, parsed.data);
      if (!r) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(r);
    }

    if (req.method === "DELETE") {
      const ok = await deleteRound(id);
      if (!ok) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ ok: true });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
