/**
 * Karma · Sesión FRONT — router HTTP de acción para el front.
 *
 * Envuelve flujos ya existentes (NO reescribe lógica): la cascada del orquestador (execStep) y la
 * subasta inversa (runAuction). El front dispara estos endpoints (fire-and-forget) para que ocurran
 * las escrituras on-chain reales mientras el grafo se anima en pantalla.
 *
 * El catálogo del marketplace, los vetados y el colateral son datos de producto que el front sirve
 * como seed (frontend/src/lib/catalog.ts) — no requieren endpoint. Acá viven solo las ACCIONES que
 * tocan la cadena + un read de verificación.
 */
import express, { type Request, type Response, type Router } from 'express';
import type { ReputationLayer } from './lib/reputation';
import { OnchainReputationLayer } from './lib/reputation.onchain';
import { execStep } from './orchestrator';
import { FAIL_SENTINEL, type AgentKind } from './agents';
import { runAuction } from './auction';

function serialize(step: {
  kind: string;
  agentId: bigint;
  reused: boolean;
  amount: bigint;
  uri: string;
  defaulted: boolean;
}) {
  return {
    kind: step.kind,
    agentId: step.agentId.toString(),
    reused: step.reused,
    amount: step.amount.toString(),
    uri: step.uri,
    defaulted: step.defaulted,
  };
}

export function apiRouter(reputation: ReputationLayer): Router {
  const r = express.Router();

  /**
   * POST /api/job — corre la cascada completa on-chain (scraper → analyst → reúso → designer-basura).
   * Mismo flujo que `npm run demo`, reutilizando execStep. Devuelve los steps (bigints serializados).
   */
  r.post('/job', async (req: Request, res: Response) => {
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const run = Date.now().toString(36);
    const job = `monad-defi-data#${run}`;
    try {
      const steps = [] as ReturnType<typeof serialize>[];
      steps.push(serialize(await execStep(serverUrl, reputation, 'scraper' as AgentKind, job)));
      steps.push(serialize(await execStep(serverUrl, reputation, 'analyst' as AgentKind, job)));
      steps.push(serialize(await execStep(serverUrl, reputation, 'scraper' as AgentKind, job))); // reúso → regalía
      steps.push(
        serialize(await execStep(serverUrl, reputation, 'designer' as AgentKind, `${job} ${FAIL_SENTINEL}`)),
      ); // entrega basura → calavera
      return res.json({ jobId: job, steps });
    } catch (e) {
      return res.status(500).json({ error: String(e).slice(0, 300) });
    }
  });

  /** POST /api/auction/run — corre la subasta inversa S1 (incluye el bid de calavera que revierte). */
  r.post('/auction/run', async (_req: Request, res: Response) => {
    try {
      const result = await runAuction();
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ error: String(e).slice(0, 300) });
    }
  });

  /** GET /api/onchain/:agentId — verificación: ¿el agente tiene calavera on-chain? */
  r.get('/onchain/:agentId', async (req: Request, res: Response) => {
    const agentId = BigInt(String(req.params.agentId));
    try {
      const onchain =
        reputation instanceof OnchainReputationLayer ? reputation : null;
      const hasSkull = onchain ? await onchain.hasSkull(agentId) : false;
      return res.json({ agentId: agentId.toString(), hasSkull });
    } catch (e) {
      return res.status(200).json({
        agentId: agentId.toString(),
        hasSkull: false,
        note: String(e).slice(0, 160),
      });
    }
  });

  return r;
}
