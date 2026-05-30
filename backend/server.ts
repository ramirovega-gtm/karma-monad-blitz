/**
 * Karma · Sesión B — Server x402 (recurso pago) + puente a la capa de reputación.
 *
 * Endpoint protegido: contratás un agente proveedor pagando por-resultado vía x402.
 *   - Sin pago  → HTTP 402 con `accepts` (PaymentRequirements, spec x402).
 *   - Con pago  → settle → corre el agente → **recordPayment** (arista del grafo) → devuelve el artefacto.
 *
 * GAP TÉCNICO (verificado contra x402 v1.2.0): el SDK oficial (x402-express / x402-fetch) NO
 * soporta Monad — su enum `network` es {base, avalanche, polygon, sei, solana, ...}, sin 10143.
 * Por eso implementamos el handshake x402 (402 + X-PAYMENT + X-PAYMENT-RESPONSE) con la MISMA
 * forma de la spec, parametrizado para `eip155:10143`. Cuando exista un facilitator/SDK Monad-aware
 * se reemplaza `settle()` por la llamada real — el resto del flujo no cambia.
 *
 * DEMO_SAFE=true (default): el settle se mockea, pero `recordPayment` se llama IGUAL → el grafo
 * nunca depende del facilitator en vivo (regla de oro del día).
 */
import { pathToFileURL } from 'node:url';
import express, { type Express, type Request, type Response } from 'express';
import { type ReputationLayer, type Hex } from './lib/reputation';
import { OnchainReputationLayer } from './lib/reputation.onchain';
import { env } from './lib/env';
import { getAgent, type AgentKind } from './agents';

// ─────────────────────────────────────────────────────────────────────────────
// Wire types x402 (forma de la spec; `network` ampliado para Monad).
// ─────────────────────────────────────────────────────────────────────────────
export const NETWORK = 'monad-testnet';
export const CAIP2 = `eip155:${env.CHAIN_ID}`;
/** Tesorería que recibe los pagos (demo). En real sería la wallet del proveedor. */
export const PAY_TO = (env.SCORE_REGISTRY || '0x000000000000000000000000000000000000dEaD') as Hex;

export interface PaymentRequirements {
  scheme: 'exact';
  network: string; // 'monad-testnet' (CAIP-2 eip155:10143)
  maxAmountRequired: string; // unidades base USDC
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string; // USDC address
  extra?: Record<string, unknown>;
}

export interface ExactEvmAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface PaymentPayload {
  x402Version: 1;
  scheme: 'exact';
  network: string;
  payload: { signature: Hex; authorization: ExactEvmAuthorization };
}

export interface SettleResponse {
  success: boolean;
  transaction: Hex; // tx hash del settle (Transfer USDC)
  network: string;
  payer: string;
}

