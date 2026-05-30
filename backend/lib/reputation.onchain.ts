/**
 * reputation.onchain.ts — Sesión C. Implementación REAL de `ReputationLayer`.
 *
 * Orquesta bridge.ts (writes/reads viem) + oracle.ts (fórmula + firma ECDSA).
 * En MERGE reemplaza al `MockReputationLayer` que usa B → swap de 1 línea:
 *
 *   const rep = OnchainReputationLayer.fromEnv();   // antes: new MockReputationLayer()
 *
 * NO edita lib/reputation.ts (la interfaz/mock de S0): la implementa.
 */
import type { ReputationLayer, Artifact, Hex } from './reputation';
import { env, requireEnv } from './env';
import * as bridge from '../bridge';
import * as oracle from '../oracle';

export interface OnchainConfig {
  /** Address de ScoreRegistry (de abi/deployments.json, lo deploya A). */
  scoreRegistry: Hex;
  /** Address de ReputationSBT (para los reads de tier/calavera; opcional). */
  reputationSbt?: Hex;
  /** Clave del oráculo que firma `setScore` (= el `signer` configurado en el contrato). */
  oracleKey: Hex;
  /** Clave fondeada que envía las tx (default: DEPLOYER_PRIVATE_KEY, que además es owner). */
  senderKey?: Hex;
  /** Bloque desde el que el oráculo lee PaymentRecorded (default 'earliest'). */
  fromBlock?: bigint | 'earliest';
}

export class OnchainReputationLayer implements ReputationLayer {
  constructor(private cfg: OnchainConfig) {}

  /** Construye desde .env. C necesita SCORE_REGISTRY + ORACLE_PRIVATE_KEY. */
  static fromEnv(): OnchainReputationLayer {
    return new OnchainReputationLayer({
      scoreRegistry: requireEnv('SCORE_REGISTRY') as Hex,
      reputationSbt: (env.REPUTATION_SBT || undefined) as Hex | undefined,
      oracleKey: requireEnv('ORACLE_PRIVATE_KEY') as Hex,
      senderKey: (env.DEPLOYER_PRIVATE_KEY || undefined) as Hex | undefined,
    });
  }

  /** ¿reúso? lookup on-chain → Artifact o null (→ se paga full). */
  lookupArtifact(inputHash: Hex): Promise<Artifact | null> {
    return bridge.readLookup(this.cfg.scoreRegistry, inputHash);
  }

  /** Registra el pago = arista del grafo + cache. Devuelve el tx hash (espera receipt). */
  recordPayment(a: { agentId: bigint; amount: bigint; inputHash: Hex }): Promise<Hex> {
    return bridge.writeRecordPayment(this.cfg.scoreRegistry, a, this.cfg.senderKey);
  }

  /** El oráculo recalcula (desde el grafo on-chain), firma (con domain separation) y postea el score. */
  async postScore(agentId: bigint): Promise<Hex> {
    // minJobs=1: postScore corre justo después de recordPayment → esperamos que el RPC
    // indexe al menos ese pago antes de computar, para no firmar un score stale (0).
    const { value } = await oracle.computeScore(
      this.cfg.scoreRegistry,
      agentId,
      this.cfg.fromBlock,
      1,
    );
    const nonce = oracle.nextNonce();
    const chainId = BigInt(env.CHAIN_ID);
    const sig = await oracle.signScore(
      this.cfg.oracleKey,
      agentId,
      value,
      nonce,
      this.cfg.scoreRegistry,
      chainId,
    );
    return bridge.writeSetScore(this.cfg.scoreRegistry, agentId, value, nonce, sig, this.cfg.senderKey);
  }

  /** Marca default → mint SBT calavera (irrevocable). onlyOwner. */
  markDefault(agentId: bigint): Promise<Hex> {
    return bridge.writeMarkDefault(this.cfg.scoreRegistry, agentId, this.cfg.senderKey);
  }

  // ── helpers de lectura (los usa el front / los tests; fuera de la interfaz) ──

  /** ¿el agente fue excluido (calavera)? Requiere reputationSbt en la config. */
  hasSkull(agentId: bigint): Promise<boolean> {
    if (!this.cfg.reputationSbt) throw new Error('reputationSbt no configurado');
    return bridge.readHasSkull(this.cfg.reputationSbt, agentId);
  }
}
