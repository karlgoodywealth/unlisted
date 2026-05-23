import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../../lib/auth.js";
import { createRound } from "../../lib/storage.js";
import { insertRoundSchema } from "../../../shared/schema.js";

const roundCreateSchema = insertRoundSchema.omit({ investmentId: true });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const investmentId = Number(req.query.id);
  if (!Number.isFinite(investmentId)) return res.status(400).json({ error: "Invalid id" });

  const parsed = roundCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const r = await createRound({ ...parsed.data, investmentId });
    return res.status(201).json(r);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
