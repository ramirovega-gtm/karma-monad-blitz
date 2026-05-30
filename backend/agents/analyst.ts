/**
 * Agente Analista — procesa datos crudos y devuelve insights.
 * Determinístico (offline). Misma convención de fallo "__FAIL__" que el resto.
 */
import type { AgentProvider, AgentResult } from './types';
import { payloadHash, FAIL_SENTINEL } from './hash';

export const analyst: AgentProvider = {
  kind: 'analyst',
  agentId: 2n,
  label: 'Analyst-07',
  priceBaseUnits: 120_000n, // 0.12 USDC
  royaltyBps: 800, // 8%
  async run(input: string): Promise<AgentResult> {
    if (input.includes(FAIL_SENTINEL)) {
      return { uri: '', payloadHash: payloadHash('garbage'), preview: '(análisis inválido)', ok: false };
    }
    const payload = `INSIGHT[${input}] :: tendencia ↑12%, 2 anomalías, confianza 0.91`;
    return {
      uri: `mock://analyst/${encodeURIComponent(input)}`,
      payloadHash: payloadHash(payload),
      preview: payload.slice(0, 64),
      ok: true,
    };
  },
};
