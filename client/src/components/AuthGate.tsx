import { useEffect, useState } from "react";
import { setAuthToken } from "@/lib/queryClient";
import { Logo } from "@/components/Logo";

/**
 * Auth gate: prompts for the dashboard password on first load.
 * Behaviour:
 *  1. On mount, calls /api/auth/check with no token.
 *      - 200 → server is open (no DASHBOARD_PASSWORD set), unlock immediately.
 *      - 401 → show password screen.
 *  2. User enters password → call /api/auth/check with Bearer token.
 *      - 200 → store token in memory and unlock.
 *      - 401 → show error.
 *
 * Token is held in memory only (not localStorage — it would survive logout
 * and isn't necessary for a personal tool). Refreshing re-prompts.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/check");
        if (cancelled) return;
        if (res.ok) {
          setStatus("unlocked");
        } else {
          setStatus("locked");
        }
      } catch {
        if (!cancelled) setStatus("locked");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/check", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        setAuthToken(password);
        setStatus("unlocked");
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm border border-border rounded-lg bg-card p-8 space-y-6"
          data-testid="form-login"
        >
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium leading-none">
                Goody Labs
              </div>
              <div className="text-[15px] font-semibold leading-tight mt-0.5">
                Private Investment Portfolio
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {error && (
              <div className="text-xs text-destructive" data-testid="text-login-error">
                {error}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting || !password}
            data-testid="button-login"
            className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {submitting ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
