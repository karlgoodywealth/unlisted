import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InvestmentWithRounds, Round } from "@shared/schema";
import {
  computeRounds,
  summarize,
  simulateScenario,
  formatAud,
  formatUsd,
  formatPct,
  formatMoic,
  formatNumberCompact,
  RoundInput,
} from "@/lib/calc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/NumberInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// --------- Investments query ---------
function useInvestments() {
  return useQuery<InvestmentWithRounds[]>({ queryKey: ["/api/investments"] });
}

// --------- KPI tile ---------
function Kpi({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneCls =
    tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-foreground";
  return (
    <Card className="p-4 sm:p-5 flex flex-col gap-1.5 min-w-0">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
        {label}
      </div>
      <div
        data-numeric
        className={`font-mono text-[1.0625rem] md:text-[1.3rem] font-semibold tracking-tight ${toneCls}`}
        style={{ wordBreak: "break-word" }}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground truncate">{hint}</div>}
    </Card>
  );
}

// --------- New investment dialog ---------
function NewInvestmentDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [latestVal, setLatestVal] = useState("");
  const [fx, setFx] = useState("0.66");
  const [roundName, setRoundName] = useState("Series A");
  const [aud, setAud] = useState("");
  const [rfx, setRfx] = useState("0.66");
  const [postMoney, setPostMoney] = useState("");
  const [raise, setRaise] = useState("");
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async () => {
      const inv = await apiRequest("POST", "/api/investments", {
        name,
        notes: notes || null,
        latestValuationUsd: Number(latestVal),
        currentFxAudUsd: Number(fx),
      });
      const created = await inv.json();
      await apiRequest("POST", `/api/investments/${created.id}/rounds`, {
        roundOrder: 1,
        roundName,
        audInvested: Number(aud),
        fxAudUsd: Number(rfx),
        postMoneyValuationUsd: Number(postMoney),
        totalRaiseUsd: Number(raise),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      toast({ title: "Investment added" });
      setOpen(false);
      setName(""); setNotes(""); setLatestVal(""); setAud(""); setPostMoney(""); setRaise("");
    },
    onError: (e: any) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
  });

  const valid =
    name.trim() &&
    Number(latestVal) > 0 &&
    Number(fx) > 0 &&
    Number(rfx) > 0 &&
    Number(postMoney) > 0 &&
    Number(raise) >= 0 &&
    Number(aud) >= 0 &&
    roundName.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-investment" className="w-full" size="sm">
          <Plus className="size-4 mr-1" /> New investment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New investment</DialogTitle>
          <DialogDescription>
            Enter the company and the entry round. You can add follow-on rounds afterwards.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="ni-name">Company name</Label>
              <Input id="ni-name" data-testid="input-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="ni-notes">Notes (optional)</Label>
              <Textarea id="ni-notes" data-testid="input-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-val">Latest valuation (USD)</Label>
              <NumberInput id="ni-val" data-testid="input-latest-valuation" value={latestVal} onChange={(e) => setLatestVal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-fx">Current FX (AUD→USD)</Label>
              <Input id="ni-fx" data-testid="input-current-fx" type="number" inputMode="decimal" min={0.0001} step="0.0001" value={fx} onChange={(e) => setFx(e.target.value)} />
            </div>
            <div className="sm:col-span-2 mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
              Entry round
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-rname">Round name</Label>
              <Input id="ni-rname" data-testid="input-round-name" value={roundName} onChange={(e) => setRoundName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-aud">AUD invested</Label>
              <NumberInput id="ni-aud" data-testid="input-aud-invested" value={aud} onChange={(e) => setAud(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-rfx">FX at round (AUD→USD)</Label>
              <Input id="ni-rfx" data-testid="input-round-fx" type="number" inputMode="decimal" min={0.0001} step="0.0001" value={rfx} onChange={(e) => setRfx(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-pm">Post-money (USD)</Label>
              <NumberInput id="ni-pm" data-testid="input-post-money" value={postMoney} onChange={(e) => setPostMoney(e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="ni-raise">Total round raise (USD)</Label>
              <NumberInput id="ni-raise" data-testid="input-total-raise" value={raise} onChange={(e) => setRaise(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="min-h-[44px] sm:min-h-0">Cancel</Button>
          <Button data-testid="button-create-investment" disabled={!valid || create.isPending} onClick={() => create.mutate()} className="min-h-[44px] sm:min-h-0">
            {create.isPending ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --------- Editable cell ---------
function EditableNumber({
  value,
  onCommit,
  step = "1",
  min = 0,
  testId,
  useCommas = true,
}: {
  value: number;
  onCommit: (n: number) => void;
  step?: string;
  min?: number;
  testId?: string;
  /** When true (default), display with thousand separators via NumberInput.
   *  Set false for small decimals (e.g. FX rates) where the plain numeric
   *  input + step makes more sense. */
  useCommas?: boolean;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  const commitOnBlur = () => {
    const n = Number(local);
    if (!isNaN(n) && n !== value) onCommit(n);
    else setLocal(String(value));
  };

  if (useCommas) {
    return (
      <NumberInput
        data-testid={testId}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commitOnBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="h-8 px-2 text-right font-mono text-xs"
      />
    );
  }

  return (
    <Input
      data-testid={testId}
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commitOnBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="h-8 px-2 text-right font-mono text-xs"
    />
  );
}

function EditableText({
  value,
  onCommit,
  testId,
  className,
}: {
  value: string;
  onCommit: (s: string) => void;
  testId?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <Input
      data-testid={testId}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={`h-8 px-2 text-xs ${className ?? ""}`}
    />
  );
}

// --------- Rounds table ---------
function RoundsTable({ investment }: { investment: InvestmentWithRounds }) {
  const { toast } = useToast();
  const inputs: RoundInput[] = investment.rounds.map((r) => ({
    roundOrder: r.roundOrder,
    audInvested: r.audInvested,
    fxAudUsd: r.fxAudUsd,
    postMoneyUsd: r.postMoneyValuationUsd,
    totalRaiseUsd: r.totalRaiseUsd,
  }));
  const computed = computeRounds(inputs);

  const updateRound = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Round> }) =>
      apiRequest("PATCH", `/api/rounds/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/investments"] }),
    onError: (e: any) => toast({ title: "Update failed", description: String(e), variant: "destructive" }),
  });

  const deleteRound = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/rounds/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/investments"] }),
  });

  const addRound = useMutation({
    mutationFn: async () => {
      const nextOrder = Math.max(0, ...investment.rounds.map((r) => r.roundOrder)) + 1;
      const last = investment.rounds[investment.rounds.length - 1];
      return apiRequest("POST", `/api/investments/${investment.id}/rounds`, {
        roundOrder: nextOrder,
        roundName: `Round ${nextOrder}`,
        audInvested: 0,
        fxAudUsd: last?.fxAudUsd ?? investment.currentFxAudUsd,
        postMoneyValuationUsd: (last?.postMoneyValuationUsd ?? 1_000_000_000) * 1.5,
        totalRaiseUsd: (last?.totalRaiseUsd ?? 50_000_000),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/investments"] }),
  });

  return (
    <div className="border border-card-border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium text-[11px] uppercase tracking-wider text-muted-foreground">Round</th>
              <th className="px-3 py-2 font-medium text-[11px] uppercase tracking-wider text-muted-foreground text-right">AUD in</th>
              <th className="px-3 py-2 font-medium text-[11px] uppercase tracking-wider text-muted-foreground text-right">FX</th>
              <th className="px-3 py-2 font-medium text-[11px] uppercase tracking-wider text-muted-foreground text-right">USD in</th>
              <th className="px-3 py-2 font-medium text-[11px] uppercase tracking-wider text-muted-foreground text-right">Post-money</th>
              <th className="px-3 py-2 font-medium text-[11px] uppercase tracking-wider text-muted-foreground text-right">Raise</th>
              <th className="px-3 py-2 font-medium text-[11px] uppercase tracking-wider text-muted-foreground text-right">Dilution</th>
              <th className="px-3 py-2 font-medium text-[11px] uppercase tracking-wider text-muted-foreground text-right">Ownership</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {investment.rounds.map((r, i) => {
              const c = computed[i];
              const dilution = i === 0 ? 0 : 1 - c.ownerDilutionFactor;
              return (
                <tr key={r.id} className="border-t border-card-border" data-testid={`row-round-${r.id}`}>
                  <td className="px-2 py-1.5 min-w-[110px]">
                    <EditableText
                      value={r.roundName}
                      testId={`input-round-name-${r.id}`}
                      onCommit={(v) => updateRound.mutate({ id: r.id, data: { roundName: v } })}
                    />
                  </td>
                  <td className="px-2 py-1.5 min-w-[100px]">
                    <EditableNumber
                      value={r.audInvested}
                      testId={`input-aud-${r.id}`}
                      onCommit={(n) => updateRound.mutate({ id: r.id, data: { audInvested: n } as any })}
                    />
                  </td>
                  <td className="px-2 py-1.5 min-w-[90px]">
                    <EditableNumber
                      value={r.fxAudUsd}
                      step="0.0001"
                      min={0.0001}
                      useCommas={false}
                      testId={`input-fx-${r.id}`}
                      onCommit={(n) => updateRound.mutate({ id: r.id, data: { fxAudUsd: n } as any })}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs text-muted-foreground" data-numeric>
                    {formatUsd(c.usdInvested, 0)}
                  </td>
                  <td className="px-2 py-1.5 min-w-[140px]">
                    <EditableNumber
                      value={r.postMoneyValuationUsd}
                      step="1000000"
                      testId={`input-postmoney-${r.id}`}
                      onCommit={(n) => updateRound.mutate({ id: r.id, data: { postMoneyValuationUsd: n } as any })}
                    />
                  </td>
                  <td className="px-2 py-1.5 min-w-[130px]">
                    <EditableNumber
                      value={r.totalRaiseUsd}
                      step="1000000"
                      testId={`input-raise-${r.id}`}
                      onCommit={(n) => updateRound.mutate({ id: r.id, data: { totalRaiseUsd: n } as any })}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs text-muted-foreground" data-numeric>
                    {i === 0 ? "—" : formatPct(dilution, 2)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold" data-numeric>
                    {formatPct(c.userOwnershipAfter, 3)}
                  </td>
                  <td className="px-2 py-1.5">
                    {investment.rounds.length > 1 && (
                      <button
                        type="button"
                        aria-label="Delete round"
                        data-testid={`button-delete-round-${r.id}`}
                        onClick={() => deleteRound.mutate(r.id)}
                        className="p-1 rounded hover-elevate text-muted-foreground hover:text-negative"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-card-border px-3 py-2 bg-muted/30 flex justify-between items-center">
        <div className="text-[11px] text-muted-foreground">
          {investment.rounds.length} round{investment.rounds.length === 1 ? "" : "s"}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          data-testid="button-add-round"
          onClick={() => addRound.mutate()}
        >
          <Plus className="size-3.5 mr-1" /> Add round
        </Button>
      </div>
    </div>
  );
}

// --------- Detail panel ---------
function DetailPanel({ investment }: { investment: InvestmentWithRounds }) {
  const { toast } = useToast();
  const inputs: RoundInput[] = investment.rounds.map((r) => ({
    roundOrder: r.roundOrder,
    audInvested: r.audInvested,
    fxAudUsd: r.fxAudUsd,
    postMoneyUsd: r.postMoneyValuationUsd,
    totalRaiseUsd: r.totalRaiseUsd,
  }));
  const computed = computeRounds(inputs);
  const summary = summarize(inputs, investment.latestValuationUsd, investment.currentFxAudUsd);

  const updateInv = useMutation({
    mutationFn: async (data: any) => apiRequest("PATCH", `/api/investments/${investment.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/investments"] }),
    onError: (e: any) => toast({ title: "Update failed", description: String(e), variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/investments/${investment.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      toast({ title: "Investment deleted" });
    },
  });
  const [confirmDel, setConfirmDel] = useState(false);

  const chartData = computed.map((c) => ({
    name: investment.rounds.find((r) => r.roundOrder === c.roundOrder)?.roundName ?? `R${c.roundOrder}`,
    ownership: +(c.userOwnershipAfter * 100).toFixed(4),
    valuation: c.postMoneyUsd,
  }));

  const profitTone = summary.grossProfitAud > 0 ? "positive" : summary.grossProfitAud < 0 ? "negative" : "neutral";

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <EditableText
              value={investment.name}
              testId="input-investment-name"
              onCommit={(v) => updateInv.mutate({ name: v })}
              className="!h-9 !text-lg font-semibold !px-2 -ml-2"
            />
            <Textarea
              data-testid="input-investment-notes"
              defaultValue={investment.notes ?? ""}
              key={investment.id + "-notes"}
              onBlur={(e) => {
                if (e.currentTarget.value !== (investment.notes ?? "")) {
                  updateInv.mutate({ notes: e.currentTarget.value || null });
                }
              }}
              placeholder="Notes…"
              rows={2}
              className="mt-2 text-xs resize-none"
            />
          </div>
          <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-delete-investment" className="text-muted-foreground h-11 w-11 sm:h-9 sm:w-9" aria-label="Delete investment">
                <Trash2 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete {investment.name}?</DialogTitle>
                <DialogDescription>This removes the investment and all its rounds.</DialogDescription>
              </DialogHeader>
              <div className="px-5 py-2 sm:px-6" />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirmDel(false)} className="min-h-[44px] sm:min-h-0">Cancel</Button>
                <Button variant="destructive" data-testid="button-confirm-delete" onClick={() => del.mutate()} className="min-h-[44px] sm:min-h-0">Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium">Latest valuation (USD)</Label>
            <EditableNumber
              value={investment.latestValuationUsd}
              step="1000000"
              testId="input-latest-valuation"
              onCommit={(n) => updateInv.mutate({ latestValuationUsd: n })}
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium">Current FX (AUD → USD)</Label>
            <EditableNumber
              value={investment.currentFxAudUsd}
              step="0.0001"
              min={0.0001}
              useCommas={false}
              testId="input-current-fx"
              onCommit={(n) => updateInv.mutate({ currentFxAudUsd: n })}
            />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="rounds" data-testid="tab-rounds">Rounds</TabsTrigger>
          <TabsTrigger value="chart" data-testid="tab-chart">Trajectory</TabsTrigger>
          <TabsTrigger value="whatif" data-testid="tab-whatif">What if</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Kpi label="Ownership" value={formatPct(summary.finalOwnershipPct, 3)} hint={`At US$${formatNumberCompact(investment.latestValuationUsd)} mark`} />
            <Kpi label="Invested" value={formatAud(summary.totalAudInvested, 0)} hint={`${formatUsd(summary.totalUsdInvestedAtRoundFx, 0)} at round FX`} />
            <Kpi label="Gross value" value={formatAud(summary.currentValueAud, 0)} hint={`US$${formatNumberCompact(summary.currentValueUsd)}`} />
            <Kpi label="20% carry" value={formatAud(summary.carryFeeAud, 0)} hint="On profit only" />
            <Kpi label="Net value" value={formatAud(summary.netValueAud, 0)} hint={`${formatMoic(summary.moicNet)} net MOIC`} tone={profitTone === "negative" ? "negative" : "neutral"} />
            <Kpi
              label="Net profit"
              value={formatAud(summary.netProfitAud, 0)}
              hint={`Gross profit ${formatAud(summary.grossProfitAud, 0)}`}
              tone={summary.netProfitAud > 0 ? "positive" : summary.netProfitAud < 0 ? "negative" : "neutral"}
            />
          </div>
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium mb-2">
              Dilution journey
            </div>
            <div className="space-y-2">
              {computed.map((c, i) => {
                const r = investment.rounds[i];
                return (
                  <div key={r.id} className="flex items-center gap-3 text-xs">
                    <div className="w-20 text-muted-foreground">{r.roundName}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(100, (c.userOwnershipAfter / Math.max(0.0001, computed[0].userOwnershipAfter)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="w-20 text-right font-mono" data-numeric>
                      {formatPct(c.userOwnershipAfter, 3)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rounds" className="mt-4">
          <RoundsTable investment={investment} />
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium mb-2">
              Ownership vs. post-money
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 24, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatNumberCompact(v)}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--popover-border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    formatter={(value: any, name: string) =>
                      name === "Ownership" ? `${value}%` : formatUsd(Number(value), 0)
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="ownership" name="Ownership" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="valuation" name="Post-money USD" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="whatif" className="mt-4">
          <WhatIfPanel investment={investment} />
        </TabsContent>
      </Tabs>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Net value applies a 20% performance fee (carry) to gross profit only. Capital is returned in full before fees.
      </p>
    </div>
  );
}

// --------- What if (scenario) ---------
function WhatIfPanel({ investment }: { investment: InvestmentWithRounds }) {
  // Sensible defaults: company raises another round at 1.5× the latest known
  // valuation, 15% of that as the raise size, no follow-on participation.
  const defaultPostMoney = useMemo(
    () => Math.max(investment.latestValuationUsd * 1.5, investment.latestValuationUsd + 1),
    [investment.latestValuationUsd],
  );
  const defaultRaise = useMemo(() => defaultPostMoney * 0.15, [defaultPostMoney]);

  const [postMoney, setPostMoney] = useState<string>(String(Math.round(defaultPostMoney)));
  const [raise, setRaise] = useState<string>(String(Math.round(defaultRaise)));
  const [audInvested, setAudInvested] = useState<string>("0");
  const [scenarioFx, setScenarioFx] = useState<string>(String(investment.currentFxAudUsd));
  const [futureFx, setFutureFx] = useState<string>(String(investment.currentFxAudUsd));

  const existingRounds: RoundInput[] = useMemo(
    () =>
      investment.rounds.map((r) => ({
        roundOrder: r.roundOrder,
        audInvested: r.audInvested,
        fxAudUsd: r.fxAudUsd,
        postMoneyUsd: r.postMoneyValuationUsd,
        totalRaiseUsd: r.totalRaiseUsd,
      })),
    [investment.rounds],
  );

  const pm = Number(postMoney);
  const rs = Number(raise);
  const ai = Number(audInvested);
  const sfx = Number(scenarioFx);
  const ffx = Number(futureFx);

  const inputsValid =
    isFinite(pm) && pm > 0 &&
    isFinite(rs) && rs >= 0 && rs <= pm &&
    isFinite(ai) && ai >= 0 &&
    isFinite(sfx) && sfx > 0 &&
    isFinite(ffx) && ffx > 0;

  const result = useMemo(() => {
    if (!inputsValid) return null;
    return simulateScenario(existingRounds, investment.currentFxAudUsd, {
      hypoPostMoneyUsd: pm,
      hypoRaiseUsd: rs,
      hypoAudInvested: ai,
      hypoFxAudUsd: sfx,
      futureFxAudUsd: ffx,
    });
  }, [inputsValid, existingRounds, investment.currentFxAudUsd, pm, rs, ai, sfx, ffx]);

  const profitTone = result && result.grossProfitAud > 0 ? "positive" : result && result.grossProfitAud < 0 ? "negative" : "neutral";

  return (
    <Card className="p-4 sm:p-5 space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium mb-1">
          Scenario
        </div>
        <h3 className="text-base font-semibold">If {investment.name} raises another round…</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Model dilution and value at a hypothetical future round. Nothing is saved—tweak freely.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="wi-pm">Hypothetical post-money (USD)</Label>
          <NumberInput
            id="wi-pm"
            data-testid="input-whatif-postmoney"
            value={postMoney}
            onChange={(e) => setPostMoney(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wi-raise">Total raise (USD)</Label>
          <NumberInput
            id="wi-raise"
            data-testid="input-whatif-raise"
            value={raise}
            onChange={(e) => setRaise(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wi-aud">Your follow-on (AUD)</Label>
          <NumberInput
            id="wi-aud"
            data-testid="input-whatif-aud"
            value={audInvested}
            onChange={(e) => setAudInvested(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">Leave at 0 to model pure dilution.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wi-sfx">FX at round (AUD→USD)</Label>
          <Input
            id="wi-sfx"
            data-testid="input-whatif-fx"
            type="number"
            step="0.01"
            value={scenarioFx}
            onChange={(e) => setScenarioFx(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="wi-ffx">FX when valuing position (AUD→USD)</Label>
          <Input
            id="wi-ffx"
            data-testid="input-whatif-future-fx"
            type="number"
            step="0.01"
            value={futureFx}
            onChange={(e) => setFutureFx(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">Defaults to current FX. Adjust for an FX view.</p>
        </div>
      </div>

      {!result ? (
        <div className="text-sm text-muted-foreground">Enter valid numbers to see the scenario.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Kpi
              label="Ownership after"
              value={formatPct(result.ownershipAfter, 3)}
              hint={`From ${formatPct(result.ownershipBefore, 3)} → diluted to ${formatPct(result.ownershipFromExisting, 3)}${result.ownershipFromNew > 0 ? `, +${formatPct(result.ownershipFromNew, 3)} new` : ""}`}
            />
            <Kpi
              label="Position value"
              value={formatAud(result.positionValueAud, 0)}
              hint={`US$${formatNumberCompact(result.positionValueUsd)} at ${formatNumberCompact(pm)} post-money`}
            />
            <Kpi
              label="Total invested"
              value={formatAud(result.totalAudInvested, 0)}
              hint={result.additionalAudInvested > 0 ? `Incl. ${formatAud(result.additionalAudInvested, 0)} new check` : "No new check"}
            />
            <Kpi label="20% carry" value={formatAud(result.carryFeeAud, 0)} hint="On scenario profit" />
            <Kpi
              label="Net value"
              value={formatAud(result.netValueAud, 0)}
              hint={`${formatMoic(result.moicNet)} net MOIC`}
              tone={profitTone === "negative" ? "negative" : "neutral"}
            />
            <Kpi
              label="Net profit"
              value={formatAud(result.netProfitAud, 0)}
              hint={`Gross ${formatAud(result.grossProfitAud, 0)}`}
              tone={result.netProfitAud > 0 ? "positive" : result.netProfitAud < 0 ? "negative" : "neutral"}
            />
          </div>

          <div className="rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
            New investor takes {formatPct(result.newInvestorOwnershipPct, 2)} of the company
            (raise ÷ post-money). Existing holders, including you, are diluted by a factor of
            {" "}{(result.ownerDilutionFactor).toFixed(4)} ({formatPct(1 - result.ownerDilutionFactor, 2)} dilution).
          </div>
        </>
      )}
    </Card>
  );
}

// --------- Investment list card ---------
function InvestmentCard({
  investment,
  selected,
  onClick,
}: {
  investment: InvestmentWithRounds;
  selected: boolean;
  onClick: () => void;
}) {
  const inputs: RoundInput[] = investment.rounds.map((r) => ({
    roundOrder: r.roundOrder,
    audInvested: r.audInvested,
    fxAudUsd: r.fxAudUsd,
    postMoneyUsd: r.postMoneyValuationUsd,
    totalRaiseUsd: r.totalRaiseUsd,
  }));
  const s = summarize(inputs, investment.latestValuationUsd, investment.currentFxAudUsd);
  const tone = s.netProfitAud > 0 ? "text-positive" : s.netProfitAud < 0 ? "text-negative" : "text-muted-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`card-investment-${investment.id}`}
      className={`w-full text-left p-4 rounded-lg border bg-card hover-elevate transition-colors ${
        selected ? "border-primary ring-1 ring-primary/30" : "border-card-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-sm truncate">{investment.name}</div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div data-numeric className="font-mono text-base font-semibold">
          {formatAud(s.currentValueAud, 0)}
        </div>
        <div data-numeric className={`font-mono text-xs ${tone}`}>
          {s.netProfitAud >= 0 ? "+" : ""}
          {formatAud(s.netProfitAud, 0)}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {investment.rounds.length} round{investment.rounds.length === 1 ? "" : "s"}
        </span>
        <span data-numeric className="font-mono">
          {formatMoic(s.moicNet)} net
        </span>
      </div>
    </button>
  );
}

// --------- Portfolio summary ---------
function PortfolioSummary({ data }: { data: InvestmentWithRounds[] }) {
  const totals = useMemo(() => {
    let invested = 0;
    let gross = 0;
    let net = 0;
    for (const inv of data) {
      const inputs: RoundInput[] = inv.rounds.map((r) => ({
        roundOrder: r.roundOrder,
        audInvested: r.audInvested,
        fxAudUsd: r.fxAudUsd,
        postMoneyUsd: r.postMoneyValuationUsd,
        totalRaiseUsd: r.totalRaiseUsd,
      }));
      const s = summarize(inputs, inv.latestValuationUsd, inv.currentFxAudUsd);
      invested += s.totalAudInvested;
      gross += s.currentValueAud;
      net += s.netValueAud;
    }
    const carry = gross - net;
    const profit = net - invested;
    const moic = invested > 0 ? gross / invested : 0;
    return { invested, gross, net, carry, profit, moic };
  }, [data]);

  const tone = totals.profit > 0 ? "positive" : totals.profit < 0 ? "negative" : "neutral";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" data-testid="portfolio-summary">
      <Kpi label="Total invested" value={formatAud(totals.invested, 0)} hint={`${data.length} position${data.length === 1 ? "" : "s"}`} />
      <Kpi label="Gross value" value={formatAud(totals.gross, 0)} />
      <Kpi label="Net of 20% carry" value={formatAud(totals.net, 0)} hint={`Carry ${formatAud(totals.carry, 0)}`} />
      <Kpi label="Net profit" value={formatAud(totals.profit, 0)} tone={tone} />
      <Kpi label="Gross MOIC" value={formatMoic(totals.moic)} hint="On AUD basis" />
    </div>
  );
}

// --------- Empty state ---------
function EmptyState() {
  return (
    <Card className="p-8 text-center max-w-2xl mx-auto">
      <Logo size={36} />
      <h2 className="text-base font-semibold mt-4">Track your first investment</h2>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
        Enter an entry round and the dashboard will compute ownership, dilution, mark-to-market, and net-of-carry value as
        you add follow-on rounds.
      </p>
      <div className="mt-5 flex justify-center">
        <NewInvestmentDialog />
      </div>
      <div className="mt-8 text-left bg-muted/40 rounded-lg p-4 text-xs leading-relaxed">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium mb-2">
          How the math works
        </div>
        <p className="text-muted-foreground">
          Entry: ownership = USD invested ÷ post-money. Each follow-on round dilutes existing holders by
          <span className="font-mono"> 1 − (raise ÷ post-money)</span>, and any new participation adds
          <span className="font-mono"> USD invested ÷ post-money</span>. Carry (20%) applies only to gross profit.
        </p>
      </div>
    </Card>
  );
}

// --------- Header ---------
function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Logo size={28} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium leading-none">
              Goody Labs
            </div>
            <div className="text-[13px] sm:text-[15px] font-semibold leading-tight truncate mt-0.5">
              <span className="sm:hidden">Portfolio</span>
              <span className="hidden sm:inline">Private Investment Portfolio</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// --------- Page ---------
export default function Dashboard() {
  const { data, isLoading } = useInvestments();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (data && data.length > 0 && (selectedId === null || !data.find((d) => d.id === selectedId))) {
      setSelectedId(data[0].id);
    }
  }, [data, selectedId]);

  const selected = data?.find((d) => d.id === selectedId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 space-y-6 sm:space-y-7">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <PortfolioSummary data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,_35fr)_minmax(0,_65fr)] gap-5 sm:gap-6">
              <aside className="space-y-3 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
                    Positions
                  </h2>
                </div>
                <NewInvestmentDialog />
                <div className="space-y-2.5 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
                  {data.map((inv) => (
                    <InvestmentCard
                      key={inv.id}
                      investment={inv}
                      selected={inv.id === selectedId}
                      onClick={() => setSelectedId(inv.id)}
                    />
                  ))}
                </div>
              </aside>

              <section className="min-w-0">
                {selected ? <DetailPanel investment={selected} /> : null}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
