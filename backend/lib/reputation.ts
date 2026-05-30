/**
 * Interfaz que DESACOPLA B (economía de agentes) de C (reputación on-chain).
 * CONGELADO tras Sesión 0.
 *
 * - B importa solo el TIPO `ReputationLayer` y recibe la instancia por inyección.
 * - S0 entrega `MockReputationLayer` → B corre solo, sin contratos ni C.
 * - C implementa `OnchainReputationLayer` en `reputation.onchain.ts`.
 * - MERGE intercambia mock → real (1 línea), sin tocar el código de B.
 */
import type { Hex, Artifact } from './types';
export type { Hex, Artifact };

export interface ReputationLayer {
  /** ¿el resultado ya existe, fresco y confiable? null si no hay reúso (→ se paga full). */
  lookupArtifact(inputHash: Hex): Promise<Artifact | null>;
  /** registra el pago = arista del grafo + cache. Devuelve el tx hash. */
  recordPayment(a: { agentId: bigint; amount: bigint; inputHash: Hex }): Promise<Hex>;
  /** el oráculo recalcula, firma y postea el score del agente. */
  postScore(agentId: bigint): Promise<Hex>;
  /** marca default → mint SBT calavera (irrevocable). */
  markDefault(agentId: bigint): Promise<Hex>;
}

const ZERO_ADDR = ('0x' + '0'.repeat(40)) as Hex;
const fakeTx = (seed: string): Hex => ('0x' + seed.repeat(32)).slice(0, 66) as Hex;

/** Implementación in-memory para que la Sesión B corra sin contratos ni oráculo. */
export class MockReputationLayer implements ReputationLayer {
  private cache = new Map<Hex, Artifact>();

  async lookupArtifact(inputHash: Hex): Promise<Artifact | null> {
    return this.cache.get(inputHash) ?? null;
  }

  async recordPayment(a: { agentId: bigint; amount: bigint; inputHash: Hex }): Promise<Hex> {
    if (!this.cache.has(a.inputHash)) {
      this.cache.set(a.inputHash, {
        producer: ZERO_ADDR,
        uri: `mock://${a.inputHash}`,
        validUntil: 0n,
        royaltyBps: 500,
      });
    }
    console.log('[mock] recordPayment', {
      agentId: a.agentId.toString(),
      amount: a.amount.toString(),
      inputHash: a.inputHash,
    });
    return fakeTx('ab');
  }

  async postScore(agentId: bigint): Promise<Hex> {
    console.log('[mock] postScore', agentId.toString());
    return fakeTx('cd');
  }

  async markDefault(agentId: bigint): Promise<Hex> {
    console.log('[mock] markDefault → SKULL', agentId.toString());
    return fakeTx('ef');
  }
}
