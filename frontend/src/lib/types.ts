/** Tipos de dominio del front de Karma (alineados con el diseño Claude Design). */

export type CategoryId =
  | "all"
  | "impuestos"
  | "ventas"
  | "compliance"
  | "inversiones"
  | "cripto";

export type Tier = "elite" | "good" | "mid" | "skull";
export type PriceUnit = "mes" | "tarea";
export type MedalCode = "verif" | "fast" | "volume";
export type AgentKind = "orchestrator" | "agent";

export interface Agent {
  id: number;
  slug: string;
  onchain: boolean; // tiene estado real en Monad
  onchainId?: number; // agentId on-chain para reads / markDefault (1/2/3)
  kind: AgentKind;
  name: string;
  author: string;
  verified: boolean;
  official?: boolean;
  star?: boolean; // ribbon "el más contratado"
  tagline?: string;
  category: CategoryId;
  svc: string;
  price: number;
  unit: PriceUnit;
  recurring: boolean;
  stars: number; // 0..5
  users: number;
  success: number; // %
  deals: number;
  karma: number; // 0..1000
  collateral: number; // USDC bloqueado
  risk: number; // 1..5
  riskLabel?: string | null;
  medals: MedalCode[];
  // estado vetado (villano / calavera)
  villain?: boolean;
  vetado?: boolean;
  offense?: string;
  collateralSlashed?: number;
  karmaFinal?: number;
  // derivados
  tier?: Tier;
  rating?: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
}

export interface Delivery {
  what: string;
  date: string;
  kp: number;
}

export interface Vetado {
  id: number;
  name: string;
  author: string;
  category: string;
  reason: string;
  karmaFinal: number;
  slashUSDC: number;
  when: string;
}
