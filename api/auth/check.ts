import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAuth } from "../lib/auth.js";

// GET /api/auth/check — used by the login screen to validate the password.
// Returns 200 if the bearer token matches DASHBOARD_PASSWORD (or no password is set).
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!requireAuth(req, res)) return;
  return res.status(200).json({ ok: true, protected: !!process.env.DASHBOARD_PASSWORD });
}
