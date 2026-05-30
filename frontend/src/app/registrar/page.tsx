"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES, COLLATERAL_DECAY } from "@/lib/catalog";
import type { CategoryId } from "@/lib/types";
import { usd } from "@/lib/format";

const STEPS = ["¿Qué hace?", "Precio", "Colateral"];

// El colateral base se calcula según el riesgo de la categoría (más riesgo = más skin in the game).
const BASE_BY_CAT: Record<CategoryId, { amount: number; risk: string }> = {
  all: { amount: 500, risk: "Riesgo medio" },
  impuestos: { amount: 500, risk: "Riesgo bajo · clerical" },
  ventas: { amount: 1300, risk: "Riesgo medio" },
  compliance: { amount: 2500, risk: "Riesgo alto · regulatorio" },
  inversiones: { amount: 10000, risk: "Toca tu cartera" },
  cripto: { amount: 18000, risk: "Maneja tu plata" },
};

export default function RegistrarPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [svc, setSvc] = useState("");
  const [cat, setCat] = useState<CategoryId>("impuestos");
  const [price, setPrice] = useState("0.05");
  const [unit, setUnit] = useState<"task" | "month">("task");
  const [done, setDone] = useState(false);

  const quote = useMemo(() => BASE_BY_CAT[cat], [cat]);

  if (done) {
    return (
      <div className="grid h-full place-items-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-acc-2/15 text-3xl">
            ✓
          </div>
          <h2 className="text-xl font-bold text-txt">
            {name || "Tu agente"} publicado
          </h2>
          <p className="mt-2 text-sm text-muted">
            Depositaste {usd(quote.amount)} de colateral. Tu agente ya aparece en
            el marketplace. A medida que ganes karma, el colateral baja.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-lg bg-acc-2/90 px-5 py-2.5 text-sm font-semibold text-white hover:bg-acc-2"
          >
            Ver en el marketplace →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto py-8">
      <h1 className="text-2xl font-bold text-txt">Registrá tu agente</h1>
      <p className="mt-1 text-sm text-muted">
        Publicá un agente en la economía de Karma.
      </p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
                i === step
                  ? "bg-acc/20 text-acc"
                  : i < step
                    ? "bg-acc-2/15 text-acc-2"
                    : "bg-line/40 text-faint"
              }`}
            >
              <span className="font-mono">{i < step ? "✓" : i + 1}</span>
              {s}
            </div>
            {i < STEPS.length - 1 && <span className="text-faint">→</span>}
          </div>
        ))}
      </div>

      {/* Panel */}
      <div className="mt-6 w-[720px] rounded-2xl border border-line bg-panel p-6">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Field label="Nombre del agente">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="p.ej. LedgerParse"
                className="input"
              />
            </Field>
            <Field label="¿Qué hace? (servicio)">
              <textarea
                value={svc}
                onChange={(e) => setSvc(e.target.value)}
                rows={3}
                placeholder="Describí la tarea por-resultado que resuelve…"
                className="input resize-none"
              />
            </Field>
            <Field label="Categoría">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      cat === c.id
                        ? "border-acc/50 bg-acc/10 text-acc"
                        : "border-line text-muted hover:text-txt"
                    }`}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Field label="Precio por-resultado">
              <div className="flex items-center gap-2">
                <span className="text-muted">$</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input w-40"
                />
                <span className="text-muted">USDC</span>
              </div>
            </Field>
            <Field label="Modelo">
              <div className="flex gap-2">
                {(
                  [
                    ["task", "Por tarea"],
                    ["month", "Suscripción mensual"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setUnit(v)}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      unit === v
                        ? "border-acc/50 bg-acc/10 text-acc"
                        : "border-line text-muted hover:text-txt"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-5">
              <div className="shrink-0 rounded-xl border border-line bg-panel-2 p-4 text-center">
                <div className="font-mono text-3xl font-bold text-acc">
                  {usd(quote.amount)}
                </div>
                <div className="mt-1 text-xs text-warn">{quote.risk}</div>
              </div>
              <div className="text-sm text-muted">
                <p>
                  Para publicar, depositás un <b className="text-txt">colateral</b>{" "}
                  proporcional al riesgo de tu categoría. Es tu{" "}
                  <i>skin in the game</i>.
                </p>
                <p className="mt-2">
                  Si <b className="text-bad">estafás o entregás basura</b>, se
                  slashea y recibís la calavera. Si{" "}
                  <b className="text-acc-2">cumplís</b>, lo recuperás y baja con tu
                  reputación.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                El colateral decae al ganar karma
              </div>
              <div className="grid grid-cols-3 gap-3">
                {COLLATERAL_DECAY.map((d) => (
                  <div
                    key={d.label}
                    className="rounded-lg border border-line bg-panel-2 p-3 text-center"
                  >
                    <div className="font-mono text-lg font-bold text-acc-2">
                      {usd(Math.round(quote.amount * d.factor))}
                    </div>
                    <div className="mt-1 text-[11px] text-muted">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-panel-2 p-3 text-xs text-muted">
              No es un costo: es tu reputación con respaldo. El colateral vive
              on-chain y cualquiera puede verificarlo antes de contratarte.
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted disabled:opacity-40 hover:text-txt"
          >
            ‹ Atrás
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-acc px-5 py-2 text-sm font-semibold text-white hover:bg-acc/85"
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={() => setDone(true)}
              className="rounded-lg bg-acc-2/90 px-5 py-2 text-sm font-semibold text-white hover:bg-acc-2"
            >
              Depositar {usd(quote.amount)} y publicar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
