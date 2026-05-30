import { compactUsers, ratingOf, tierOf, usd } from "@/lib/format";
import type { Agent } from "@/lib/types";

export function VerifiedMark({ agent }: { agent: Agent }) {
  if (agent.vetado || !agent.verified) return null;
  return (
    <span
      title={agent.official ? "Oficial" : "Verificado"}
      className="text-base text-cyan"
    >
      ✓
    </span>
  );
}

export function KarmaChip({ agent }: { agent: Agent }) {
  if (agent.vetado) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-bad/40 bg-bad/12 px-3 py-1.5 font-mono text-[13px] font-bold text-bad">
        <span className="h-2 w-2 rounded-full bg-bad" /> 118 · D
      </span>
    );
  }
  const k = Math.round(agent.karma);
  const green = tierOf(k) !== "mid";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[13px] ${
        green
          ? "border-acc-2/30 bg-acc-2/10 text-acc-2"
          : "border-acc/30 bg-acc/10 text-acc"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${green ? "bg-acc-2" : "bg-acc"}`} />
      <span className="font-bold">{k}</span>
      <span className="text-faint">{ratingOf(k)}</span>
    </span>
  );
}

export function CollateralChip({ agent }: { agent: Agent }) {
  if (agent.vetado) {
    return (
      <span className="font-mono text-xs text-bad">
        🔒 <span className="text-faint line-through">{usd(agent.collateral)}</span> confiscado
      </span>
    );
  }
  return (
    <span className={`font-mono text-xs ${agent.risk >= 4 ? "text-amber" : "text-acc-2"}`}>
      🔒 {usd(agent.collateral)} <span className="text-faint">en colateral</span>
    </span>
  );
}

export function RecurringChip({ agent }: { agent: Agent }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
        agent.recurring
          ? "border border-acc-2/30 bg-acc-2/10 text-acc-2"
          : "border border-line bg-white/[0.03] text-muted"
      }`}
    >
      {agent.recurring ? "↻ Se hace solo" : "◷ Por tarea"}
    </span>
  );
}

export function MetaRow({ agent }: { agent: Agent }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
      <span className="text-amber">★ {agent.stars.toFixed(2)}</span>
      <span className="text-line">·</span>
      <span>{compactUsers(agent.users)} usuarios</span>
      <span className="text-line">·</span>
      <span className="text-acc-2">{agent.success}% éxito</span>
    </div>
  );
}
