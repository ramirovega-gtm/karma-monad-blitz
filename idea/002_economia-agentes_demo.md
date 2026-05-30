---
id: IDEA-002_demo
type: demo
date: 2026-05-30
tags: [demo, hackathon, monad, x402, context-graph, erc-8004]
related: [[IDEA-002_agent-to-agent-micropagos]], [[monad_tech]], [[2026-05-30_research_cycle-02-finalistas-002-y-001]], [[2026-05-30_research_cycle-03-context-graph]]
status: ready-to-build
last_updated: 2026-05-30
---

# Demo plan — IDEA-002 (context graph de agentes + micropagos x402)

Hackatón: Monad Blitz BA, **1 día IRL, voto de audiencia**. Objetivo: ganar la sala.

## Pitch en una frase

"Agentes AI que se contratan y se pagan en cascada on-chain, y **cada pago construye un context graph compartido** que crece en vivo: memoria (no pagar dos veces lo mismo) + reputación (agentes más usados crecen). ERC-8004 + x402, en vivo, sobre Monad."

## Guion de demo (3 min) — vende utilidad, no solo lo visual

1. **(0:00-0:25) El problema (engancha por el porqué).** "Los agentes AI ya hacen trabajo, pero no pueden contratarse ni pagarse entre sí: no tienen tarjeta, no firman suscripciones, no saben en quién confiar. Les falta una economía. Eso es lo que construimos." Pantalla dividida: izquierda **grafo vacío** (4 agentes registrados en ERC-8004), derecha ticker del explorer de Monad.
2. **(0:25-1:25) La solución en acción — cascada + grafo creciendo.** Prompt al orquestador ("armame un brief de mercado de X"). Se descompone y paga en cascada: Scraper → Analista → Diseñador, y **aparece el resultado real** (datos→análisis→imagen). Por cada pago: **arista animada con USDC viajando** + nodo creciendo + "cha-ching" + tx en el explorer. "Sin humano en el loop: un agente acaba de contratar y pagar a otros tres."
3. **(1:25-2:10) Por qué es útil de verdad (memoria + confianza).** Repetir una sub-tarea ya hecha → "esto ya está en el grafo, **no pagamos de nuevo** — la economía se vuelve más eficiente con el uso". Mostrar un nodo que creció por reputación. "El grafo es memoria colectiva y reputación sin plataforma central."
4. **(2:10-3:00) Por qué Monad + el cierre que vende.** Comparador: "esta cascada = $X en Ethereum L1 / **$0.00Y en Monad**, sub-segundo. El micropago entre agentes **solo cierra acá**." Cerrar con utilidad: *"lo que vieron crecer no es un juguete — es la memoria y la economía de un sistema multi-agente. Es ERC-8004 + x402, el stack real de la agentic web, funcionando hoy. Así es como van a trabajar los agentes."*

## Plan hora-por-hora (~8h)

| Bloque | Tarea | Entregable |
|--------|-------|-----------|
| H0–1 | `scaffold-monad-foundry` + `AgentGraph.sol` (`registerAgent`, `recordInteraction`→`event Interaction`) + deploy chain 10143 | Contrato live |
| H1–2 | Registrar agentes (ERC-8004 Identity desplegado `0x8004A1…` vía `agent0`, o registro propio simple) | Agentes con identidad on-chain |
| H2–3.5 | Proveedores `@x402/express` (402→resultado real con Claude) + facilitador molandak + USDC faucet | Endpoints x402 cobrando |
| H3.5–5 | Orquestador (Claude + `@x402/fetch`) cascada 3 pagos + cache on-chain (mapping taskHash→result) | Cascada + memoria funcionando |
| H5–7 | **Front React Flow:** WS `monadLogs`→`setNodes/setEdges concat` + arista animada (USDC viajando) + sonido + comparador costo | Grafo creciendo en vivo |
| H7–8 | Ensayo pitch 3 min + **video de respaldo** | Demo lista |

## Riesgo #1 + plan B

- **Riesgo:** scope (cascada+grafo+x402+ERC-8004) no cierra.
- **Plan B escalonado:** (1) cascada → degradar a 1→1 con grafo igual creciendo; (2) ERC-8004 → registro propio simple; (3) cache/reputación → mencionarlo en pitch sin construir; (4) video de respaldo en H7–8. **El grafo en vivo + 1 pago real on-chain ya gana.**

## Setup técnico (verificado — [[monad_tech]])

- x402: facilitador `https://x402-facilitator.molandak.org`, USDC testnet `0x534b2f3A21130d7a60830c2Df862319e593943A3`, chain `eip155:10143`, `@x402/evm ≥2.2.0`. Gasless (no 4337/7702/Privy).
- ERC-8004 en Monad: Identity `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, Reputation `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`, SDK `agent0`.
- Grafo: React Flow (`@xyflow/react`), `setNodes/setEdges concat` por evento, arista animada `<animateMotion>`, d3-force layout; alimentar con `eth_subscribe('monadLogs')`.
- ⚠️ Grafo = **prop de demo** (eventos del contrato), NO infra. Nada de Graphiti/embeddings en 8h (AP#7).

## Related

- [[IDEA-002_agent-to-agent-micropagos]]
- [[monad_tech]]
- [[2026-05-30_research_cycle-02-finalistas-002-y-001]]
- [[2026-05-30_research_cycle-03-context-graph]]

---

**Status:** ready-to-build
**Last Updated:** 2026-05-30
