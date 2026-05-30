---
id: IDEA-002_agent-to-agent-micropagos
type: idea
date: 2026-05-30
tags: [idea, hackathon, monad, agent, payments, x402, context-graph, erc-8004]
related: [[evaluation_frame]], [[monad_tech]], [[anti_patterns]], [[_generacion-cycle-01]], [[2026-05-30_research_cycle-02-finalistas-002-y-001]], [[2026-05-30_research_cycle-03-context-graph]], [[demo]]
status: GO (finalista principal — robustecida con context graph, cycle #3)
last_updated: 2026-05-30
---

# IDEA-002 — Context graph de agentes que se pagan en cascada (x402 + ERC-8004 on Monad)

> Robustecida con research cycle #3 ([[2026-05-30_research_cycle-03-context-graph]]). El context graph la convierte en su mejor versión. Plan de build en [[demo]].

## Qué es (versión robustecida)

Agentes AI que se contratan y **se pagan por-request en USDC on-chain** (x402, facilitador oficial Monad), donde **cada micropago escribe una arista en un context graph compartido on-chain** que crece en vivo en pantalla. El grafo se vuelve **memoria** (no se paga dos veces lo mismo — cache on-chain) y **reputación** (los agentes más usados crecen). Los agentes tienen identidad on-chain vía **ERC-8004** (registries ya desplegados en Monad). Diferenciador visual+narrativo: **cascada multi-agente** (1 tarea → 3-4 pagos encadenados) dibujándose como grafo en tiempo real.

**Pitch:** *"Cada pago entre agentes deja rastro en un context graph compartido on-chain. El grafo es memoria y reputación. Es ERC-8004 + x402, en vivo, sobre Monad."*

## Problema → Solución → Utilidad (el porqué que vende)

**El problema (real, hoy):** los agentes AI ya pueden *hacer* trabajo, pero no pueden *participar de una economía*. No tienen tarjeta de crédito, no firman suscripciones mensuales, no abren cuentas. Cuando un agente necesita una capacidad que no tiene (datos, un análisis, una traducción, una imagen), o su dueño humano paga una API a mano — que no escala a miles de micro-decisiones autónomas — o no la usa. Y no hay forma de que un agente sepa **en quién confiar** ni de **no repetir** trabajo que otro agente ya hizo. Falta la capa económica + memoria + confianza para que muchos agentes colaboren.

**Por qué los rieles viejos no alcanzan:** un micropago de $0.001 por llamada es imposible con Stripe (fee mínimo se lo come) y en chains caras (gas > pago). Recién cierra con **stablecoin + gas ínfimo + settlement instantáneo = Monad**.

**La solución:** un mercado abierto donde cualquier agente contrata a cualquier otro, paga **por-resultado** en USDC, y cada interacción construye un **context graph compartido on-chain** que funciona como:
- **Memoria colectiva** — si alguien ya resolvió "datos del mercado X", el grafo lo tiene → no se paga de nuevo. *La economía se vuelve más eficiente con el uso.*
- **Reputación sin plataforma central** — los agentes más contratados y validados crecen en el grafo (ERC-8004). Confianza emergente, sin gatekeeper.

**La utilidad / el "para qué":** es **infraestructura de la agentic web**. Caso concreto: un agente de research arma un informe contratando y pagando a un scraper + un analista + un diseñador — más barato, más rápido, componible, sin humano en el loop. A escala: un mercado de capacidades donde los agentes se especializan y se contratan entre sí.

**Por qué ahora:** agentes capaces (2026) + x402 y ERC-8004 recién shippeados + Monad hace viable el micropago. La ventana es hoy.

**El wow de utilidad (no solo visual):** *"lo que ven crecer en el grafo no es un juguete — es la memoria y la economía de un sistema multi-agente. Cada nodo es un agente que se ganó su lugar; cada arista es valor real que se movió. Así es como van a trabajar los agentes, y solo cierra económicamente en Monad."*

## Cómo usa Monad (eje 1 — leverage)

- Micropago por-call solo cierra con gas ínfimo (x402 gasless vía facilitador Monad).
- `monadLogs` (suscripción especulativa ~1s antes) → el grafo reacciona casi instantáneo al pago = parte del wow.
- ERC-8004 Identity/Reputation desplegados en Monad → identidad/trust on-chain sin construir contratos de cero.

## Scoring 6 ejes ([[evaluation_frame]]) — actualizado cycle #3

| Eje | Cycle #2 | Cycle #3 | Nota |
|-----|:--:|:--:|------|
| Monad-leverage | 3 | 3 | x402 gasless + ERC-8004 desplegado + monadLogs. |
| Buildability ~1d | 2 | 2 | Honesto: cascada + grafo + x402 es ambicioso, pero el `event`=arista y React Flow lo de-riskean. |
| Wow | 2 | **3** | El grafo creciendo en vivo + USDC volando convierte el eje débil en el más fuerte. |
| Narrativa/fit | 3 | 3 | Bullseye agent-economy + "predice el roadmap real" (ERC-8004+x402). |
| Diferenciación | 3 | 3 | Grafo en vivo + cascada contra-restan la saturación x402 en Blitz. |
| Feasibility | 3 | 3 | x402 + ERC-8004 desplegado + React Flow = building blocks listos. |
| **Σ** | 16 | **17** | El context graph sube el wow de 2→3. |

## Anti-patterns ([[anti_patterns]])

- AP#3 "wow invisible": **resuelto** — el grafo en vivo ES el wow.
- AP#2 "clon": x402+agents saturado → diferenciar con grafo + cascada (no clonar Dispatch/Bazaar/AgentVerse/TickPay).
- AP#7 "sobre-ingeniería": **riesgo real del context graph** → tratarlo como **prop de demo** (grafo = eventos del contrato), NO infra (nada de Graphiti/embeddings/ontología en 8h).

## Riesgo #1 + plan B

- **Riesgo #1:** scope (cascada + grafo + x402 + ERC-8004) no cierra en 8h.
- **Plan B escalonado:** (1) si la cascada no cierra → 1 comprador→1 proveedor con grafo igual creciendo; (2) si ERC-8004 da fricción → registro simple propio (registerAgent + score); (3) grabar video de respaldo. El grafo en vivo + 1 pago real on-chain ya es demo ganable.

## Stack

Solidity+Foundry (`AgentGraph.sol`: `registerAgent` + `recordInteraction`→`event Interaction`) · **x402** (facilitador molandak, USDC testnet, `@x402/*`) · **ERC-8004** Identity/Reputation desplegados (SDK `agent0`) · agentes Python/Node + Claude · front Next + **React Flow** (nodos/aristas live + arista animada) + WS `monadLogs` + sonido. Chain 10143.

## Related

- [[evaluation_frame]]
- [[monad_tech]]
- [[anti_patterns]]
- [[_generacion-cycle-01]]
- [[2026-05-30_research_cycle-02-finalistas-002-y-001]]
- [[2026-05-30_research_cycle-03-context-graph]]
- [[demo]]

---

**Status:** GO (finalista principal — robustecida con context graph, cycle #3)
**Last Updated:** 2026-05-30
