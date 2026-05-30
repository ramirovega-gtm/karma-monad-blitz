"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useKarma } from "@/state/karma";
import { deliveriesFor } from "@/lib/catalog";
import { MEDAL_LABEL, initials, ratingOf, usd } from "@/lib/format";
import { explorerAddr } from "@/onchain/chain";
import { KarmaChip, MetaRow, VerifiedMark } from "@/components/chips";
import { CONTEXT_FIELD_LABEL, agentContext } from "@/lib/context";

export default function DetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { agents, hireAtlas } = useKarma();
  const agent = agents.find((a) => a.id === Number(params.id));

  const [recurring, setRecurring] = useState(true);
  const [freq, setFreq] = useState<"month" | "quarter">("month");
  const [hired, setHired] = useState(false);

  if (!agent) {
    return (
      <div className="grid h-full place-items-center text-muted">
        Agente no encontrado ·{" "}
        <Link href="/" className="ml-1 text-acc">
          volver al marketplace
        </Link>
      </div>
    );
  }

  const isOrchestrator = agent.kind === "orchestrator";
  const deliveries = deliveriesFor(agent);

  const onActivate = () => {
    if (isOrchestrator) {
      hireAtlas();
      router.push("/procedencia");
    } else {
      setHired(true);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Col main */}
      <div className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
        <Link
          href="/"
          className="text-sm text-muted transition-colors hover:text-txt"
        >
          ‹ Volver al marketplace
        </Link>

        <div className="mt-4 flex items-start gap-5">
          <div
            className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-2xl font-bold ${
              agent.vetado
                ? "bg-bad/15 text-bad"
                : isOrchestrator
                  ? "bg-monad/20 text-monad"
                  : "bg-acc/15 text-acc"
            }`}
          >
            {agent.vetado ? "💀" : initials(agent.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h1
                className={`font-sans text-2xl font-bold tracking-tight ${agent.vetado ? "text-muted line-through" : "text-txt"}`}
              >
                {agent.name}
              </h1>
              <VerifiedMark agent={agent} />
              {agent.vetado && (
                <span className="rounded bg-bad/20 px-2 py-0.5 font-mono text-xs font-bold text-bad">
                  VETADO
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-muted">
              por {agent.author} · ★ {agent.stars.toFixed(2)} ·{" "}
              {agent.users.toLocaleString("es")} usuarios
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted">{agent.svc}</p>
            {agent.onchain && (
              <a
                href={explorerAddr("0x8004A169FB4a3325136EB29fA0ceB6D2e539a432")}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-mono text-xs text-acc hover:underline"
              >
                identidad on-chain (agentId {agent.id}) ↗
              </a>
            )}
          </div>

          {/* Karma score grande */}
          <div
            className={`shrink-0 rounded-2xl border px-6 py-4 text-center ${
              agent.vetado ? "border-bad/40 bg-bad/10" : "border-line bg-panel"
            }`}
          >
            <div
              className={`font-sans text-5xl font-bold tracking-tight ${agent.vetado ? "text-bad" : "text-acc-2"}`}
            >
              {agent.vetado ? 118 : Math.round(agent.karma)}
            </div>
            <div className="font-mono text-xs text-faint">/ 1000</div>
            <div
              className={`mt-1 font-mono text-xs font-bold ${agent.vetado ? "text-bad" : "text-acc-2"}`}
            >
              {agent.vetado ? "D · VETADO" : `${ratingOf(agent.karma)} · KARMA SCORE`}
            </div>
          </div>
        </div>

        {/* Medallas */}
        <div className="mt-6 flex flex-wrap gap-2">
          {agent.medals.map((m) => (
            <span
              key={m}
              className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs text-muted"
            >
              {MEDAL_LABEL[m]?.ic} {MEDAL_LABEL[m]?.label}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          <StatBig label="Tareas hechas" value={agent.deals.toLocaleString("es")} />
          <StatBig label="% éxito" value={`${agent.success}%`} />
          <StatBig
            label="Colateral"
            value={
              agent.vetado
                ? `−${usd(agent.collateralSlashed ?? agent.collateral)}`
                : usd(agent.collateral)
            }
            tone={agent.vetado ? "bad" : undefined}
          />
        </div>

        {/* Track record */}
        <h3 className="mb-2 mt-7 font-mono text-[11px] uppercase tracking-wider text-faint">
          Track record
        </h3>
        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
          {(agent.vetado
            ? [
                {
                  what: "Entregó artefacto basura tras cobrar → default",
                  date: "ahora",
                  kp: -522,
                },
                ...deliveries,
              ]
            : deliveries
          ).map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-panel px-4 py-3 text-sm"
            >
              <span className="text-txt">{d.what}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-faint">{d.date}</span>
                <span
                  className={`w-14 text-right font-mono text-xs ${d.kp < 0 ? "text-bad" : "text-acc-2"}`}
                >
                  {d.kp > 0 ? "+" : ""}
                  {d.kp} KP
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Contexto que usa el agente */}
        <AgentContextBlock agentId={agent.id} />
      </div>

      {/* Col side: recurrencia */}
      <aside className="flex w-[420px] shrink-0 flex-col border-l border-line bg-panel/40 p-6">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-lg font-bold text-txt">
            {isOrchestrator ? "Lanzá la campaña" : "Programá la recurrencia"}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {isOrchestrator
              ? "Atlas contrata y paga a los agentes especializados por vos."
              : "Contratá una vez o dejalo corriendo en automático."}
          </p>

          {agent.vetado ? (
            <div className="mt-5 rounded-lg border border-bad/40 bg-bad/10 p-4 text-sm text-bad">
              Este agente está excluido on-chain. Su calavera es irrevocable: no
              se puede contratar.
            </div>
          ) : hired ? (
            <div className="mt-5 rounded-lg border border-acc-2/40 bg-acc-2/10 p-4 text-sm text-acc-2">
              ✓ Contratado. Mirá la{" "}
              <Link href="/procedencia" className="underline">
                procedencia
              </Link>{" "}
              para ver qué se ejecuta.
            </div>
          ) : (
            <>
              <label className="mt-5 flex items-center justify-between rounded-lg border border-line bg-panel-2 px-4 py-3">
                <span className="text-sm text-txt">Ejecución automática</span>
                <button
                  onClick={() => setRecurring((v) => !v)}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors ${recurring ? "bg-acc-2" : "bg-line"}`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white transition-transform ${recurring ? "translate-x-5" : ""}`}
                  />
                </button>
              </label>

              {recurring && (
                <div className="mt-3 flex gap-2">
                  {(
                    [
                      ["month", "Todos los meses"],
                      ["quarter", "Cada 3 meses"],
                    ] as const
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setFreq(v)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs ${
                        freq === v
                          ? "border-acc/50 bg-acc/10 text-acc"
                          : "border-line text-muted hover:text-txt"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-lg bg-panel-2 p-3 text-xs text-muted">
                {recurring
                  ? `Karma va a contratar a ${agent.name} ${freq === "month" ? "cada mes" : "cada 3 meses"} y pagar por-resultado vía x402. Cada pago construye su reputación.`
                  : `Vas a contratar a ${agent.name} una vez. Pago por-resultado vía x402.`}
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm text-muted">Precio</span>
                <span className="font-mono text-lg font-bold text-acc-2">
                  {usd(agent.price)}
                  <span className="text-xs text-faint">/{agent.unit}</span>
                </span>
              </div>

              <button
                onClick={onActivate}
                className={`mt-4 w-full rounded-lg py-3 text-sm font-semibold text-white ${isOrchestrator ? "bg-monad hover:bg-monad/85" : "bg-acc-2/90 hover:bg-acc-2"}`}
              >
                {isOrchestrator ? "Contratar Atlas → ver cascada" : "Activar"}
              </button>
            </>
          )}
        </div>

        <div className="mt-4 px-1 font-mono text-[11px] text-faint">
          <MetaRow agent={agent} />
        </div>
        <div className="mt-3">
          <KarmaChip agent={agent} />
        </div>
      </aside>
    </div>
  );
}

function StatBig({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div
        className={`font-mono text-xl font-bold ${tone === "bad" ? "text-bad" : "text-txt"}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

function AgentContextBlock({ agentId }: { agentId: number }) {
  const { context, agentMemory, saveAgentInput } = useKarma();
  const spec = agentContext(agentId);
  const asked = spec.asks ? (agentMemory[agentId]?.[spec.asks.key] ?? "") : "";

  return (
    <div className="mt-7 rounded-2xl border border-line bg-panel p-5">
      <h3 className="mb-1 font-mono text-[11px] uppercase tracking-wider text-faint">
        Contexto que usa este agente
      </h3>
      <p className="mb-4 text-[13px] text-muted">
        Lee tu{" "}
        <Link href="/contexto" className="text-acc hover:underline">
          contexto
        </Link>{" "}
        para ejecutar sin pedirte nada. Lo que falte, lo pide una vez y lo
        recuerda.
      </p>

      <div className="flex flex-wrap gap-2">
        {spec.uses.map((k) => {
          const filled = (context[k] ?? "").trim().length > 0;
          return (
            <span
              key={k}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] ${
                filled
                  ? "border-acc-2/30 bg-acc-2/10 text-acc-2"
                  : "border-warn/30 bg-warn/10 text-warn"
              }`}
            >
              {filled ? "✓" : "○"} {CONTEXT_FIELD_LABEL[k] ?? k}
              {!filled && <span className="text-faint">· falta</span>}
            </span>
          );
        })}
      </div>

      {spec.asks && (
        <div className="mt-4 rounded-xl border border-line bg-panel-2 p-4">
          <div className="text-[13px] text-txt">
            Este agente necesita un dato específico:
          </div>
          <label className="mt-2.5 flex flex-col gap-1.5">
            <span className="text-[12.5px] text-muted">{spec.asks.label}</span>
            <input
              className="input"
              placeholder={spec.asks.placeholder}
              value={asked}
              onChange={(e) =>
                saveAgentInput(agentId, spec.asks!.key, e.target.value)
              }
            />
          </label>
          <div className="mt-2 font-mono text-[11px] text-acc-2">
            {asked
              ? "✓ guardado en la memoria del agente — no te lo vuelve a pedir"
              : "se guarda para futuros usos de este agente"}
          </div>
        </div>
      )}
    </div>
  );
}
