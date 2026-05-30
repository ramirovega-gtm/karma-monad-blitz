"use client";
/**
 * Estado global de Karma (cliente). Motor del demo: sostiene el grafo (los pagos = aristas),
 * los scores en vivo, las calaveras, el muro de vetados y la subasta.
 *
 * Fixtures-first: la cascada del orquestador se simula client-side con timing escénico → el demo
 * corre sin backend ni WS. Si hay backend (NEXT_PUBLIC_API), las acciones también lo disparan
 * (fire-and-forget) para que ocurran las escrituras on-chain reales.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AGENTS,
  CASCADE,
  ONCHAIN_SKULL,
  ORCHESTRATOR_ID,
  SKULL_AGENT_ID,
  VETADOS_SEED,
  getAgent,
} from "@/lib/catalog";
import { AGENT_MEMORY_SEED, CONTEXT_SEED } from "@/lib/context";
import { ratingOf, tierOf } from "@/lib/format";
import type { Agent, CategoryId, PriceUnit, Vetado } from "@/lib/types";

/** Lo que el lado de la oferta (página /crear) manda para publicar un agente nuevo. */
export interface PublishDraft {
  name: string;
  author: string;
  category: CategoryId;
  svc: string;
  price: number;
  unit: PriceUnit;
  risk: number; // 1..5
  builtBy?: string; // "tutoriales" | "matchmaking" | "atlas" | "código"
}

/** Colateral inicial según el riesgo de la tarea (el que maneja plata bondea más). */
const COLLATERAL_BY_RISK: Record<number, number> = {
  1: 480,
  2: 1400,
  3: 2400,
  4: 9500,
  5: 18000,
};

export interface PaymentEvt {
  id: string;
  from: number;
  to: number;
  amount: number;
  reused: boolean;
  role: string;
  ts: number;
}

export interface AuctionBid {
  agentId: number;
  price: number;
  effective: number;
  rejected: boolean;
}
export interface AuctionState {
  budget: number;
  bids: AuctionBid[];
  winner: number | null;
}

interface KarmaState {
  agents: Agent[];
  vetados: Vetado[];
  payments: PaymentEvt[];
  scores: Record<number, number>;
  skulls: number[];
  auction: AuctionState | null;
  running: boolean;
  lastJobId: string | null;
  wallet: { network: string; address: string; balanceUSDC: number };
  context: Record<string, string>;
  agentMemory: Record<number, Record<string, string>>;
  customAgents: Agent[];
  setContextField: (key: string, value: string) => void;
  saveAgentInput: (agentId: number, key: string, value: string) => void;
  publishAgent: (draft: PublishDraft) => Agent;
  hireAtlas: () => void;
  vetar: (agentId: number, offense?: string) => void;
  runAuction: () => void;
  reset: () => void;
}

const KarmaCtx = createContext<KarmaState | null>(null);

const API = process.env.NEXT_PUBLIC_API || "";
const { scraper: SCRAPER, analyst: ANALYST, designer: DESIGNER } = CASCADE;
const VETO_KARMA = 90;

