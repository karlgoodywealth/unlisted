// Pure calculation engine for PE valuations. No I/O, no React, fully unit-testable.

export interface RoundInput {
  roundOrder: number;
  audInvested: number;
  fxAudUsd: number; // AUD -> USD rate (e.g. 0.66 means 1 AUD = 0.66 USD)
  postMoneyUsd: number;
  totalRaiseUsd: number;
}

export interface RoundResult extends RoundInput {
  usdInvested: number;
  preMoneyUsd: number;
  pricePerShareProxy: number; // informational, equals postMoneyUsd
  newInvestorOwnershipPct: number; // 0..1
  ownerDilutionFactor: number; // 0..1, applied to existing holders
  userOwnershipBefore: number; // 0..1
  userOwnershipFromExisting: number;
  userOwnershipFromNew: number;
  userOwnershipAfter: number;
  cumulativeAudInvested: number;
}

export interface ValuationSummary {
  finalOwnershipPct: number; // 0..1
  totalAudInvested: number;
  totalUsdInvestedAtRoundFx: number;
  latestValuationUsd: number;
  currentFxAudUsd: number;
  currentValueUsd: number;
  currentValueAud: number;
  grossProfitAud: number;
  carryFeeAud: number;
  netValueAud: number;
  netProfitAud: number;
  moicGross: number;
  moicNet: number;
}

export const CARRY_RATE = 0.2;

export function computeRounds(rounds: RoundInput[]): RoundResult[] {
  const sorted = [...rounds].sort((a, b) => a.roundOrder - b.roundOrder);
  const results: RoundResult[] = [];
  let prevOwnership = 0;
  let cumAud = 0;

  sorted.forEach((r, idx) => {
    const usdInvested = r.audInvested * r.fxAudUsd;
    const preMoneyUsd = r.postMoneyUsd - r.totalRaiseUsd;
    const newInvestorOwnershipPct = r.totalRaiseUsd / r.postMoneyUsd;
    const ownerDilutionFactor = 1 - newInvestorOwnershipPct;
    cumAud += r.audInvested;

    let userOwnershipBefore: number;
    let userOwnershipFromExisting: number;
    let userOwnershipFromNew: number;
    let userOwnershipAfter: number;

    if (idx === 0) {
      // Entry round
      userOwnershipBefore = 0;
      userOwnershipFromExisting = 0;
      userOwnershipFromNew = usdInvested / r.postMoneyUsd;
      userOwnershipAfter = userOwnershipFromNew;
    } else {
      userOwnershipBefore = prevOwnership;
      userOwnershipFromExisting = userOwnershipBefore * ownerDilutionFactor;
      userOwnershipFromNew = usdInvested / r.postMoneyUsd;
      userOwnershipAfter = userOwnershipFromExisting + userOwnershipFromNew;
    }

    results.push({
      ...r,
      usdInvested,
      preMoneyUsd,
      pricePerShareProxy: r.postMoneyUsd,
      newInvestorOwnershipPct,
      ownerDilutionFactor: idx === 0 ? 1 : ownerDilutionFactor,
      userOwnershipBefore,
      userOwnershipFromExisting,
      userOwnershipFromNew,
      userOwnershipAfter,
      cumulativeAudInvested: cumAud,
    });

    prevOwnership = userOwnershipAfter;
  });

  return results;
}

export function summarize(
  rounds: RoundInput[],
  latestValuationUsd: number,
  currentFxAudUsd: number,
): ValuationSummary {
  const computed = computeRounds(rounds);
  const finalOwnershipPct = computed.length === 0 ? 0 : computed[computed.length - 1].userOwnershipAfter;
  const totalAudInvested = computed.reduce((s, r) => s + r.audInvested, 0);
  const totalUsdInvestedAtRoundFx = computed.reduce((s, r) => s + r.usdInvested, 0);

  const currentValueUsd = finalOwnershipPct * latestValuationUsd;
  const currentValueAud = currentFxAudUsd > 0 ? currentValueUsd / currentFxAudUsd : 0;
  const grossProfitAud = currentValueAud - totalAudInvested;
  const carryFeeAud = grossProfitAud > 0 ? grossProfitAud * CARRY_RATE : 0;
  const netValueAud = currentValueAud - carryFeeAud;
  const netProfitAud = netValueAud - totalAudInvested;
  const moicGross = totalAudInvested > 0 ? currentValueAud / totalAudInvested : 0;
  const moicNet = totalAudInvested > 0 ? netValueAud / totalAudInvested : 0;

  return {
    finalOwnershipPct,
    totalAudInvested,
    totalUsdInvestedAtRoundFx,
    latestValuationUsd,
    currentFxAudUsd,
    currentValueUsd,
    currentValueAud,
    grossProfitAud,
    carryFeeAud,
    netValueAud,
    netProfitAud,
    moicGross,
    moicNet,
  };
}

