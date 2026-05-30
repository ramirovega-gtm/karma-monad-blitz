/**
 * Agente Scraper — recolecta datos crudos de una fuente.
 * Artefacto determinístico (sin red) para que el demo corra offline y reproducible.
 * Convención de demo: si el input contiene "__FAIL__", entrega basura (ok:false) → camino calavera.
 */
import type { AgentProvider, AgentResult } from './types';
import { payloadHash, FAIL_SENTINEL } from './hash';

export const scraper: AgentProvider = {
  kind: 'scraper',
  agentId: 1n,
  label: 'Scraper-01',
  priceBaseUnits: 50_000n, // 0.05 USDC
  royaltyBps: 500, // 5%
  async run(input: string): Promise<AgentResult> {
    if (input.includes(FAIL_SENTINEL)) {
      return { uri: '', payloadHash: payloadHash('garbage'), preview: '(entrega vacía)', ok: false };
    }
    const payload = `RAW[${input}] :: 42 filas extraídas, 3 fuentes, ts-determinístico`;
    return {
      uri: `mock://scraper/${encodeURIComponent(input)}`,
      payloadHash: payloadHash(payload),
      preview: payload.slice(0, 64),
      ok: true,
    };
  },
};
