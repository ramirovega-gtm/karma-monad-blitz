/**
 * Karma · Sesión B — Orquestador de la economía de agentes.
 *
 * Contrata y paga proveedores en cascada vía x402, consultando reúso (regalía) antes de pagar
 * y registrando el pago tras el settle. Corre END-TO-END contra `MockReputationLayer` (sin
 * contratos, sin oráculo, sin front). En MERGE se cambia el mock por `OnchainReputationLayer`
 * de C en UNA línea — este archivo no se toca.
 *
 * Flujo por subtarea:
 *   inputHash = keccak256("kind:input")
 *     → lookupArtifact(inputHash)
 *         fresco  → paga REGALÍA chica (royaltyBps) al productor   [beat reúso]
 *         no      → contrata al proveedor y paga FULL vía x402 (server)  [el server hace recordPayment]
 *     → postScore(agentId)
 *   entrega basura → markDefault(agentId)   [beat calavera]
 *
 * Demo: `npx tsx backend/orchestrator.ts` arranca el server en proceso y corre el loop completo.
 */
import { pathToFileURL } from 'node:url';
import { keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { type ReputationLayer, type Hex, type Artifact } from './lib/reputation';
import { OnchainReputationLayer } from './lib/reputation.onchain';
import { env } from './lib/env';
import { startServer, type PaymentRequirements, type PaymentPayload } from './server';
import { getAgent, inputHashFor, FAIL_SENTINEL, type AgentKind } from './agents';

/** Wallet pagadora del orquestador (demo). En real saldría de ORCHESTRATOR_PRIVATE_KEY. */
const PAYER = '0x00000000000000000000000000000000000C0FFE' as Hex;

interface ContractResult {
  agentId: string;
  kind: string;
  uri: string;
  payloadHash: Hex;
  preview: string;
  ok: boolean;
  settleTx: Hex;
  recordTx: Hex;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cliente x402 (construye el X-PAYMENT y completa el handshake 402 → pago).
// ─────────────────────────────────────────────────────────────────────────────

/** Firma EIP-3009 real (camino en vivo, no ejercitado en Monad). DEMO_SAFE usa firma placeholder. */
async function buildPaymentHeader(req: PaymentRequirements): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const authorization = {
    from: PAYER,
    to: req.payTo,
    value: req.maxAmountRequired,
    validAfter: '0',
    validBefore: String(now + req.maxTimeoutSeconds),
    nonce: keccak256(toBytes(`${req.resource}:${req.maxAmountRequired}:${now}`)),
  };

  let signature = ('0x' + '00'.repeat(65)) as Hex; // placeholder (settle mockeado)
  if (!env.DEMO_SAFE) {
    const pk = process.env.ORCHESTRATOR_PRIVATE_KEY as Hex | undefined;
    if (!pk) throw new Error('DEMO_SAFE=false requiere ORCHESTRATOR_PRIVATE_KEY para firmar EIP-3009');
    const account = privateKeyToAccount(pk);
    signature = await account.signTypedData({
      domain: { name: 'USD Coin', version: '2', chainId: env.CHAIN_ID, verifyingContract: env.USDC as Hex },
      types: {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      primaryType: 'TransferWithAuthorization',
      message: {
        from: authorization.from,
        to: authorization.to as Hex,
        value: BigInt(authorization.value),
        validAfter: 0n,
        validBefore: BigInt(authorization.validBefore),
        nonce: authorization.nonce,
      },
    });
  }

  const payload: PaymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: req.network,
    payload: { signature, authorization },
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/** Contrata un agente pagando full vía x402 (402 → X-PAYMENT → settle → artefacto). */
async function contractFull(
  serverUrl: string,
  kind: AgentKind,
  input: string,
  inputHash: Hex,
): Promise<ContractResult> {
  const url = `${serverUrl}/x402/agents/${kind}`;
  const body = JSON.stringify({ input, inputHash });
  const headers = { 'content-type': 'application/json' };

  // 1) Disparamos el 402 para recibir los PaymentRequirements.
  const r1 = await fetch(url, { method: 'POST', headers, body });
  if (r1.status !== 402) throw new Error(`esperaba 402, recibí ${r1.status}`);
  const { accepts } = (await r1.json()) as { accepts: PaymentRequirements[] };
  const req = accepts[0];

  // 2) Construimos el pago y reintentamos con X-PAYMENT.
  const xPayment = await buildPaymentHeader(req);
  const r2 = await fetch(url, { method: 'POST', headers: { ...headers, 'X-PAYMENT': xPayment }, body });
  if (!r2.ok) throw new Error(`pago rechazado: ${r2.status} ${await r2.text()}`);
  return (await r2.json()) as ContractResult;
}

/** Dispara el beat calavera vía la ruta admin del server (acción del oráculo/owner). */
async function triggerDefault(serverUrl: string, agentId: bigint): Promise<Hex> {
  const r = await fetch(`${serverUrl}/admin/markDefault/${agentId}`, { method: 'POST' });
  const { skullTx } = (await r.json()) as { skullTx: Hex };
  return skullTx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lógica económica
// ─────────────────────────────────────────────────────────────────────────────
const usdc = (base: bigint) => `$${(Number(base) / 1e6).toFixed(4).replace(/\.?0+$/, '')}`;
const royaltyAmount = (price: bigint, bps: number) => (price * BigInt(bps)) / 10000n;

function isFresh(a: Artifact): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return a.validUntil === 0n || a.validUntil > now; // 0 = sin TTL ⇒ se considera fresco (mock)
}

interface StepResult {
  kind: AgentKind;
  agentId: bigint;
  reused: boolean;
  amount: bigint;
  uri: string;
  defaulted: boolean;
}

/**
 * Ejecuta una subtarea. Decide reúso (regalía) vs contratación full, registra y postea score.
 * Si el proveedor entrega basura → markDefault (calavera).
 */
async function execStep(
  serverUrl: string,
  reputation: ReputationLayer,
  kind: AgentKind,
  input: string,
): Promise<StepResult> {
  const agent = getAgent(kind);
  const inputHash = inputHashFor(kind, input);

  // ¿reúso? Consultamos el grafo antes de pagar.
  const existing = await reputation.lookupArtifact(inputHash);
  if (existing && isFresh(existing)) {
    const amount = royaltyAmount(agent.priceBaseUnits, existing.royaltyBps);
    console.log(`  ↺ REÚSO ${agent.label}: ${kind}("${input}") ya existe → regalía ${usdc(amount)} (${existing.royaltyBps}bps) a ${existing.uri}`);
    await reputation.recordPayment({ agentId: agent.agentId, amount, inputHash });
    await reputation.postScore(agent.agentId);
    return { kind, agentId: agent.agentId, reused: true, amount, uri: existing.uri, defaulted: false };
  }

  // No hay reúso → contratamos full vía x402. El server hace recordPayment tras el settle.
  console.log(`  → CONTRATA ${agent.label}: ${kind}("${input}") · full ${usdc(agent.priceBaseUnits)} vía x402`);
  const res = await contractFull(serverUrl, kind, input, inputHash);
  console.log(`    settleTx=${res.settleTx.slice(0, 12)}… recordTx=${res.recordTx.slice(0, 12)}… artefacto=${res.uri || '(vacío)'}`);

  if (!res.ok) {
    // Pagamos pero entregó basura → recurso de reputación: calavera irrevocable.
    console.log(`    ✗ ${agent.label} entregó basura → markDefault`);
    const skullTx = await triggerDefault(serverUrl, agent.agentId);
    console.log(`    💀 SKULL minted skullTx=${skullTx.slice(0, 12)}… → ${agent.label} excluido on-chain`);
    return { kind, agentId: agent.agentId, reused: false, amount: agent.priceBaseUnits, uri: res.uri, defaulted: true };
  }

  await reputation.postScore(agent.agentId);
  return { kind, agentId: agent.agentId, reused: false, amount: agent.priceBaseUnits, uri: res.uri, defaulted: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo: cascada completa contra el mock.
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const reputation: ReputationLayer = OnchainReputationLayer.fromEnv(); // MERGE: swap mock → on-chain real
  const { url, close } = await startServer(reputation);
  console.log(`\n🟣 Karma · economía de agentes  (DEMO_SAFE=${env.DEMO_SAFE}, ${url})\n`);

  const results: StepResult[] = [];
  try {
    // ── 1) Cascada: el orquestador arma una campaña contratando proveedores en serie.
    // Salt por corrida: el cache de artefactos es permanente on-chain → así cada demo arranca
    // limpio (1er pedido = miss/full, 2do = hit/regalía) sin redeploy.
    const run = Date.now().toString(36);
    const job = `monad-defi-data#${run}`;

    console.log('① Cascada — orquestador contrata proveedores por-resultado:');
    results.push(await execStep(url, reputation, 'scraper', job));
    results.push(await execStep(url, reputation, 'analyst', job));

    // ── 2) Beat reúso: otra subtarea pide EXACTAMENTE lo mismo → paga regalía, no full.
    console.log('\n② Reúso — segunda demanda del mismo artefacto del scraper:');
    results.push(await execStep(url, reputation, 'scraper', job));

    // ── 3) Beat calavera (SHOWSTOPPER): el diseñador toma el job y entrega basura.
    console.log('\n③ Calavera — proveedor cobra pero entrega basura → exclusión irrevocable:');
    results.push(await execStep(url, reputation, 'designer', `campaña-monad#${run} ${FAIL_SENTINEL}`));

    // ── Resumen del grafo.
    console.log('\n── Grafo resultante ───────────────────────────────');
    const totalFull = results.filter((r) => !r.reused && !r.defaulted).reduce((s, r) => s + r.amount, 0n);
    const totalRoyalty = results.filter((r) => r.reused).reduce((s, r) => s + r.amount, 0n);
    for (const r of results) {
      const tag = r.defaulted ? '💀 SKULL' : r.reused ? '↺ regalía' : '✓ GoodPayer';
      console.log(`  agente#${r.agentId} ${r.kind.padEnd(8)} ${tag.padEnd(12)} ${usdc(r.amount)}`);
    }
    console.log(`  Σ full=${usdc(totalFull)}  regalías=${usdc(totalRoyalty)}  defaults=${results.filter((r) => r.defaulted).length}`);
    console.log('───────────────────────────────────────────────────\n');
    console.log('✅ Loop core de economía OK (lookup → pagar/regalía → recordPayment → postScore → markDefault).');
  } finally {
    await close();
  }
}

export { execStep, contractFull, triggerDefault, buildPaymentHeader, main as runDemo };

// Ejecuta el demo solo si se corre directo (no al importar desde MERGE/tests).
const isMain = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error('💥 orchestrator falló:', e);
    process.exit(1);
  });
}
