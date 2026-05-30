"use client";
import { useRouter } from "next/navigation";
import { compactUsers, initials, ratingOf, tierOf, usd } from "@/lib/format";
import type { Agent } from "@/lib/types";
import { useKarma } from "@/state/karma";

export function AgentCard({ agent }: { agent: Agent }) {
  const router = useRouter();
  const { hireAtlas } = useKarma();
  const isOrchestrator = agent.kind === "orchestrator";
  const k = Math.round(agent.karma);
  const tier = agent.vetado ? "skull" : tierOf(k);
  const isGreen = tier === "elite" || tier === "good";
  const go = () => router.push(`/agents/${agent.id}`);

  const onHire = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (agent.vetado) return;
    if (isOrchestrator) {
      hireAtlas();
      router.push("/procedencia");
    } else {
      go();
    }
  };

  const avatarCls = agent.vetado
    ? "border border-bad/50 bg-bad/10 text-bad"
    : isGreen
      ? "border border-acc-2/40 bg-gradient-to-br from-acc-2/25 to-acc-2/5 text-acc-2"
      : "border border-acc/45 bg-gradient-to-br from-acc/30 to-acc/5 text-acc";
  const scoreCls = agent.vetado
    ? "border-bad/40 bg-bad/10 text-bad"
    : isGreen
      ? "border-acc-2/30 bg-acc-2/10 text-acc-2"
      : "border-acc/30 bg-acc/10 text-acc";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => e.key === "Enter" && go()}
      className={`group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border p-5 transition-all ${
        agent.vetado
          ? "border-bad/50 bg-gradient-to-b from-[#16111b] to-[#1b0f15] shadow-[inset_0_0_0_1px_rgba(239,68,68,0.18)]"
          : "border-line bg-gradient-to-b from-panel to-panel-2 hover:-translate-y-1 hover:border-acc/50 hover:shadow-[0_22px_54px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* star ribbon */}
      {agent.star && !agent.vetado && (
        <div className="absolute right-0 top-0 flex items-center gap-1.5 rounded-bl-xl bg-gradient-to-r from-amber to-warn px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[#1a1206]">
          ★ {agent.tagline ?? "Destacado"}
        </div>
      )}
      {/* skull watermark */}
      {agent.vetado && (
        <span className="pointer-events-none absolute -bottom-9 -right-5 rotate-[-8deg] text-[150px] leading-none text-bad opacity-[0.07]">
          ☠
        </span>
      )}

      {/* head: icon | title+author | score chip (Apify-style header) */}
      <div className={`flex items-start gap-3.5 ${agent.star && !agent.vetado ? "mt-2.5" : ""}`}>
        <div
          className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl text-lg font-bold ${avatarCls}`}
        >
          {agent.vetado ? "☠" : initials(agent.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`truncate text-[17px] font-bold tracking-tight ${agent.vetado ? "text-[#e7c3c9]" : "text-white"}`}
            >
              {agent.name}
            </span>
            {agent.verified && !agent.vetado && (
              <span className="text-sm text-cyan" title={agent.official ? "Oficial" : "Verificado"}>
                ✓
              </span>
            )}
            {agent.vetado && (
              <span className="rotate-[-3deg] rounded border-[1.5px] border-bad px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-bad line-through decoration-2">
                Vetado
              </span>
            )}
          </div>
          {/* author row con avatar (Apify) */}
          <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
            <span className="h-[18px] w-[18px] shrink-0 rounded-md bg-gradient-to-br from-monad to-cyan opacity-80" />
            <span className="truncate">
              {agent.author}
              {agent.official && <span className="text-acc"> · oficial</span>}
            </span>
          </div>
        </div>
        {/* Karma score chip (brand de Karma) */}
        <div
          className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-center font-mono ${scoreCls}`}
        >
          <div className="text-[17px] font-bold leading-none tracking-tight">
            {agent.vetado ? 118 : k}
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-wide opacity-80">
            {agent.vetado ? "D" : ratingOf(k)} · karma
          </div>
        </div>
      </div>

      {/* descripción */}
      <p
        className={`line-clamp-2 min-h-[40px] text-[13.5px] leading-snug ${agent.vetado ? "text-faint line-through opacity-60" : "text-muted"}`}
      >
        {agent.svc}
      </p>

      {/* stats row (Apify) */}
      {agent.vetado ? (
        <div className="flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-[12.5px] font-semibold text-[#fda4af]">
          ⚠ {agent.offense}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-muted">
          <span className="text-amber">★ {agent.stars.toFixed(1)}</span>
          <span className="text-line">·</span>
          <span>{compactUsers(agent.users)} usuarios</span>
          <span className="text-line">·</span>
          <span className="text-acc-2">{agent.success}% éxito</span>
        </div>
      )}

      {/* chips: recurrencia + colateral */}
      {!agent.vetado && (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
              agent.recurring
                ? "border border-acc-2/25 bg-acc-2/10 text-acc-2"
                : "border border-line bg-white/[0.03] text-muted"
            }`}
          >
            {agent.recurring ? "↻ Se hace solo" : "◷ Por tarea"}
          </span>
          <span className={`font-mono text-[12px] ${agent.risk >= 4 ? "text-amber" : "text-acc-2"}`}>
            🔒 {usd(agent.collateral)}
            {agent.riskLabel && <span className="text-faint"> · {agent.riskLabel}</span>}
          </span>
        </div>
      )}

      {/* footer: precio + contratar (Apify pricing + CTA) */}
      <div className="mt-auto flex items-center justify-between border-t border-line pt-3.5">
        {agent.vetado ? (
          <span className="font-mono text-[12px] text-bad">
            🔒 <span className="text-faint line-through">{usd(agent.collateral)}</span> confiscado
          </span>
        ) : (
          <div className="font-mono">
            <span className="text-[17px] font-bold text-white">{usd(agent.price)}</span>
            <span className="text-[11px] uppercase tracking-wide text-faint"> USDC/{agent.unit}</span>
          </div>
        )}
        <button
          onClick={onHire}
          disabled={agent.vetado}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-[14.5px] font-semibold transition ${
            agent.vetado
              ? "cursor-not-allowed border border-bad/45 bg-bad/12 text-bad"
              : "bg-gradient-to-b from-acc to-monad text-white hover:brightness-110 active:scale-95"
          }`}
        >
          {agent.vetado ? "Excluido" : "Contratar →"}
        </button>
      </div>
    </div>
  );
}
