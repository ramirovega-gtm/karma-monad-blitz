/**
 * Contrato de un agente proveedor de Karma (Sesión B).
 * Cada proveedor expone `run(input) → {uri, payloadHash}` (artefacto) + su metadata económica.
 * NO confundir con backend/lib/types.ts (tipos compartidos congelados de S0).
 */
import type { Hex } from '../lib/types';

export type AgentKind = 'scraper' | 'analyst' | 'designer';

/** Lo que devuelve un agente al ejecutarse: un artefacto referenciable + su huella. */
export interface AgentResult {
  uri: string;        // dónde vive el artefacto (mock:// o ipfs:// en real)
  payloadHash: Hex;   // huella del contenido producido
  preview: string;    // primeras palabras, para el log del demo
  ok: boolean;        // false ⇒ entregó basura → dispara el camino de calavera
}

/** Proveedor contratable: identidad on-chain (agentId) + precio + ejecución. */
export interface AgentProvider {
  kind: AgentKind;
  agentId: bigint;      // identidad en el grafo (ScoreRegistry / ERC-8004)
  label: string;        // nombre humano para el front/demo
  priceBaseUnits: bigint; // precio full en unidades base de USDC (6 decimales)
  royaltyBps: number;     // regalía al reusar su artefacto (basis points, 0..10000)
  run(input: string): Promise<AgentResult>;
}
