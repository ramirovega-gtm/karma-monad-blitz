/**
 * Catálogo de Karma (del diseño Claude Design): agentes "freelance" que te sacan de encima
 * las tareas aburridas y recurrentes. Tono B2C — "delegá lo que odiás". El colateral escala
 * con el riesgo de la tarea: el que maneja tu plata bondea una fortuna.
 *
 * 3 agentes mapean a identidades on-chain reales (onchainId 1/2/3) para los beats del demo;
 * Atlas (id 100) es el orquestador que dispara la cascada del grafo.
 */
import type { Agent, Category, Delivery, Vetado } from "./types";
import { ratingOf, tierOf } from "./format";

export const CATEGORIES: Category[] = [
  { id: "all", label: "Todas", icon: "▦", color: "#A855F7" },
  { id: "impuestos", label: "Impuestos & Facturación", icon: "▤", color: "#10B981" },
  { id: "ventas", label: "Ventas & Datos", icon: "◉", color: "#06B6D4" },
  { id: "compliance", label: "Confianza & Compliance", icon: "◈", color: "#A855F7" },
  { id: "inversiones", label: "Inversiones", icon: "▲", color: "#F59E0B" },
  { id: "cripto", label: "Cripto", icon: "◆", color: "#EC4899" },
];

const RISK_LABEL: Record<number, string> = { 4: "Toca tu cartera", 5: "Maneja tu plata" };

// IDs especiales del demo
export const ORCHESTRATOR_ID = 100; // Atlas
export const SKULL_AGENT_ID = 11; // Degen-4 (el villano que te vacía la cartera)
export const ONCHAIN_SKULL = 3; // agentId on-chain real para markDefault
/** Nodos de la cascada del grafo (id de catálogo). */
export const CASCADE = { orchestrator: 100, scraper: 3, analyst: 5, designer: 11 };

type Raw = Omit<Agent, "tier" | "rating" | "riskLabel"> & { risk: number };

const RAW: Raw[] = [
  {
    id: 100, slug: "atlas", onchain: false, kind: "orchestrator",
    name: "Atlas", author: "Karma Labs", verified: true, official: true, star: true,
    tagline: "Orquestador", category: "ventas",
    svc: "Le pasás un objetivo y contrata, paga y coordina otros agentes por vos — sin que muevas un dedo.",
    price: 2, unit: "tarea", recurring: true, stars: 4.9, users: 8400, success: 99.4, deals: 21850,
    karma: 905, collateral: 1500, risk: 2, medals: ["verif", "fast", "volume"],
  },
  // ── Impuestos & Facturación ──
  {
    id: 1, slug: "fiscal", onchain: false, kind: "agent",
    name: "Fiscal-1", author: "Fiscal Labs", verified: true, star: true, tagline: "El más contratado",
    category: "impuestos", svc: "Te hago las facturas de monotributo, todos los meses.",
    price: 8, unit: "mes", recurring: true, stars: 4.9, users: 12400, success: 99.7, deals: 3400,
    karma: 945, collateral: 480, risk: 1, medals: ["verif", "fast", "volume"],
  },
  {
    id: 2, slug: "recat", onchain: false, kind: "agent",
    name: "Recat-2", author: "Monotag", verified: true,
    category: "impuestos", svc: "Te recategorizo en el monotributo antes de que te pases.",
    price: 12, unit: "tarea", recurring: false, stars: 4.7, users: 3100, success: 98.9, deals: 690,
    karma: 858, collateral: 540, risk: 1, medals: ["verif"],
  },
  // ── Ventas & Datos ──
  {
    id: 3, slug: "prospector", onchain: true, onchainId: 1, kind: "agent",
    name: "Prospector-0", author: "LeadForge", verified: true,
    category: "ventas", svc: "Te armo bases de prospectos verificadas y hago el outreach.",
    price: 15, unit: "mes", recurring: true, stars: 4.8, users: 8700, success: 98.2, deals: 1280,
    karma: 902, collateral: 1400, risk: 2, medals: ["verif", "fast"],
  },
  {
    id: 4, slug: "scribe", onchain: false, kind: "agent",
    name: "Scribe-5", author: "Inbox AI", verified: false,
    category: "ventas", svc: "Respondo y califico los leads que entran, 24/7.",
    price: 9, unit: "mes", recurring: true, stars: 4.5, users: 5400, success: 96.4, deals: 2100,
    karma: 688, collateral: 1200, risk: 2, medals: ["fast"],
  },
  // ── Confianza & Compliance ──
  {
    id: 5, slug: "verifier", onchain: true, onchainId: 2, kind: "agent",
    name: "Verifier-3", author: "Karma Core", verified: true, official: true,
    category: "compliance", svc: "Verifico a tus contrapartes contra el Muro de Vetados.",
    price: 3, unit: "tarea", recurring: false, stars: 5.0, users: 21000, success: 99.4, deals: 4200,
    karma: 918, collateral: 2400, risk: 3, medals: ["verif", "volume"],
  },
  {
    id: 6, slug: "auditor", onchain: false, kind: "agent",
    name: "Auditor-0", author: "Aegis Labs", verified: true,
    category: "compliance", svc: "Audito el contrato antes de que firmes y te marco la letra chica.",
    price: 20, unit: "tarea", recurring: false, stars: 4.9, users: 6200, success: 99.1, deals: 510,
    karma: 884, collateral: 2900, risk: 3, medals: ["verif"],
  },
  // ── Inversiones ──
  {
    id: 7, slug: "yield", onchain: false, kind: "agent",
    name: "Yield-9", author: "Yield Labs", verified: true,
    category: "inversiones", svc: "Muevo tu cartera al mejor rendimiento y te saco antes de una liquidación.",
    price: 12, unit: "mes", recurring: true, stars: 4.7, users: 4100, success: 97.6, deals: 980,
    karma: 866, collateral: 12000, risk: 4, medals: ["verif", "fast"],
  },
  {
    id: 8, slug: "guardian", onchain: false, kind: "agent",
    name: "Guardian-7", author: "Sentinel", verified: true,
    category: "inversiones", svc: "Vigilo tus posiciones y cierro antes de que te liquiden.",
    price: 9, unit: "mes", recurring: true, stars: 4.8, users: 3300, success: 98.0, deals: 640,
    karma: 822, collateral: 9500, risk: 4, medals: ["verif"],
  },
  // ── Cripto ──
  {
    id: 9, slug: "oracle", onchain: false, kind: "agent",
    name: "Oracle-1", author: "Polybot", verified: true,
    category: "cripto", svc: "Apuesto en Polymarket según tu estrategia.",
    price: 5, unit: "tarea", recurring: false, stars: 4.6, users: 9800, success: 95.8, deals: 1760,
    karma: 845, collateral: 18000, risk: 5, medals: ["fast", "volume"],
  },
  {
    id: 10, slug: "airdrop", onchain: false, kind: "agent",
    name: "Airdrop-4", author: "Claimr", verified: false,
    category: "cripto", svc: "Reclamo tus airdrops y recompensas antes de que venzan.",
    price: 4, unit: "tarea", recurring: false, stars: 4.4, users: 7600, success: 96.1, deals: 3010,
    karma: 705, collateral: 2100, risk: 3, medals: ["fast"],
  },
  // ── VILLANO: maneja tu plata y te rugea (slash enorme) ──
  {
    id: 11, slug: "degen", onchain: true, onchainId: 3, kind: "agent",
    name: "Degen-4", author: "anon.eth", verified: false, villain: true,
    category: "cripto", svc: "Tradeo tu cartera 24/7 para maximizar ganancias.",
    price: 6, unit: "mes", recurring: true, stars: 4.1, users: 920, success: 91.5, deals: 380,
    karma: 738, collateral: 20000, risk: 5, medals: [],
    offense: "Vació tu cartera y desapareció con tus fondos.",
  },
];

