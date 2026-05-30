"use client";
import Link from "next/link";
import { CONTEXT_GROUPS, completeness } from "@/lib/context";
import { getAgent } from "@/lib/catalog";
import { useKarma } from "@/state/karma";

export default function ContextoPage() {
  const { context, setContextField, agentMemory, saveAgentInput } = useKarma();
  const pct = completeness(context);
  const memEntries = Object.entries(agentMemory).filter(
    ([, m]) => Object.keys(m).length > 0,
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1100px] px-10 pb-28 pt-7">
        {/* Header */}
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Context graph · tu lado
        </div>
        <h1 className="mt-2 font-serif text-[40px] font-bold leading-none tracking-tight text-white">
          Tu Contexto
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-muted">
          Cargá una vez el contexto de tu persona o empresa. Los agentes lo leen
          para ejecutar <b className="text-txt">sin pedirte nada</b>. Cuando un
          agente necesita un dato muy específico, lo pide una sola vez y queda
          guardado en su memoria para la próxima.
        </p>

        {/* Completitud */}
        <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[12px] uppercase tracking-wider text-faint">
              Completitud del contexto
            </span>
            <span className="font-serif text-2xl font-bold text-acc-2">{pct}%</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-line bg-ink">
            <div
              className="h-full rounded-full bg-gradient-to-r from-acc-2 to-cyan transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2.5 font-mono text-[11px] text-muted">
            {pct >= 80
              ? "Excelente — los agentes operan en automático casi sin pedirte inputs."
              : "Cuanto más completo, menos te preguntan los agentes al contratarlos."}
          </p>
        </div>

        {/* Grupos de campos */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {CONTEXT_GROUPS.map((g) => (
            <div key={g.id} className="rounded-2xl border border-line bg-panel p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-monad/15 text-acc">
                  {g.icon}
                </span>
                <h2 className="font-serif text-lg font-bold text-white">{g.label}</h2>
              </div>
              <div className="flex flex-col gap-3.5">
                {g.fields.map((f) => (
                  <label key={f.key} className="flex flex-col gap-1.5">
                    <span className="text-[12.5px] text-muted">{f.label}</span>
                    <input
                      className="input"
                      placeholder={f.placeholder}
                      value={context[f.key] ?? ""}
                      onChange={(e) => setContextField(f.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Memoria por agente */}
        <div className="mt-9">
          <h2 className="font-serif text-2xl font-bold text-white">
            Memoria por agente
          </h2>
          <p className="mt-1.5 text-[14px] text-muted">
            Inputs específicos que cada agente necesitó y guardó. No te los vuelve
            a pedir.
          </p>

          {memEntries.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line bg-panel/40 p-6 text-center text-sm text-faint">
              Todavía no hay memoria guardada. Cuando contrates un agente que pida
              un dato específico, va a aparecer acá.
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {memEntries.map(([id, mem]) => {
                const agent = getAgent(Number(id));
                return (
                  <div
                    key={id}
                    className="rounded-xl border border-line bg-panel p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg border border-acc-2/30 bg-acc-2/10 font-serif text-sm font-bold text-acc-2">
                        {agent?.name.slice(0, 2) ?? "··"}
                      </span>
                      <Link
                        href={`/agents/${id}`}
                        className="font-sans text-base font-bold tracking-tight text-white hover:text-acc"
                      >
                        {agent?.name ?? `agente#${id}`}
                      </Link>
                      <span className="ml-auto rounded-md bg-acc-2/10 px-2 py-0.5 font-mono text-[10px] text-acc-2">
                        recordado
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {Object.entries(mem).map(([key, val]) => (
                        <label key={key} className="flex flex-col gap-1.5">
                          <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
                            {key}
                          </span>
                          <input
                            className="input"
                            value={val}
                            onChange={(e) =>
                              saveAgentInput(Number(id), key, e.target.value)
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
