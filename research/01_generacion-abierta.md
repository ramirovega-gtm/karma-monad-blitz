---
id: generacion-cycle-01
type: synthesis
date: 2026-05-30
tags: [lab, generacion, hackathon, monad]
related: [[evaluation_frame]], [[monad_tech]], [[anti_patterns]], [[_index]]
status: processed
---

# Cycle de generación #1 — ideas abiertas (Monad Blitz BA)

Motor: `capacidades de Monad × casos de uso × frame` ([[evaluation_frame]]). Restricción dominante: **build ~8h IRL + wow en 3 min**. Filtro de narrativa: lo que Monad premia hoy = **agentes AI que transaccionan on-chain a alta frecuencia** ([[monad_tech]]).

## Espacio explorado (cruces)

Capacidades load-bearing de Monad → **micro-tx masivas baratas (~$0.005)** + **400ms block** + **ejecución paralela** + **10k TPS**. El ángulo ganador en un Blitz: **una demo que VISIBLEMENTE estresa la chain y no se cae** (throughput como espectáculo) + un agente AI como protagonista.

## Scoring (0-3 por eje · max 18)

| Idea | Monad-lev | Build ~1d | Wow | Narrativa | Difer | Feasib | **Σ** | Veredicto |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| **001 Agentic on-chain canvas** (r/place comandado por agente AI) | 3 | 2 | 3 | 3 | 2 | 2 | **15** | **GO finalista (recomendada)** |
| **002 Agent-to-agent micropagos** (mercado x402 de APIs entre agentes) | 3 | 2 | 2 | 3 | 3 | 2 | **15** | **GO finalista** |
| **003 Wagering on-chain en vivo** (apuestas que liquidan cada bloque) | 3 | 2 | 3 | 2 | 2 | 1 | **13** | **GO finalista (3º)** |
| 004 Agent arena / coliseo de agentes traders | 3 | 1 | 3 | 3 | 2 | 1 | 13 | PARK (scope >1 día) |
| 005 Micropagos por segundo a streamers (money streaming) | 3 | 2 | 2 | 2 | 2 | 2 | 13 | PARK (wow medio) |
| 006 DCA/arb bot autónomo que firma muchas tx | 2 | 2 | 1 | 2 | 1 | 2 | 10 | KILL (wow invisible — AP#3) |
| 007 On-chain clicker/tap-battle puro | 2 | 3 | 2 | 1 | 1 | 3 | 12 | KILL (sin narrativa agente — AP#2/#8) |

## Recomendación

**IDEA-001 (Agentic on-chain canvas)** como apuesta principal: máximo wow-por-esfuerzo en 8h, estresa Monad a la vista del jurado, y mete al agente AI como protagonista (tu fortaleza Python+Claude downstream). **IDEA-002** si preferís narrativa de agent-economy más pura + más diferenciación (menos clonada). **IDEA-003** como tercer carril si querés "mercado vivo" pero asumí el riesgo del oracle.

Detalle de cada finalista en su carpeta. Próximo paso: elegir 1 → escribir `demo.md` (guion 3 min + plan hora-por-hora de las 8h + riesgo #1/plan B).

## Related

- [[evaluation_frame]]
- [[monad_tech]]
- [[anti_patterns]]
- [[_index]]

---

**Status:** processed
**Last Updated:** 2026-05-30
