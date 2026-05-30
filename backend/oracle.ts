/**
 * oracle.ts — Sesión C. El oráculo firmante de reputación.
 *
 * Recalcula el score de un agente desde el grafo on-chain (eventos PaymentRecorded),
 * lo firma con ORACLE_PRIVATE_KEY y deja todo listo para postear `setScore`.
 *
 * ── Esquema de firma (ALINEADO con la spec de Sesión A — fuente de verdad: contracts/README.md) ──
 * A implementó `setScore` con DOMAIN SEPARATION: el digest incluye la address del
 * ScoreRegistry y el chainId (más seguro: la firma no sirve en otro contrato ni otra red).
 * El contrato verifica con OZ `ECDSA` + `MessageHashUtils`:
 *
 *   bytes32 digest = keccak256(abi.encodePacked(
 *     agentId, value, nonce, address(this), block.chainid));  // uint256,int256,uint256,address,uint256
 *   bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(digest);   // prefijo EIP-191
 *   require(ECDSA.recover(ethHash, sig) == signer);
 *
 * Acá firmamos con `account.signMessage({ message: { raw: digest } })`, que aplica
 * EXACTAMENTE el mismo prefijo EIP-191 personal_sign → recupera al signer.
 * `nonce` es un valor único y creciente (ms epoch) → compatible con `nonceUsed[nonce]` de A.
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
/** El RPC público de Monad limita `eth_getLogs` a 100 bloques por request. */
const MAX_LOG_RANGE = 100n;
/** Ventana hacia atrás por defecto cuando no se pasa `fromBlock` (cubre la corrida + algo de historia). */
const DEFAULT_LOOKBACK = 500n;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Lee jobs + volumen del agente desde los eventos PaymentRecorded.
 * `minJobs`: como el log de un `recordPayment` recién minado puede tardar en indexarse en el RPC
 * (la TX ya está minada pero `getLogs` aún no la devuelve), reintentamos hasta ver al menos
 * `minJobs` eventos. Sin esto, postScore a veces computa un score stale (0) → race intermitente.
 */
export async function readStats(
  registry: Hex,
  agentId: bigint,
  fromBlock: bigint | 'earliest' = 'earliest',
  minJobs = 0,
): Promise<AgentStats> {
  for (let attempt = 0; ; attempt++) {
    const latest = await publicClient.getBlockNumber();
    const start =
      fromBlock === 'earliest'
        ? latest > DEFAULT_LOOKBACK
          ? latest - DEFAULT_LOOKBACK
          : 0n
        : fromBlock;

    // Paginamos en ventanas de ≤100 bloques (límite del RPC público de Monad).
    let jobs = 0;
    let volRaw = 0n;
    for (let lo = start; lo <= latest; lo += MAX_LOG_RANGE) {
      const hi = lo + MAX_LOG_RANGE - 1n > latest ? latest : lo + MAX_LOG_RANGE - 1n;
      const chunk = await publicClient.getLogs({
        address: registry,
        event: PAYMENT_RECORDED,
        args: { agentId },
        fromBlock: lo,
        toBlock: hi,
      });
      jobs += chunk.length;
      for (const l of chunk) volRaw += l.args.amount ?? 0n;
    }
    if (jobs >= minJobs || attempt >= 8) {
      return { jobs, volRaw, volUSDC: volRaw / USDC_DECIMALS };
    }
    await sleep(600); // esperar a que el RPC indexe el log recién minado
  }
}

export interface ComputedScore extends AgentStats {
  value: bigint;
}

/** Combina readStats + la fórmula → el score que se va a firmar. */
export async function computeScore(
  registry: Hex,
  agentId: bigint,
  fromBlock: bigint | 'earliest' = 'earliest',
  minJobs = 0,
): Promise<ComputedScore> {
  const stats = await readStats(registry, agentId, fromBlock, minJobs);
  return { ...stats, value: scoreFromStats(stats.jobs, stats.volUSDC) };
}

/**
 * Digest que firma el oráculo, con domain separation (alineado con A):
 *   keccak256(abi.encodePacked(agentId, value, nonce, scoreRegistry, chainId)).
 * Orden y tipos EXACTOS: uint256, int256, uint256, address, uint256.
 */
export function scoreDigest(
  agentId: bigint,
  value: bigint,
  nonce: bigint,
  scoreRegistry: Hex,
  chainId: bigint,
): Hex {
  return keccak256(
    encodePacked(
      ['uint256', 'int256', 'uint256', 'address', 'uint256'],
      [agentId, value, nonce, scoreRegistry, chainId],
    ),
  );
}

/** Firma EIP-191 (personal_sign) del digest (con domain separation) con la clave del oráculo. */
export async function signScore(
  oracleKey: Hex,
  agentId: bigint,
  value: bigint,
  nonce: bigint,
  scoreRegistry: Hex,
  chainId: bigint,
): Promise<Hex> {
  const account = privateKeyToAccount(oracleKey);
  return (await account.signMessage({
    message: { raw: scoreDigest(agentId, value, nonce, scoreRegistry, chainId) },
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
