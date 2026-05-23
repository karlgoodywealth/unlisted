import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "./lib/auth.js";
import { db } from "./lib/db.js";
import { investments, rounds } from "../shared/schema.js";

/**
 * POST /api/seed — one-time seed of the example Anthropic position.
 * Idempotent: if any investment already exists, does nothing.
 * Protected by the same password gate.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const existing = await db.select().from(investments);
    if (existing.length > 0) {
      return res.status(200).json({ seeded: false, reason: "Investments already exist" });
    }

    const [inv] = await db
      .insert(investments)
      .values({
        name: "Anthropic (Example)",
        notes: "Demo entry — edit or delete",
        latestValuationUsd: 183_000_000_000,
        currentFxAudUsd: 0.66,
      })
      .returning();

    const seedRounds = [
      {
        investmentId: inv.id,
        roundOrder: 1,
        roundName: "Series A",
        audInvested: 50_000,
        fxAudUsd: 0.7,
        usdInvested: 35_000,
        postMoneyValuationUsd: 4_000_000_000,
        totalRaiseUsd: 580_000_000,
      },
      {
        investmentId: inv.id,
        roundOrder: 2,
        roundName: "Series C",
        audInvested: 0,
        fxAudUsd: 0.65,
        usdInvested: 0,
        postMoneyValuationUsd: 18_400_000_000,
        totalRaiseUsd: 4_000_000_000,
      },
      {
        investmentId: inv.id,
        roundOrder: 3,
        roundName: "Series E",
        audInvested: 25_000,
        fxAudUsd: 0.66,
        usdInvested: 16_500,
        postMoneyValuationUsd: 61_500_000_000,
        totalRaiseUsd: 3_500_000_000,
      },
    ];
    await db.insert(rounds).values(seedRounds);

    return res.status(201).json({ seeded: true, investmentId: inv.id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
