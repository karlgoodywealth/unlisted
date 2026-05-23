import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Simple password gate for personal use.
 * Frontend sends Authorization: Bearer <PASSWORD> on every API call.
 * Returns true if the password is valid, false otherwise (and sends 401 itself).
 *
 * If DASHBOARD_PASSWORD is not set in the environment, the gate is OPEN
 * (useful for local dev). In production, ALWAYS set DASHBOARD_PASSWORD.
 */
export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return true; // no password configured — allow (dev mode)

  const header = req.headers["authorization"] || "";
  const headerStr = Array.isArray(header) ? header[0] : header;
  const provided = headerStr.startsWith("Bearer ") ? headerStr.slice(7) : "";

  if (provided !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
