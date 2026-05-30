---
id: IDEA-001_demo
type: demo
date: 2026-05-30
tags: [demo, hackathon, monad, canvas, game]
related: [[IDEA-001_agentic-onchain-canvas]], [[monad_tech]], [[2026-05-30_research_cycle-02-finalistas-002-y-001]]
status: ready-to-build
last_updated: 2026-05-30
---

# Demo plan — IDEA-001 (agentic on-chain canvas)

Hackatón: Monad Blitz BA, **1 día IRL, voto de audiencia**. Objetivo: ganar la sala con un **benchmark visible de Monad**.

## Pitch en una frase

"Un lienzo donde cada píxel es una transacción real: le doy una orden en lenguaje natural a un agente AI y dispara **cientos de tx en ráfaga** que dibujan en vivo — miren a Monad aguantar la tormenta en tiempo real."

## Guion de demo (3 min)

1. **(0:00-0:30) El gancho.** Canvas vacío. "Cada celda que se pinte es una transacción on-chain en Monad. Mírenlo."
2. **(0:30-1:00) Píxel a mano.** Pintar unas celdas a mano → tx confirmando sub-segundo, celdas apareciendo al instante (vía `monadLogs`, estado `Proposed`). "Estoy leyendo el bloque **antes de que finalice**."
3. **(1:00-2:00) El agente.** Prompt: "dibujá el logo de Monad". El agente dispara una **ráfaga de tx**; el grid se llena; **contador tx/seg sube en vivo**. Lanzar 2-3 agentes concurrentes → tormenta de píxeles. "La chain no se cae."
4. **(2:00-3:00) Por qué Monad.** Comparador: "este dibujo = N tx = **$0.00X en Monad** vs $Y y horas en Ethereum L1." Cerrar con el total de tx y tx/seg pico. "Esto solo es posible cuando las tx son baratas, rápidas y paralelas."

## Plan hora-por-hora (~8h)

| Bloque | Tarea | Entregable |
|--------|-------|-----------|
| H0–1 | `scaffold-monad-foundry` corriendo + faucet + deploy `MonadCanvas` (`setPixel` + evento `PixelPainted` + `paintBatch`) | Contrato live, chain 10143 |
| H1–3 | **(atacar riesgo #1 primero)** Front `<canvas>` + WS `eth_subscribe(monadLogs)` → `fillRect` por celda + coalescing rAF | Canvas que renderiza eventos fluido |
| H3–5 | Agente NL→píxeles (Claude) + firma en ráfaga: nonce local `useRef` + `eth_sendRawTransaction` + `Promise.all` + gas hardcodeado; Privy auto-sign | Agente pinta en ráfaga |
| H5–6 | Contador tx/seg + comparador costo vs Ethereum (derivado de logs) | Métricas en pantalla |
| H6–7 | Multi-agente concurrente + pulido visual | Tormenta de píxeles |
| H7–8 | Ensayo pitch 3 min + **grabar video de respaldo** | Demo lista |

## Riesgo #1 + plan B (resuelto en research)

- **Riesgo:** render no aguanta / RPC público rate-limita (25 rps QuickNode).
- **Plan B en orden:** (1) **endpoint dedicado** QuickNode/Alchemy para el write path; (2) **`paintBatch()`** N píxeles/tx → mostrar "píxeles/seg"; (3) **cap grid 64×64**; (4) coalescing de eventos en rAF; (5) **video de respaldo** por si el wifi del venue falla.

## Setup técnico (verificado — [[monad_tech]])

- Read: `wss://rpc.monad.xyz` + `eth_subscribe('monadLogs')` (estado `Proposed`, ~1s antes). 1 conexión.
- Write: nonce local + `eth_sendRawTransaction` directo (sin simulación) + `Promise.all` + **gas limit hardcodeado** (Monad cobra el limit). Privy embedded = auto-sign sin popups.
- Estado inicial: leer "latest board" on-chain con multicall (no reproducir historial).
- ⚠️ Block time defendible = "sub-second" (no afirmar 400ms). Base fee 100 gwei.

## Related

- [[IDEA-001_agentic-onchain-canvas]]
- [[monad_tech]]
- [[2026-05-30_research_cycle-02-finalistas-002-y-001]]

---

**Status:** ready-to-build
**Last Updated:** 2026-05-30