/**
 * Simulate a hypothetical future round on top of the existing position.
 * Used by the "What if" panel — does NOT mutate or persist anything.
 *
 * Two scenarios supported:
 *  1. Pure dilution (you don't participate). Set hypoAudInvested = 0.
 *  2. Pro-rata or new check. Set hypoAudInvested > 0 with an FX rate.
 *
 * Returns the new ownership, what the position is worth at the hypothetical
 * valuation, and net-of-carry numbers using the same 20% carry rule.
 */
export interface ScenarioInput {
  hypoPostMoneyUsd: number;     // company's post-money valuation in the hypothetical round
  hypoRaiseUsd: number;          // total raise in the hypothetical round
  hypoAudInvested: number;       // your follow-on AUD ticket (0 if not participating)
  hypoFxAudUsd: number;          // AUD->USD rate at the hypothetical round (used if participating)
  futureFxAudUsd?: number;       // optional override for the FX used to convert position value back to AUD. Defaults to currentFxAudUsd.
}

export interface ScenarioResult {
  newInvestorOwnershipPct: number;       // % of company sold in the hypothetical round (0..1)
  ownerDilutionFactor: number;           // 0..1 multiplier applied to your prior stake
  ownershipBefore: number;               // 0..1 — your ownership before this round
  ownershipFromExisting: number;          // 0..1 — kept after dilution
  ownershipFromNew: number;               // 0..1 — gained from new check
  ownershipAfter: number;                 // 0..1 — final ownership after the hypothetical round
  additionalAudInvested: number;          // AUD added in this scenario
  totalAudInvested: number;               // cumulative invested incl. scenario check
  positionValueUsd: number;               // ownership × hypothetical post-money
  positionValueAud: number;               // AUD-converted at futureFxAudUsd
  grossProfitAud: number;                 // gross profit vs total invested
  carryFeeAud: number;                    // 20% on positive gross profit only
  netValueAud: number;                    // position value − carry
  netProfitAud: number;                   // net value − total invested
  moicGross: number;                      // position value / total invested
  moicNet: number;                        // net value / total invested
}

export function simulateScenario(
  existingRounds: RoundInput[],
  currentFxAudUsd: number,
  scenario: ScenarioInput,
): ScenarioResult {
  const computed = computeRounds(existingRounds);
  const ownershipBefore = computed.length === 0 ? 0 : computed[computed.length - 1].userOwnershipAfter;
  const priorAudInvested = computed.reduce((s, r) => s + r.audInvested, 0);

  const newInvestorOwnershipPct =
    scenario.hypoPostMoneyUsd > 0 ? scenario.hypoRaiseUsd / scenario.hypoPostMoneyUsd : 0;
  const ownerDilutionFactor = Math.max(0, 1 - newInvestorOwnershipPct);

  const ownershipFromExisting = ownershipBefore * ownerDilutionFactor;
  const usdInvestedInScenario = scenario.hypoAudInvested * scenario.hypoFxAudUsd;
  const ownershipFromNew =
    scenario.hypoPostMoneyUsd > 0 ? usdInvestedInScenario / scenario.hypoPostMoneyUsd : 0;
  const ownershipAfter = ownershipFromExisting + ownershipFromNew;

  const totalAudInvested = priorAudInvested + scenario.hypoAudInvested;
  const positionValueUsd = ownershipAfter * scenario.hypoPostMoneyUsd;
  const fxForConversion = scenario.futureFxAudUsd ?? currentFxAudUsd;
  const positionValueAud = fxForConversion > 0 ? positionValueUsd / fxForConversion : 0;
  const grossProfitAud = positionValueAud - totalAudInvested;
  const carryFeeAud = grossProfitAud > 0 ? grossProfitAud * CARRY_RATE : 0;
  const netValueAud = positionValueAud - carryFeeAud;
  const netProfitAud = netValueAud - totalAudInvested;
  const moicGross = totalAudInvested > 0 ? positionValueAud / totalAudInvested : 0;
  const moicNet = totalAudInvested > 0 ? netValueAud / totalAudInvested : 0;

  return {
    newInvestorOwnershipPct,
    ownerDilutionFactor,
    ownershipBefore,
    ownershipFromExisting,
    ownershipFromNew,
    ownershipAfter,
    additionalAudInvested: scenario.hypoAudInvested,
    totalAudInvested,
    positionValueUsd,
    positionValueAud,
    grossProfitAud,
    carryFeeAud,
    netValueAud,
    netProfitAud,
    moicGross,
    moicNet,
  };
}

// Formatting helpers used across UI
export function formatAud(n: number, decimals = 2): string {
  if (!isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toLocaleString("en-AU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}A$${abs}`;
}

export function formatUsd(n: number, decimals = 0): string {
  if (!isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}US$${abs}`;
}

export function formatPct(n: number, decimals = 3): string {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(decimals)}%`;
}

export function formatMoic(n: number): string {
  if (!isFinite(n) || n === 0) return "—";
  return `${n.toFixed(2)}×`;
}

export function formatNumberCompact(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}