function fireBackend(path: string, body?: unknown) {
  if (!API) return;
  fetch(`${API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => {});
}

const initialScores = (): Record<number, number> =>
  Object.fromEntries(AGENTS.map((a) => [a.id, a.karma]));

let seq = 0;
const eid = () => `evt-${++seq}`;

export function KarmaProvider({ children }: { children: React.ReactNode }) {
  const [payments, setPayments] = useState<PaymentEvt[]>([]);
  const [scores, setScores] = useState<Record<number, number>>(initialScores);
  const [skulls, setSkulls] = useState<number[]>([]);
  const [vetadosLive, setVetadosLive] = useState<Vetado[]>([]);
  const [auction, setAuction] = useState<AuctionState | null>(null);
  const [running, setRunning] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [context, setContext] = useState<Record<string, string>>(CONTEXT_SEED);
  const [agentMemory, setAgentMemory] =
    useState<Record<number, Record<string, string>>>(AGENT_MEMORY_SEED);
  const [customAgents, setCustomAgents] = useState<Agent[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Persistencia en localStorage (carga tras montar → sin mismatch de hidratación).
  useEffect(() => {
    try {
      const c = localStorage.getItem("karma.context");
      if (c) setContext((prev) => ({ ...prev, ...JSON.parse(c) }));
      const m = localStorage.getItem("karma.agentMemory");
      if (m) setAgentMemory((prev) => ({ ...prev, ...JSON.parse(m) }));
      const ca = localStorage.getItem("karma.customAgents");
      if (ca) setCustomAgents(JSON.parse(ca));
    } catch {}
  }, []);

  const setContextField = useCallback((key: string, value: string) => {
    setContext((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("karma.context", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const saveAgentInput = useCallback(
    (agentId: number, key: string, value: string) => {
      setAgentMemory((prev) => {
        const next = { ...prev, [agentId]: { ...(prev[agentId] ?? {}), [key]: value } };
        try {
          localStorage.setItem("karma.agentMemory", JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const publishAgent = useCallback((draft: PublishDraft): Agent => {
    const karma = 600; // agente nuevo: arranca en "A", sube transaccionando
    const agent: Agent = {
      id: 1000 + Math.floor(performance.now()),
      slug: draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agente",
      onchain: false,
      kind: "agent",
      name: draft.name.trim() || "Mi Agente",
      author: draft.author.trim() || "vos.eth",
      verified: false,
      star: true,
      tagline: "Tu agente",
      category: draft.category === "all" ? "ventas" : draft.category,
      svc: draft.svc.trim() || "Tarea recurrente automatizada.",
      price: draft.price > 0 ? draft.price : 5,
      unit: draft.unit,
      recurring: draft.unit === "mes",
      stars: 5.0,
      users: 0,
      success: 100,
      deals: 0,
      karma,
      collateral: COLLATERAL_BY_RISK[draft.risk] ?? 1400,
      risk: draft.risk,
      riskLabel: draft.risk >= 5 ? "Maneja tu plata" : draft.risk >= 4 ? "Toca tu cartera" : null,
      medals: [],
      tier: tierOf(karma),
      rating: ratingOf(karma),
    };
    setCustomAgents((prev) => {
      const next = [agent, ...prev];
      try {
        localStorage.setItem("karma.customAgents", JSON.stringify(next));
      } catch {}
      return next;
    });
    return agent;
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const at = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => () => clearTimers(), []);

  const pushPayment = useCallback((p: Omit<PaymentEvt, "id" | "ts">) => {
    setPayments((prev) => [...prev, { ...p, id: eid(), ts: Date.now() }]);
    setScores((s) => ({
      ...s,
      [p.to]: Math.min(1000, (s[p.to] ?? 600) + (p.reused ? 3 : 8)),
    }));
  }, []);

  const vetar = useCallback((agentId: number, offense?: string) => {
    const a = getAgent(agentId);
    setSkulls((prev) => (prev.includes(agentId) ? prev : [...prev, agentId]));
    setScores((s) => ({ ...s, [agentId]: VETO_KARMA }));
    setVetadosLive((prev) =>
      prev.some((v) => v.id === agentId)
        ? prev
        : [
            {
              id: agentId,
              name: a?.name ?? `agente#${agentId}`,
              author: a?.author ?? "—",
              category: "Cripto",
              reason:
                offense ??
                a?.offense ??
                "Cobró por la tarea y desapareció con los fondos → default irrevocable.",
              karmaFinal: VETO_KARMA,
              slashUSDC: a?.collateral ?? 200,
              when: "ahora",
            },
            ...prev,
          ],
    );
    // markDefault real on-chain (sobre el agentId on-chain mapeado, no el de catálogo).
    fireBackend(`/admin/markDefault/${ONCHAIN_SKULL}`);
  }, []);

  const hireAtlas = useCallback(() => {
    clearTimers();
    setRunning(true);
    const jobId = `monad-defi-data#${Date.now().toString(36)}`;
    setLastJobId(jobId);
    fireBackend("/api/job", { jobId });

    at(300, () =>
      pushPayment({ from: ORCHESTRATOR_ID, to: SCRAPER, amount: 0.05, reused: false, role: "prospección" }),
    );
    at(1500, () =>
      pushPayment({ from: ORCHESTRATOR_ID, to: ANALYST, amount: 0.7, reused: false, role: "verificación" }),
    );
    at(2900, () =>
      pushPayment({ from: ORCHESTRATOR_ID, to: SCRAPER, amount: 0.0025, reused: true, role: "reúso" }),
    );
    at(4300, () =>
      pushPayment({ from: ORCHESTRATOR_ID, to: DESIGNER, amount: 0.2, reused: false, role: "trading" }),
    );
    at(5700, () => {
      vetar(DESIGNER);
      setRunning(false);
    });
  }, [pushPayment, vetar]);

  const runAuction = useCallback(() => {
    fireBackend("/api/auction/run");
    const hasSkull = skulls.includes(DESIGNER);
    const bids: AuctionBid[] = [
      { agentId: SCRAPER, price: 100, effective: 190, rejected: false },
      { agentId: ANALYST, price: 100, effective: 120, rejected: false },
      { agentId: DESIGNER, price: 50, effective: 0, rejected: hasSkull },
    ];
    setAuction({ budget: 500, bids, winner: ANALYST });
  }, [skulls]);

  const reset = useCallback(() => {
    clearTimers();
    setPayments([]);
    setScores(initialScores());
    setSkulls([]);
    setVetadosLive([]);
    setAuction(null);
    setRunning(false);
    setLastJobId(null);
  }, []);

  const agents = useMemo<Agent[]>(() => {
    // Agentes publicados desde /crear van primero (impacto de demo: "tu agente ya está vivo").
    const custom = customAgents.map((a) => ({ ...a, karma: scores[a.id] ?? a.karma }));
    const base = AGENTS.map((a) => {
      if (skulls.includes(a.id)) {
        return {
          ...a,
          vetado: true,
          tier: "skull" as const,
          karmaFinal: VETO_KARMA,
          collateralSlashed: a.collateral,
          offense: a.offense ?? "Entregó basura tras cobrar → default irrevocable.",
        };
      }
      return { ...a, karma: scores[a.id] ?? a.karma };
    });
    return [...custom, ...base];
  }, [skulls, scores, customAgents]);

  const vetados = useMemo(() => [...vetadosLive, ...VETADOS_SEED], [vetadosLive]);

  const value: KarmaState = {
    agents,
    vetados,
    payments,
    scores,
    skulls,
    auction,
    running,
    lastJobId,
    wallet: { network: "Monad", address: "0x8a4F…51ee", balanceUSDC: 2400 },
    context,
    agentMemory,
    customAgents,
    setContextField,
    saveAgentInput,
    publishAgent,
    hireAtlas,
    vetar,
    runAuction,
    reset,
  };

  return <KarmaCtx.Provider value={value}>{children}</KarmaCtx.Provider>;
}

export function useKarma(): KarmaState {
  const ctx = useContext(KarmaCtx);
  if (!ctx) throw new Error("useKarma fuera de <KarmaProvider>");
  return ctx;
}

export { SKULL_AGENT_ID };
