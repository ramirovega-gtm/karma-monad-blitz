/**
 * Agente Diseñador — toma insights y produce un entregable final (deck/landing).
 * Determinístico (offline). Misma convención de fallo "__FAIL__".
 */
import type { AgentProvider, AgentResult } from './types';
import { payloadHash, FAIL_SENTINEL } from './hash';

export const designer: AgentProvider = {
  kind: 'designer',
  agentId: 3n,
  label: 'Designer-03',
  priceBaseUnits: 200_000n, // 0.20 USDC
  royaltyBps: 1000, // 10%
  async run(input: string): Promise<AgentResult> {
    if (input.includes(FAIL_SENTINEL)) {
      return { uri: '', payloadHash: payloadHash('garbage'), preview: '(diseño roto)', ok: false };
    }
    const payload = `DECK[${input}] :: 6 slides, paleta Karma, export PNG listo`;
    return {
      uri: `mock://designer/${encodeURIComponent(input)}`,
      payloadHash: payloadHash(payload),
      preview: payload.slice(0, 64),
      ok: true,
    };
  },
};