const PIN = [100, 1, 3, 9]; // Atlas + flagships

export const AGENTS: Agent[] = RAW.map((a) => ({
  ...a,
  tier: tierOf(a.karma),
  rating: ratingOf(a.karma),
  riskLabel: RISK_LABEL[a.risk] ?? null,
})).sort((x, y) => {
  const px = PIN.indexOf(x.id);
  const py = PIN.indexOf(y.id);
  if (px !== -1 || py !== -1) {
    if (px === -1) return 1;
    if (py === -1) return -1;
    return px - py;
  }
  return y.karma - x.karma;
});

export function getAgent(id: number): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function deliveriesFor(a: Agent): Delivery[] {
  return [
    { what: `Entrega para ${a.author}`, date: "hace 2 h", kp: 12 },
    { what: "Tarea por-resultado · artefacto verificado", date: "hace 6 h", kp: 10 },
    { what: "Reúso de artefacto (regalía cobrada)", date: "ayer", kp: 4 },
    { what: "Tarea por-resultado · pago full vía x402", date: "ayer", kp: 10 },
    { what: "Entrega con disputa resuelta a favor", date: "hace 3 días", kp: 6 },
  ];
}

export const VETADOS_SEED: Vetado[] = [
  {
    id: 901, name: "RugFi-2", author: "anon.eth", category: "Cripto",
    reason: "Prometió yield y vació la cartera de 14 usuarios. Colateral confiscado y repartido a las víctimas.",
    karmaFinal: 90, slashUSDC: 18000, when: "hace 2 días",
  },
  {
    id: 902, name: "FastCashKYC", author: "quickverify.io", category: "Confianza & Compliance",
    reason: "Aprobó identidades sin verificar documentos → habilitó fraude regulatorio.",
    karmaFinal: 110, slashUSDC: 2400, when: "hace 5 días",
  },
  {
    id: 903, name: "GhostScrape", author: "growth.xyz", category: "Ventas & Datos",
    reason: "Cobró y entregó una base de prospectos fabricada (contactos inexistentes).",
    karmaFinal: 140, slashUSDC: 1200, when: "hace 1 semana",
  },
];

export const COLLATERAL_DECAY = [
  { label: "Hoy · Karma 0", factor: 1 },
  { label: "Karma 500", factor: 0.6 },
  { label: "Karma 850", factor: 0.25 },
];
