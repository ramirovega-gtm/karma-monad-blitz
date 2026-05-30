---
id: IDEA-003_realtime-onchain-wagering
type: idea
date: 2026-05-30
tags: [idea, hackathon, monad, markets, wagering]
related: [[evaluation_frame]], [[monad_tech]], [[anti_patterns]], [[_generacion-cycle-01]]
status: GO (finalista — 3º)
last_updated: 2026-05-30
---

# IDEA-003 — Wagering / mercado on-chain que liquida cada bloque

## Qué es

Un micro-mercado de apuestas en vivo sobre un evento de alta frecuencia (ej: ¿sube o baja el próximo tick de un precio? ¿qué color sale en la próxima ronda?). Los usuarios (y opcionalmente agentes AI) apuestan, y el mercado **liquida cada bloque (~400ms)**. Pantalla: mercado latiendo en tiempo real, posiciones abriéndose/cerrándose, payouts instantáneos.

## Cómo usa Monad (eje 1 — leverage)

- **Liquidación por-bloque:** apostar/liquidar cada 400ms genera muchísimas tx; solo viable con gas ínfimo + finality sub-segundo de Monad.
- "Intelligent markets" / high-frequency finance = una de las zonas que Monad premia ([[monad_tech]]).

## Scoring 6 ejes ([[evaluation_frame]])

| Eje | Score | Nota |
|-----|:--:|------|
| Monad-leverage | 3 | High-frequency settlement imposible en chains lentas/caras. |
| Buildability ~1d | 2 | Contrato de mercado simple; el oracle/feed en vivo es el trabajo. |
| Wow | 3 | Mercado latiendo + dinero moviéndose en vivo. |
| Narrativa/fit | 2 | Markets/wagering sí; agente opcional (sumarlo sube el fit). |
| Diferenciación | 2 | Prediction markets son comunes; el ángulo "cada bloque" ayuda. |
| Feasibility honesta | 1 | **Oracle/data feed en tiempo real = riesgo #1.** |
| **Σ** | **13** | |

## Anti-patterns ([[anti_patterns]])

- AP#5 "dependencia de lo no liberado": cuidado con depender de un oracle real → usar feed mockeado/pseudo-aleatorio on-chain.
- AP#2 "clon premiado": prediction markets están vistos → diferenciar con la frecuencia por-bloque + agentes apostando.

## Concepto de demo (3 min)

1. (45s) Mostrar el mercado latiendo cada 400ms.
2. (75s) Apostar; ver liquidación instantánea bloque a bloque; opcional: un agente AI apostando con estrategia.
3. (60s) Contador de rondas/tx liquidadas + "esto liquida 2-3x por segundo on-chain; imposible en otra L1".

## Riesgo #1 + plan B

- **Riesgo #1:** el feed de datos en vivo no está listo / es inestable.
- **Plan B:** fuente de aleatoriedad on-chain o feed pseudo-determinista pre-armado (la gracia es la frecuencia de settlement, no el dato real).

## Stack

Solidity (`TickMarket` + settlement por bloque) + feed mock + front Next/viem con gráfico en vivo + (opcional) agente Python/Claude apostador. Testnet chain 10143.

## Related

- [[evaluation_frame]]
- [[monad_tech]]
- [[anti_patterns]]
- [[_generacion-cycle-01]]

---

**Status:** GO (finalista — 3º)
**Last Updated:** 2026-05-30
