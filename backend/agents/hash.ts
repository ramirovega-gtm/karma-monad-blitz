/**
 * Hashing determinístico para el grafo de Karma (Sesión B).
 * - inputHash: clave de caché/reúso. keccak256("kind:input"). Igual input → igual hash → reúso (regalía).
 * - payloadHash: huella del artefacto producido (commit del resultado).
 */
import { keccak256, toBytes } from 'viem';
import type { Hex } from '../lib/types';

/** Clave del grafo para una subtarea. Misma (kind,input) ⇒ mismo hash ⇒ camino de regalía. */
export function inputHashFor(kind: string, input: string): Hex {
  return keccak256(toBytes(`${kind}:${input}`));
}

/** Huella del artefacto entregado por un agente. */
export function payloadHash(payload: string): Hex {
  return keccak256(toBytes(payload));
}

/** Convención de demo: input que contiene esto ⇒ el agente entrega basura → camino calavera. */
export const FAIL_SENTINEL = '__FAIL__';
