---
id: IDEA-001_agentic-onchain-canvas
type: idea
date: 2026-05-30
tags: [idea, hackathon, monad, agent, consumer, game]
related: [[evaluation_frame]], [[monad_tech]], [[anti_patterns]], [[_generacion-cycle-01]], [[2026-05-30_research_cycle-02-finalistas-002-y-001]], [[2026-05-30_research_cycle-03-context-graph]], [[demo]]
status: GO (finalista — mejorada cycle #2)
last_updated: 2026-05-30
---

# IDEA-001 — Agentic on-chain canvas ("r/place comandado por un agente AI")

> Mejorada con research cycle #2 ([[2026-05-30_research_cycle-02-finalistas-002-y-001]]). Plan de build en [[demo]].

## Qué es (refinada)

Lienzo de píxeles compartido on-chain donde **pintar es una tx** y un **agente AI traduce una orden en lenguaje natural a una ráfaga de tx** que dibuja en vivo. El reframe del research: **la demo NO es "otro r/place", es un benchmark visible de Monad** — contador tx/seg, costo vs Ethereum, "leemos el bloque en estado `Proposed` ~1s antes de finalizar", y **multi-agente concurrente** generando una tormenta de píxeles.

## Problema → Utilidad (honesto: es un tech-proof, no un producto)

**Para qué sirve:** menos un producto, más una **prueba en vivo** — ¿puede una blockchain soportar apps consumer en tiempo real (juegos, social, mundos colaborativos masivos) donde *cada acción es on-chain*? Hoy no: gas y latencia lo matan. El canvas demuestra que **Monad sí** → desbloquea una categoría entera (fully on-chain games/social) que en otras chains es imposible.

**El wow de utilidad:** *"no es solo un dibujo — es la prueba de que una clase de apps que hoy son imposibles on-chain (un juego en tiempo real, una red social, un mundo compartido) recién se puede construir en Monad."*

**Límite honesto:** la utilidad de la 001 es narrativa-de-categoría (un benchmark con relato), no un problema de usuario concreto como la 002. Es un ángulo legítimo de hackatón, pero **más débil en "para qué"** — razón extra para que la apuesta principal sea la 002.

## Cómo usa Monad (eje 1 — leverage)

- **Micro-tx masivas + throughput visible.** Miles de tx en minutos a gas ínfimo; imposible en otra EVM.
- **`monadLogs` (suscripción especulativa)** = wow técnico único: render casi instantáneo, ninguna otra chain lo tiene.

## Scoring 6 ejes ([[evaluation_frame]]) — actualizado

| Eje | Antes | Ahora | Nota |
|-----|:--:|:--:|------|
| Monad-leverage | 3 | 3 | Throughput como espectáculo + monadLogs. |
| Buildability ~1d | 2 | 2 | Patrones claros (blog 2048, scaffold), pero burst-tx + render es trabajo real. |
| Wow | 3 | 3 | Grid llenándose + tx/seg + "bloque pre-finality". |
| Narrativa/fit | 3 | 2 | "Agentic" está saturado (413 proyectos). El fit real es el **benchmark de Monad**, no "es un agente". |
| Diferenciación | 2 | 2 | Clones de r/place existen; diferencia = ángulo benchmark + agente como generador de carga. |
| Feasibility | 2 | 2 | Riesgo #1 mitigable (paintBatch / endpoint dedicado / cap grid). |
| **Σ** | 15 | **14** | Más honesto post-research: narrativa baja por saturación agentic. |

## Anti-patterns ([[anti_patterns]])

- AP#2 "clon premiado": mitigar con el ángulo benchmark + multi-agente, no "es r/place".
- AP#7 "sobre-ingeniería": agente off-chain que firma tx; nada de IA on-chain.

## Riesgo #1 + plan B (resuelto en research)

- **Riesgo #1:** front no aguanta la tormenta de eventos / RPC público rate-limita (25 rps).
- **Read path:** WebSocket `monadLogs` (1 conexión, no rate-limited) + `<canvas>` `fillRect` por celda + coalescing en `requestAnimationFrame`.
- **Write path (el cuello):** `paintBatch()` (N píxeles/tx) **o** endpoint dedicado; nonce local `useRef` + `eth_sendRawTransaction` directo + `Promise.all` + gas hardcodeado (Monad cobra el limit).
- **Plan B:** cap grid 64×64, mostrar "píxeles/seg" si se batchea, **grabar video de respaldo**.

## Context graph (cycle #3) — evaluado y DESCARTADO

Se evaluó meterle un context graph (como en 002). **Veredicto: forzado / "Monad-decorado"** ([[2026-05-30_research_cycle-03-context-graph]]): el canvas YA es un grafo espacial (píxeles=nodos, adyacencia=relación), y su wow es el **benchmark de throughput**, no un grafo lateral que competiría por atención. El context graph va en 002, no acá. En 001, invertir las 8h en hacer el canvas más rápido/grande/impactante. (Si se quisiera un toque: panel "Agente A pintó N píxeles" = leaderboard, no graph.)

## Stack

Arrancar de `monad-developers/scaffold-monad-foundry`. Contrato `MonadCanvas` (`setPixel` + `paintBatch` + mapping latest-state) · front Next/viem + canvas 2D + WS monadLogs · Privy embedded wallet (auto-sign) · agente Python/Claude NL→píxeles. Testnet chain 10143.

## Related

- [[evaluation_frame]]
- [[monad_tech]]
- [[anti_patterns]]
- [[_generacion-cycle-01]]
- [[2026-05-30_research_cycle-02-finalistas-002-y-001]]
- [[demo]]

---

**Status:** GO (finalista — mejorada cycle #2)
**Last Updated:** 2026-05-30
