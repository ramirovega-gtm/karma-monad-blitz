/**
 * Registro de agentes proveedores de Karma (Sesión B).
 * El server y el orquestador resuelven proveedores por `kind` desde acá.
 */
import type { AgentKind, AgentProvider } from './types';
import { scraper } from './scraper';
import { analyst } from './analyst';
import { designer } from './designer';

export const AGENTS: Record<AgentKind, AgentProvider> = {
  scraper,
  analyst,
  designer,
};

export function getAgent(kind: AgentKind): AgentProvider {
  const a = AGENTS[kind];
  if (!a) throw new Error(`Agente desconocido: ${kind}`);
  return a;
}

export function listAgents(): AgentProvider[] {
  return Object.values(AGENTS);
}

export type { AgentProvider, AgentResult, AgentKind } from './types';
export { inputHashFor, payloadHash, FAIL_SENTINEL } from './hash';
