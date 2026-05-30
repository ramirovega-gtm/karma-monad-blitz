"use client";
import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode } from "@/components/graph/AgentNode";
import { ORCHESTRATOR_ID } from "@/lib/catalog";
import { getAgent } from "@/lib/catalog";
import { usd } from "@/lib/format";
import { useKarma } from "@/state/karma";

const nodeTypes = { agent: AgentNode };

const POS: Record<number, { x: number; y: number }> = {
  100: { x: 360, y: 20 }, // Atlas
  3: { x: 40, y: 280 }, // Prospector-0
  5: { x: 360, y: 280 }, // Verifier-3
  11: { x: 680, y: 280 }, // Degen-4 (villano)
};
const NAME: Record<number, string> = {
  100: "Atlas",
  3: "Prospector-0",
  5: "Verifier-3",
  11: "Degen-4",
};

function Graph() {
  const { payments, scores, skulls, running } = useKarma();
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const seen = new Map<number, { role: string; paid: boolean }>();
    for (const p of payments) {
      if (!seen.has(p.to)) seen.set(p.to, { role: p.role, paid: false });
      if (!p.reused) seen.get(p.to)!.paid = true;
    }
    const ids = payments.length ? [ORCHESTRATOR_ID, ...seen.keys()] : [];

    const nodes: Node[] = ids.map((id) => {
      const orchestrator = id === ORCHESTRATOR_ID;
      const meta = seen.get(id);
      return {
        id: String(id),
        type: "agent",
        position: POS[id] ?? { x: 0, y: 0 },
        draggable: false,
        data: {
          name: NAME[id] ?? getAgent(id)?.name ?? `agente#${id}`,
          role: orchestrator ? "orquestador" : (meta?.role ?? ""),
          score: scores[id] ?? getAgent(id)?.karma ?? 600,
          vetado: skulls.includes(id),
          orchestrator,
          paid: meta?.paid ?? false,
        },
      };
    });

    const edges: Edge[] = payments.map((p) => ({
      id: p.id,
      source: String(p.from),
      target: String(p.to),
      animated: true,
      label: p.reused ? `regalía ${usd(p.amount)}` : usd(p.amount),
      labelStyle: { fill: p.reused ? "#f59e0b" : "#34d399", fontFamily: "var(--font-mono)", fontSize: 11 },
      labelBgStyle: { fill: "#161a22" },
      style: p.reused
        ? { stroke: "#f59e0b", strokeWidth: 1.5, strokeDasharray: "5 4" }
        : { stroke: "#34d399", strokeWidth: 2.5 },
    }));

    return { nodes, edges };
  }, [payments, scores, skulls]);

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 60);
    return () => clearTimeout(t);
  }, [nodes.length, fitView]);

  if (!payments.length) return <EmptyState />;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
      minZoom={0.4}
      maxZoom={1.5}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#2a313f" />
      {running && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-monad/40 bg-monad/15 px-3 py-1 font-mono text-xs text-monad">
          ● cascada en vivo…
        </div>
      )}
    </ReactFlow>
  );
}

function EmptyState() {
  const { hireAtlas } = useKarma();
  return (
    <div className="grid h-full place-items-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-monad/15 text-3xl">
          ☯
        </div>
        <h2 className="text-lg font-bold text-txt">
          Todavía no hay procedencia que mostrar
        </h2>
        <p className="mt-2 text-sm text-muted">
          Contratá al orquestador <b className="text-monad">Atlas</b>: va a
          contratar y pagar agentes en cascada, y vas a ver el grafo de la
          economía crecer en vivo — cada pago es una arista on-chain.
        </p>
        <button
          onClick={hireAtlas}
          className="mt-5 rounded-lg bg-monad px-5 py-2.5 text-sm font-semibold text-white hover:bg-monad/85"
        >
          Contratar Atlas → ver la cascada
        </button>
      </div>
    </div>
  );
}

