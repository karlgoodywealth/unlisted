import { db } from "./db.js";
import { investments, rounds } from "../../shared/schema.js";
import type {
  Investment,
  InsertInvestment,
  Round,
  InsertRound,
  InvestmentWithRounds,
} from "../../shared/schema.js";
import { eq, asc } from "drizzle-orm";

export async function listInvestments(): Promise<InvestmentWithRounds[]> {
  const invs = await db.select().from(investments);
  const allRounds = await db.select().from(rounds).orderBy(asc(rounds.roundOrder));
  return invs.map((inv) => ({
    ...inv,
    rounds: allRounds.filter((r) => r.investmentId === inv.id),
  }));
}

export async function getInvestment(id: number): Promise<InvestmentWithRounds | undefined> {
  const [inv] = await db.select().from(investments).where(eq(investments.id, id));
  if (!inv) return undefined;
  const rs = await db
    .select()
    .from(rounds)
    .where(eq(rounds.investmentId, id))
    .orderBy(asc(rounds.roundOrder));
  return { ...inv, rounds: rs };
}

export async function createInvestment(data: InsertInvestment): Promise<Investment> {
  const [inv] = await db.insert(investments).values(data).returning();
  return inv;
}

export async function updateInvestment(
  id: number,
  data: Partial<InsertInvestment>,
): Promise<Investment | undefined> {
  if (Object.keys(data).length === 0) {
    const [inv] = await db.select().from(investments).where(eq(investments.id, id));
    return inv;
  }
  const [inv] = await db
    .update(investments)
    .set(data)
    .where(eq(investments.id, id))
    .returning();
  return inv;
}

export async function deleteInvestment(id: number): Promise<boolean> {
  const result = await db.delete(investments).where(eq(investments.id, id)).returning();
  return result.length > 0;
}

export async function createRound(data: InsertRound): Promise<Round> {
  const usdInvested = data.audInvested * data.fxAudUsd;
  const [r] = await db.insert(rounds).values({ ...data, usdInvested }).returning();
  return r;
}

export async function updateRound(
  id: number,
  data: Partial<InsertRound>,
): Promise<Round | undefined> {
  const [existing] = await db.select().from(rounds).where(eq(rounds.id, id));
  if (!existing) return undefined;
  const merged = { ...existing, ...data };
  const usdInvested = merged.audInvested * merged.fxAudUsd;
  const [r] = await db
    .update(rounds)
    .set({ ...data, usdInvested })
    .where(eq(rounds.id, id))
    .returning();
  return r;
}

export async function deleteRound(id: number): Promise<boolean> {
  const result = await db.delete(rounds).where(eq(rounds.id, id)).returning();
  return result.length > 0;
}
