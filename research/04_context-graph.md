---
id: 2026-05-30_research_cycle-03-context-graph
type: signal
date: 2026-05-30
source: deep research x2 (neo4j, getzep/graphiti, docs.monad.xyz/guides/erc-8004, eips.ethereum.org, kucoin, gitlab, reactflow — ver fuentes)
status: processed
related: [[IDEA-002_agent-to-agent-micropagos]], [[IDEA-001_agentic-onchain-canvas]], [[monad_tech]]
---

# Research cycle #3 — context OS / context graph aplicado a finalistas

Trigger: Ramiro vio proyectos ganar hackatones recientes con "context OS / context graph"; ¿cómo robustece las finalistas?

## Qué es (sin marketing)

Paraguas de 4 cosas distintas — distinguirlas = sonar serio ante el jurado:
1. **Context layer / context engineering** — config de working+session+long-term memory por llamada.
2. **MCP (Model Context Protocol)** — transport layer; **mueve** contexto, NO lo produce. NO es un graph.
3. **Memory layer (vector)** — vector DB por similitud (Mem0, Letta, Cognee).
4. **Context graph / temporal knowledge graph** (el "premium" que gana) — grafo de entidades+relaciones+hechos con validez temporal; da relaciones explícitas, provenance y decision lineage que los vectores NO. Atajo: **Graphiti** (`getzep/graphiti`) + Neo4j/FalkorDB.

## Qué ganó con esto (prior art)

- **Kimi-swarm** — 1º Agent Coexistence Track, **Rebel in Paradise (Monad)**: IDE multi-agente con "graph and context panels" que hacen el swarm observable. Plantilla directa.
- **LORE** (ganador GitLab AI Hackathon 2026): 8 agentes + knowledge graph + dashboard visual.
- **Bits2Brain** (Microsoft AI Agents Hackathon): "Knowledge Star Map".
- **Patrón común:** el wow es **un grafo actualizándose en vivo** mostrando cómo los agentes razonan/comparten memoria. No gana la lógica; gana ver el grafo crecer.

## Capa de contexto ON-CHAIN (clave para Monad)

- **ERC-8004 "Trustless Agents"** — live en Ethereum mainnet desde 2026-01-29. Identity (ERC-721) + Reputation + Validation registries. "CV/pasaporte on-chain del agente".
- **Desplegado en Monad (verificado docs):** Identity `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, Reputation `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`, Validation "coming soon". SDK `agent0` (TS/Python). — docs.monad.xyz/guides/erc-8004.
- **Stack real agentic web:** descubrir vía ERC-8004 Identity → chequear Reputation → pagar vía **x402** → postear feedback a Reputation. Tu demo "predice" el roadmap real.

## Veredicto por idea

| | IDEA-002 (pagos) | IDEA-001 (canvas) |
|---|---|---|
| ¿Fortalece o infla? | **Fortalece (load-bearing)** | **Infla (forzado / Monad-decorado)** |
| Por qué | el `event` de pago = arista; ERC-8004+x402 Bazaar validan el concepto | el canvas YA es un grafo espacial; su wow es el benchmark, no un grafo lateral |
| Wow del grafo | Máximo (cascada de pagos creciendo en vivo) | Bajo (compite con el throughput) |

**→ El context graph va en IDEA-002, NO en 001.** En 001, invertir las 8h en hacer el canvas más rápido/grande/impactante.

## Versión MÍNIMA demo-able 1 día (anti scope-bloat)

El context graph "real" = semanas (unánime en fuentes). Para 8h, **tratarlo como prop de demo, no infra**:
- Contrato `AgentGraph.sol`: `registerAgent()` + `recordInteraction(provider, task, payment)` que emite `event Interaction(...)`. **El grafo vive en los eventos**, no en storage pesado.
- Front escucha `eth_subscribe('monadLogs')` (ws, ~1s antes) → **React Flow** (`@xyflow/react`): `setNodes/setEdges concat` por evento + arista animada (`<animateMotion>` SVG = USDC viajando) + d3-force layout.
- Hook on-chain: registrar agentes en ERC-8004 Identity (ya desplegado) con `agent0`; o replicar versión simple (registro + score). NO desplegar ERC-8004 completo.
- Off-chain (Graphiti/pgvector/embeddings) = **over-engineering para el demo**, skip.

## Riesgo competitivo

x402+agents está **saturado** en Blitz (AgentVerse, TickPay, "Monad Blitz SF: x402 Edition"). Defensa: (1) grafo en vivo único + (2) cascada multi-agente (3-4 pagos encadenados; la mayoría muestra 1).

## Fuentes (selección)

- [Graphiti (getzep)](https://github.com/getzep/graphiti) · [Neo4j context graphs](https://neo4j.com/blog/developer/meet-lennys-memory-building-context-graphs-for-ai-agents/) · [context layer (Atlan)](https://atlan.com/know/context-layer-for-ai-agents/)
- [ERC-8004 en Monad (docs, registries desplegados)](https://docs.monad.xyz/guides/erc-8004) · [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004) · [ERC-8004 (Allium)](https://www.allium.so/blog/onchain-ai-identity-what-erc-8004-unlocks-for-agent-infrastructure/)
- [Kimi-swarm / Rebel in Paradise winners (KuCoin)](https://www.kucoin.com/news/flash/monad-ai-hackathon-concludes-with-11-winning-projects-and-major-llm-partnerships) · [LORE (GitLab)](https://about.gitlab.com/blog/gitlab-ai-hackathon-2026-meet-the-winners/) · [Bits2Brain (Microsoft)](https://microsoft.github.io/AI_Agents_Hackathon/winners/)
- [React Flow animated edges / force layout](https://reactflow.dev/examples/edges/animating-edges) · [Monad WebSockets monadLogs](https://docs.monad.xyz/reference/websockets) · [x402 Bazaar](https://docs.cdp.coinbase.com/x402/bazaar)

## Related

- [[IDEA-002_agent-to-agent-micropagos]]
- [[IDEA-001_agentic-onchain-canvas]]
- [[monad_tech]]

---

**Status:** processed
**Last Updated:** 2026-05-30