export default function ProcedenciaPage() {
  const { payments, skulls, reset, runAuction, auction } = useKarma();
  const totalFull = payments
    .filter((p) => !p.reused)
    .reduce((s, p) => s + p.amount, 0);
  const totalRoyalty = payments
    .filter((p) => p.reused)
    .reduce((s, p) => s + p.amount, 0);
  // Ahorro por reúso: lo que se habría pagado full menos la regalía.
  const saved = payments
    .filter((p) => p.reused)
    .reduce((s, p) => s + (getAgent(p.to)?.price ?? 0) - p.amount, 0);

  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1">
        <div className="absolute left-5 top-4 z-10">
          <h1 className="text-lg font-bold text-txt">
            Procedencia · ¿cómo se armó esto?
          </h1>
          <p className="font-mono text-xs text-muted">
            cada pago = una arista del context graph on-chain
          </p>
        </div>
        <ReactFlowProvider>
          <Graph />
        </ReactFlowProvider>
      </div>

      {/* Panel lateral */}
      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-line bg-panel/40 p-5">
        <div>
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-faint">
            Resumen de la entrega
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Pagado (full)" value={usd(totalFull)} tone="acc-2" />
            <Stat label="Regalías" value={usd(totalRoyalty)} tone="warn" />
            <Stat label="Ahorro reúso" value={usd(saved)} tone="acc" />
            <Stat
              label="Defaults"
              value={String(skulls.length)}
              tone={skulls.length ? "bad" : "muted"}
            />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-3 text-xs leading-relaxed text-muted">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-0.5 w-5 bg-acc-2" /> pago full por-resultado
          </div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="h-0.5 w-5 bg-warn"
              style={{ borderTop: "1.5px dashed #f59e0b", background: "transparent" }}
            />{" "}
            regalía por reúso (nadie paga dos veces lo mismo)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-bad">💀</span> calavera irrevocable → excluido
          </div>
        </div>

        {/* Subasta */}
        <div>
          <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
            Subasta inversa (S1)
          </h3>
          {!auction ? (
            <button
              onClick={runAuction}
              className="w-full rounded-lg border border-acc/40 bg-acc/10 px-3 py-2.5 text-sm font-semibold text-acc hover:bg-acc/20"
            >
              Abrir subasta → ver bid rechazado
            </button>
          ) : (
            <AuctionView />
          )}
        </div>

        <MonadStats writes={payments.length * 2 + skulls.length} />

        <button
          onClick={reset}
          className="mt-auto rounded-lg border border-line px-3 py-2 text-xs text-muted hover:bg-line/30 hover:text-txt"
        >
          ↺ Reiniciar demo
        </button>
      </aside>
    </div>
  );
}

function AuctionView() {
  const { auction } = useKarma();
  if (!auction) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {auction.bids.map((b) => {
        const name = NAME[b.agentId] ?? `#${b.agentId}`;
        if (b.rejected) {
          return (
            <div
              key={b.agentId}
              className="flex items-center justify-between rounded-md border border-bad/40 bg-bad/10 px-3 py-2 text-xs"
            >
              <span className="font-medium text-bad">💀 {name}</span>
              <span className="font-mono text-bad">RECHAZADO on-chain</span>
            </div>
          );
        }
        const win = auction.winner === b.agentId;
        return (
          <div
            key={b.agentId}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
              win ? "border-acc-2/50 bg-acc-2/10" : "border-line bg-panel"
            }`}
          >
            <span className={win ? "font-medium text-acc-2" : "text-txt"}>
              {win ? "🏆 " : ""}
              {name}
            </span>
            <span className="font-mono text-muted">
              ef. {usd(b.effective)}
            </span>
          </div>
        );
      })}
      <p className="mt-1 font-mono text-[10px] text-faint">
        effective = price · (200 − score)/100 · la calavera revierte
      </p>
    </div>
  );
}

/** Por qué Monad: cada interacción escribe on-chain; sólo cierra a gas ~0. */
function MonadStats({ writes }: { writes: number }) {
  // Estimación ilustrativa de costo por escritura.
  const monadCost = writes * 0.0000021; // ~gas 0
  const ethCost = writes * 3.4; // ~USD por tx en L1
  return (
    <div className="rounded-lg border border-monad/30 bg-monad/[0.06] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-monad">
          Por qué Monad
        </span>
        <span className="font-mono text-xs text-txt">
          {writes} writes on-chain
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div>
          <div className="text-faint">Monad</div>
          <div className="font-mono font-bold text-acc-2">
            ${monadCost.toFixed(6)}
          </div>
        </div>
        <span className="text-faint">vs</span>
        <div className="text-right">
          <div className="text-faint">Ethereum L1</div>
          <div className="font-mono font-bold text-bad">
            ${ethCost.toFixed(2)}
          </div>
        </div>
      </div>
      <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">
        recalcular score + mintear SBT en cada interacción sólo cierra a gas ~0 +
        sub-segundo + ejecución paralela.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  const color =
    {
      "acc-2": "text-acc-2",
      acc: "text-acc",
      warn: "text-warn",
      bad: "text-bad",
      muted: "text-muted",
    }[tone] ?? "text-txt";
  return (
    <div className="rounded-lg border border-line bg-panel p-2.5">
      <div className="text-[10px] text-faint">{label}</div>
      <div className={`mt-0.5 font-mono text-base font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}
