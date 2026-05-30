/**
 * Tipos compartidos de Karma. CONGELADO tras Sesión 0 — A/B/C no editan este archivo.
 */

export type Hex = `0x${string}`;

/** Tier del SBT de reputación (EIP-5192). Coincide con el enum del contrato. */
export const Tier = { GoodPayer: 0, Skull: 1 } as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

/** Artefacto cacheado en el grafo: (inputHash → quién lo produjo, dónde, hasta cuándo, regalía). */
export interface Artifact {
  producer: Hex;
  uri: string;
  validUntil: bigint; // unix ts; 0 = sin TTL definido
  royaltyBps: number; // 0..10000 (basis points)
}

/** Nodo del grafo de agentes (lo usa el front; acá como referencia de shape). */
export interface AgentNode {
  agentId: bigint;
  label: string;
  score: bigint;
  tier?: Tier;
}
