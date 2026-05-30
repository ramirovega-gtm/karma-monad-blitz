/**
 * bridge.ts — Sesión C. Puente viem de lectura/escritura a ScoreRegistry + ReputationSBT.
 *
 * - Lecturas vía `publicClient`; escrituras firmadas vía `walletClient(pk)` (de lib/chain).
 * - Spec: abi/ISCoreRegistry.json + abi/IReputationSBT.json (los dejó S0; A debe matchearlos).
 * - Monad cobra por GAS LIMIT (no por gas usado) → hardcodeamos un gas limit ajustado en cada write.
 * - Los writes esperan el receipt: garantiza orden (p.ej. que `recordPayment` esté minado antes
 *   de que el oráculo lea sus logs en `postScore`). Monad es sub-segundo → el costo es despreciable.
 */
import type { Abi, Hex as ViemHex } from 'viem';
import { publicClient, walletClient } from './lib/chain';
import { requireEnv } from './lib/env';
import type { Hex, Artifact } from './lib/types';
import scoreRegistryAbi from '../abi/ISCoreRegistry.json';
import reputationSbtAbi from '../abi/IReputationSBT.json';

const SCORE_ABI = scoreRegistryAbi as Abi;
const SBT_ABI = reputationSbtAbi as Abi;

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

/** Gas limit fijo para writes de alta frecuencia (Monad cobra por límite). Ajustá si algún tx revierte por gas. */
export const WRITE_GAS_LIMIT = 250_000n;

/** Resuelve la pk del sender de tx; default = DEPLOYER_PRIVATE_KEY (owner + cuenta fondeada). */
function senderKey(pk?: Hex): Hex {
  return (pk ?? (requireEnv('DEPLOYER_PRIVATE_KEY') as Hex)) as Hex;
}

// ─────────────────────────────── lecturas ───────────────────────────────

/** `lookup(inputHash)` → Artifact, o null si no hay artefacto cacheado (producer == address(0)). */
export async function readLookup(registry: Hex, inputHash: Hex): Promise<Artifact | null> {
  const res = (await publicClient.readContract({
    address: registry as ViemHex,
    abi: SCORE_ABI,
    functionName: 'lookup',
    args: [inputHash],
  })) as readonly [Hex, string, bigint, number];
  const [producer, uri, validUntil, royaltyBps] = res;
  if (producer.toLowerCase() === ZERO_ADDR) return null;
  return { producer, uri, validUntil: BigInt(validUntil), royaltyBps: Number(royaltyBps) };
}

/** SBT: ¿el agente tiene calavera? */
export async function readHasSkull(sbt: Hex, agentId: bigint): Promise<boolean> {
  return (await publicClient.readContract({
    address: sbt as ViemHex,
    abi: SBT_ABI,
    functionName: 'hasSkull',
    args: [agentId],
  })) as boolean;
}

/** SBT: tier actual del agente (0 = GoodPayer, 1 = Skull). */
export async function readTier(sbt: Hex, agentId: bigint): Promise<number> {
  return Number(
    await publicClient.readContract({
      address: sbt as ViemHex,
      abi: SBT_ABI,
      functionName: 'tierOf',
      args: [agentId],
    }),
  );
}

// ─────────────────────────────── escrituras ───────────────────────────────

/** `recordPayment(agentId, amount, inputHash)` → emite PaymentRecorded (+ cachea artefacto si vacío). */
export async function writeRecordPayment(
  registry: Hex,
  a: { agentId: bigint; amount: bigint; inputHash: Hex },
  pk?: Hex,
): Promise<Hex> {
  const wc = walletClient(senderKey(pk));
  const hash = await wc.writeContract({
    address: registry as ViemHex,
    abi: SCORE_ABI,
    functionName: 'recordPayment',
    args: [a.agentId, a.amount, a.inputHash],
    gas: WRITE_GAS_LIMIT,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash as Hex;
}

/** `setScore(agentId, value, nonce, sig)` → verifica ECDSA vs signer, emite ScoreUpdated, mintea GoodPayer si cruza el umbral. */
export async function writeSetScore(
  registry: Hex,
  agentId: bigint,
  value: bigint,
  nonce: bigint,
  sig: Hex,
  pk?: Hex,
): Promise<Hex> {
  const wc = walletClient(senderKey(pk));
  const hash = await wc.writeContract({
    address: registry as ViemHex,
    abi: SCORE_ABI,
    functionName: 'setScore',
    args: [agentId, value, nonce, sig],
    gas: WRITE_GAS_LIMIT,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash as Hex;
}

/** `markDefault(agentId)` (onlyOwner) → mintea SBT calavera (irrevocable). */
export async function writeMarkDefault(registry: Hex, agentId: bigint, pk?: Hex): Promise<Hex> {
  const wc = walletClient(senderKey(pk));
  const hash = await wc.writeContract({
    address: registry as ViemHex,
    abi: SCORE_ABI,
    functionName: 'markDefault',
    args: [agentId],
    gas: WRITE_GAS_LIMIT,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash as Hex;
}
