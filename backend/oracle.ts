/**
 * oracle.ts — Sesión C. El oráculo firmante de reputación.
 *
 * Recalcula el score de un agente desde el grafo on-chain (eventos PaymentRecorded),
 * lo firma con ORACLE_PRIVATE_KEY y deja todo listo para postear `setScore`.
 *
 * ── Esquema de firma (COORDINAR con Sesión A) ──────────────────────────────
 * El contrato verifica con OZ `ECDSA` + `MessageHashUtils`:
 *
 *   bytes32 digest = keccak256(abi.encodePacked(agentId, value, nonce));   // uint256,int256,uint256
 *   bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(digest);     // prefijo EIP-191
 *   require(ECDSA.recover(ethHash, sig) == signer);
 *
 * Acá firmamos con `account.signMessage({ message: { raw: digest } })`, que aplica
 * EXACTAMENTE el mismo prefijo EIP-191 personal_sign → recupera al signer.
 * `nonce` es un valor único y creciente (ms epoch) → anti-replay: A debe exigir
 * nonce no usado / estrictamente mayor al último (NO una secuencia 0,1,2…).
 */
import { encodePacked, keccak256, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { publicClient } from './lib/chain';
import type { Hex } from './lib/types';

const PAYMENT_RECORDED = parseAbiItem(
  'event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer)',
);

/** Tope del score (la fórmula nunca supera esto). */
export const SCORE_CAP = 100n;

/** USDC testnet: 6 decimales. */
export const USDC_DECIMALS = 1_000_000n;

/**
 * Fórmula fija del demo (NO un risk-engine real — cortado por scope):
 *   score = min(100, jobs*10 + volUSDC/10)
 * `volUSDC` es el volumen en USDC enteros (raw ya dividido por 1e6).
 */
export function scoreFromStats(jobs: number | bigint, volUSDC: bigint): bigint {
  const raw = BigInt(jobs) * 10n + volUSDC / 10n;
  return raw > SCORE_CAP ? SCORE_CAP : raw;
}

/** Stats on-chain de un agente, derivadas de sus eventos PaymentRecorded. */
export interface AgentStats {
  jobs: number;
  volRaw: bigint; // suma de amounts (unidades raw de USDC, 6 dec)
  volUSDC: bigint; // volRaw / 1e6 (USDC enteros)
}

/**
 * Lee el grafo on-chain del agente: cuántos pagos recibió y volumen total.
 * `fromBlock` por defecto 'earliest' (ok en anvil/local). En testnet, MERGE puede
 * pasar el bloque de deploy para evitar límites de rango del RPC en getLogs.
 */
export async function readStats(
  registry: Hex,
  agentId: bigint,
  fromBlock: bigint | 'earliest' = 'earliest',
): Promise<AgentStats> {
  const logs = await publicClient.getLogs({
    address: registry,
    event: PAYMENT_RECORDED,
    args: { agentId },
    fromBlock,
    toBlock: 'latest',
  });
  const jobs = logs.length;
  const volRaw = logs.reduce((sum, l) => sum + (l.args.amount ?? 0n), 0n);
  return { jobs, volRaw, volUSDC: volRaw / USDC_DECIMALS };
}

export interface ComputedScore extends AgentStats {
  value: bigint;
}

/** Combina readStats + la fórmula → el score que se va a firmar. */
export async function computeScore(
  registry: Hex,
  agentId: bigint,
  fromBlock: bigint | 'earliest' = 'earliest',
): Promise<ComputedScore> {
  const stats = await readStats(registry, agentId, fromBlock);
  return { ...stats, value: scoreFromStats(stats.jobs, stats.volUSDC) };
}

/** Digest que firma el oráculo = keccak256(abi.encodePacked(agentId, value, nonce)). */
export function scoreDigest(agentId: bigint, value: bigint, nonce: bigint): Hex {
  return keccak256(encodePacked(['uint256', 'int256', 'uint256'], [agentId, value, nonce]));
}

/** Firma EIP-191 (personal_sign) del digest con la clave del oráculo. */
export async function signScore(
  oracleKey: Hex,
  agentId: bigint,
  value: bigint,
  nonce: bigint,
): Promise<Hex> {
  const account = privateKeyToAccount(oracleKey);
  return (await account.signMessage({
    message: { raw: scoreDigest(agentId, value, nonce) },
  })) as Hex;
}

/** Address del oráculo (el `signer` que A debe configurar en ScoreRegistry). */
export function oracleAddress(oracleKey: Hex): Hex {
  return privateKeyToAccount(oracleKey).address as Hex;
}

/** Nonce único y monótono (ms epoch). Anti-replay sin estado persistente. */
export function nextNonce(): bigint {
  return BigInt(Date.now());
}
