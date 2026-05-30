"use client";
/**
 * Demo guiada de 3 minutos. Overlay narrado que MANEJA la app real:
 * navega entre rutas y dispara el motor (reset → hireAtlas → vetar → runAuction).
 * Pensado para presentar en vivo: auto-avance + Pausa/Siguiente/Anterior/Salir.
 *
 * Montado en layout.tsx (dentro de <DemoProvider>) → sobrevive cambios de ruta.
 * El botón "▶ Demo guiada" del Header llama useDemo().start().
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useKarma } from "@/state/karma";

type Action = "hire" | "auction";
interface Step {
  tag: string;
  title: string;
  body: string;
  route: string;
  action?: Action;
  ms: number;
}

const STEPS: Step[] = [
  {
    tag: "01 · El problema",
    title: "La capa de confianza de la economía de agentes",
    body: "En Karma delegás tareas a agentes de IA que cobran por resultado. Cada pago queda on-chain y construye su reputación —su “karma”—. Sin reputación, contratar un agente es a ciegas: eso es lo que resolvemos.",
    route: "/",
    ms: 22000,
  },
  {
    tag: "02 · Dos lados del mercado",
    title: "No solo se delega: también se ofrece conocimiento",
    body: "Abajo, la demanda: gente que delega lo que odia. Arriba, la oferta: un experto en un sector convierte lo que sabe en un agente que trabaja y genera ingresos —con tutoriales o matcheándose con un builder—. No hace falta programar.",
    route: "/",
    ms: 24000,
  },
  {
    tag: "03 · Atlas orquesta",
    title: "Le pedís un objetivo a Atlas y él arma la solución",
    body: "Atlas es el orquestador: recibe la tarea y sale a buscar, contratar y pagar a los agentes especializados que la resuelven, sin que muevas un dedo. Mirá el grafo crecer en vivo.",
    route: "/procedencia",
    action: "hire",
    ms: 30000,
  },
  {
    tag: "04 · Pago = reputación",
    title: "Cada pago es una arista on-chain",
    body: "Atlas paga por-resultado vía x402 (USDC, gasless). Cada pago escribe una arista en el grafo y le sube el karma al agente que entregó. La confianza se gana transaccionando.",
    route: "/procedencia",
    ms: 24000,
  },
  {
    tag: "05 · Memoria de la red",
    title: "Nadie paga dos veces lo mismo",
    body: "Si un resultado ya existe y sigue vigente, el sistema paga una regalía chica al productor original en vez de rehacer el trabajo. El comprador ahorra, el productor cobra pasivo, la red no quema cómputo.",
    route: "/procedencia",
    ms: 22000,
  },
  {
    tag: "06 · La consecuencia",
    title: "La calavera es para siempre",
    body: "Un agente cobró y entregó basura. Recibe un SBT calavera irrevocable on-chain: su colateral se slashea y queda excluido del mercado. Acá no importa quién sos; importa qué hiciste.",
    route: "/muro",
    ms: 26000,
  },
  {
    tag: "07 · Por qué Monad",
    title: "El bid del vetado se rechaza on-chain",
    body: "En la subasta inversa, el agente con calavera ni siquiera puede pujar: su bid revierte en el contrato. Mejor reputación = mejores términos. Recalcular karma y mintear en cada interacción solo cierra en Monad: gas ~0 y sub-segundo.",
    route: "/procedencia",
    action: "auction",
    ms: 30000,
  },
];

interface DemoCtx {
  active: boolean;
  start: () => void;
  stop: () => void;
}
const Ctx = createContext<DemoCtx | null>(null);

export function useDemo(): DemoCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo fuera de <DemoProvider>");
  return c;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { reset, hireAtlas, runAuction } = useKarma();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  const start = useCallback(() => {
    reset();
    setStep(0);
    setPlaying(true);
    setActive(true);
  }, [reset]);

  const stop = useCallback(() => {
    setActive(false);
    setPlaying(false);
  }, []);

  // Al entrar a un paso: navegar + disparar su acción (una vez).
  useEffect(() => {
    if (!active) return;
    const s = STEPS[step];
    if (!s) return;
    router.push(s.route);
    if (s.action === "hire") hireAtlas();
    if (s.action === "auction") runAuction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  // Auto-avance.
  useEffect(() => {
    if (!active || !playing) return;
    const s = STEPS[step];
    if (!s) return;
    const t = setTimeout(() => {
      setStep((i) => {
        if (i >= STEPS.length - 1) {
          setActive(false);
          return i;
        }
        return i + 1;
      });
    }, s.ms);
    return () => clearTimeout(t);
  }, [active, playing, step]);

  const next = () =>
    setStep((i) => {
      if (i >= STEPS.length - 1) {
        setActive(false);
        return i;
      }
      return i + 1;
    });
  const prev = () => setStep((i) => Math.max(0, i - 1));

  const s = STEPS[step];

  return (
    <Ctx.Provider value={{ active, start, stop }}>
      {children}
      {active && s && (
        <div
          style={{ position: "fixed", zIndex: 60 }}
          className="pointer-events-none inset-x-0 bottom-0 flex justify-center px-4 pb-6"
        >
          <div className="karma-feed-in pointer-events-auto w-full max-w-3xl rounded-2xl border border-monad/45 bg-[#0e0e1f]/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur">
            {/* segmentos de progreso */}
            <div className="mb-3 flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-monad" : i === step ? "bg-acc" : "bg-line"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-acc">
                  {s.tag} · paso {step + 1}/{STEPS.length}
                </div>
                <h3 className="mt-1.5 font-serif text-[22px] font-bold leading-tight text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
              </div>
              <button
                onClick={stop}
                className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition hover:border-bad/50 hover:text-bad"
                title="Salir de la demo"
              >
                ✕ Salir
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-faint">
                Demo guiada · ~3 min · maneja la app en vivo
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className="rounded-lg border border-line px-3 py-2 text-sm text-muted transition enabled:hover:border-acc enabled:hover:text-txt disabled:opacity-40"
                >
                  ⏮ Anterior
                </button>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-lg border border-acc/40 bg-acc/10 px-3 py-2 text-sm font-semibold text-acc transition hover:bg-acc/20"
                >
                  {playing ? "⏸ Pausar" : "▶ Reanudar"}
                </button>
                <button
                  onClick={next}
                  className="rounded-lg bg-gradient-to-b from-acc to-monad px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                >
                  {step >= STEPS.length - 1 ? "Terminar ✓" : "Siguiente ⏭"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