const b64 = {
  encode: (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64'),
  decode: <T>(s: string): T => JSON.parse(Buffer.from(s, 'base64').toString('utf8')) as T,
};

function fakeTxHash(seed: string): Hex {
  // hash determinístico de 32 bytes a partir de un seed (mock del Transfer USDC).
  let h = '';
  for (let i = 0; i < 64; i++) h += seed.charCodeAt(i % seed.length).toString(16).slice(-1);
  return ('0x' + h) as Hex;
}

/** Requisitos de pago para contratar `kind` (precio = el del proveedor). */
function requirementsFor(kind: AgentKind, resource: string): PaymentRequirements {
  const agent = getAgent(kind);
  return {
    scheme: 'exact',
    network: NETWORK,
    maxAmountRequired: agent.priceBaseUnits.toString(),
    resource,
    description: `Contratar ${agent.label} (${kind}) por-resultado`,
    mimeType: 'application/json',
    payTo: PAY_TO,
    maxTimeoutSeconds: 120,
    asset: env.USDC,
    extra: { caip2: CAIP2, agentId: agent.agentId.toString() },
  };
}

/**
 * Settle del pago. DEMO_SAFE → mock (acepta payload bien formado). Real → facilitator x402.
 * Devuelve el SettleResponse (incl. tx hash del Transfer USDC) o lanza si falla.
 */
async function settle(payload: PaymentPayload, req: PaymentRequirements): Promise<SettleResponse> {
  if (env.DEMO_SAFE) {
    if (payload?.scheme !== 'exact' || !payload?.payload?.authorization?.from) {
      throw new Error('X-PAYMENT mal formado');
    }
    return {
      success: true,
      transaction: fakeTxHash(payload.payload.authorization.nonce || 'demo'),
      network: NETWORK,
      payer: payload.payload.authorization.from,
    };
  }
  // ── Camino en vivo (no ejercitado: x402 v1.2.0 no soporta Monad). Forma real del facilitator: ──
  const res = await fetch(`${env.X402_FACILITATOR}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements: req }),
  });
  if (!res.ok) throw new Error(`facilitator settle ${res.status}`);
  const data = (await res.json()) as { success: boolean; transaction: Hex; payer: string };
  if (!data.success) throw new Error('settle no exitoso');
  return { success: true, transaction: data.transaction, network: NETWORK, payer: data.payer };
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
export function createServer(reputation: ReputationLayer): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, network: NETWORK, caip2: CAIP2, demoSafe: env.DEMO_SAFE });
  });

  /**
   * Contratar un agente. Body: { input: string, inputHash: Hex }.
   * Gate x402 → settle → run(agent) → recordPayment → artefacto.
   */
  app.post('/x402/agents/:kind', async (req: Request, res: Response) => {
    const kind = req.params.kind as AgentKind;
    let agent;
    try {
      agent = getAgent(kind);
    } catch {
      return res.status(404).json({ error: `agente desconocido: ${kind}` });
    }

    const resource = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const requirements = requirementsFor(kind, resource);

    // 1) ¿viene pago? Si no, respondemos 402 con los requisitos (spec x402).
    const header = req.header('X-PAYMENT');
    if (!header) {
      return res.status(402).json({
        x402Version: 1,
        accepts: [requirements],
        error: 'X-PAYMENT requerido',
      });
    }

    // 2) Settle (mock si DEMO_SAFE, facilitator si no).
    let settled: SettleResponse;
    try {
      const payload = b64.decode<PaymentPayload>(header);
      settled = await settle(payload, requirements);
    } catch (e) {
      return res.status(402).json({
        x402Version: 1,
        accepts: [requirements],
        error: `settle falló: ${(e as Error).message}`,
      });
    }

    // 3) Corre el agente (produce el artefacto).
    const { input, inputHash } = req.body as { input: string; inputHash: Hex };
    const result = await agent.run(input ?? '');

    // 4) PUENTE → recordPayment (arista del grafo). Se llama SIEMPRE tras settle OK,
    //    incluso con settle mockeado: el grafo no depende del facilitator en vivo.
    const recordTx = await reputation.recordPayment({
      agentId: agent.agentId,
      amount: agent.priceBaseUnits,
      inputHash,
    });

    // 5) Devolvemos el artefacto + el comprobante de pago (X-PAYMENT-RESPONSE, spec x402).
    res.setHeader('X-PAYMENT-RESPONSE', b64.encode(settled));
    return res.json({
      agentId: agent.agentId.toString(),
      kind,
      uri: result.uri,
      payloadHash: result.payloadHash,
      preview: result.preview,
      ok: result.ok,
      settleTx: settled.transaction,
      recordTx,
    });
  });

  /**
   * Beat calavera: ruta admin (acción del oráculo/owner, sin pago) que marca default.
   * El orquestador la dispara cuando un agente entrega basura → mint SBT calavera irrevocable.
   */
  app.post('/admin/markDefault/:agentId', async (req: Request, res: Response) => {
    const agentId = BigInt(String(req.params.agentId));
    const tx = await reputation.markDefault(agentId);
    return res.json({ agentId: agentId.toString(), skullTx: tx });
  });

  return app;
}

/** Arranca el server y resuelve cuando está escuchando. Devuelve {url, close}. */
export function startServer(
  reputation: ReputationLayer,
  port = 0,
): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createServer(reputation);
  return new Promise((resolve) => {
    const srv = app.listen(port, () => {
      const addr = srv.address();
      const p = typeof addr === 'object' && addr ? addr.port : port;
      resolve({
        url: `http://127.0.0.1:${p}`,
        close: () => new Promise<void>((r) => srv.close(() => r())),
      });
    });
  });
}

// Standalone: `npm run server` levanta el endpoint x402 con el mock (para el front / pruebas manuales).
const isMain = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const port = Number(process.env.PORT ?? 4021);
  startServer(OnchainReputationLayer.fromEnv(), port).then(({ url }) => {
    console.log(`🟣 Karma x402 server en ${url}  (DEMO_SAFE=${env.DEMO_SAFE})`);
    console.log(`   POST ${url}/x402/agents/scraper  ·  POST ${url}/admin/markDefault/:agentId  ·  GET ${url}/health`);
  });
}
