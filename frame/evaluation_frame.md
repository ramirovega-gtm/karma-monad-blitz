---
id: evaluation_frame
type: frame
tags: [frame, canonical, hackathon, evaluation, monad]
related: [[monad_tech]], [[anti_patterns]], [[workflow]], [[CLAUDE]], [[README]]
status: Canonical
last_updated: 2026-05-28
---

# Frame de evaluación — ganar el demo

El análogo de las "5 verticales durables" del repo padre, pero para un hackatón. **No evalúa durabilidad ni potencial de empresa** — evalúa probabilidad de **ganar un demo en 24-72h usando Monad**.

## Los 6 ejes

Cada idea candidata se puntúa **0-3** en cada eje. Idea finalista = alta simultáneamente en 1+2+3.

| # | Eje | Pregunta | Mata si… |
|---|-----|----------|----------|
| 1 | **Monad-leverage** | ¿Usa una capacidad concreta de Monad (paralelismo, throughput, costo, latencia) que sería imposible o mala en otra EVM? | Corre idéntico en cualquier EVM; Monad es decorado. |
| 2 | **Buildability ~1 día** | ¿Un equipo chico lo tiene demo-able en **~8h presenciales** (Monad Blitz BA es IRL de 1 día) con stack estándar (Solidity + Foundry/Hardhat + viem/wagmi + front)? | Requiere más de una jornada, infra que no se monta IRL, o depende de algo no liberado. |
| 3 | **Wow / demo-impact** | ¿El jurado lo "ve" funcionar en 3 min y se sorprende? | El valor es invisible en una demo en vivo. |
| 4 | **Narrativa / fit con track** | ¿La historia conecta con lo que Monad quiere mostrar al mundo y con los tracks/premios del hackatón? | No encaja en ningún track; nadie entiende por qué importa. |
| 5 | **Diferenciación** | ¿Evita ser el enésimo DEX/lending/NFT-mint? ¿Ángulo no obvio? | Es un clon de lo que ya ganó 10 hackatones. |
| 6 | **Feasibility honesta** | ¿Cuál es el riesgo #1 que rompe la demo, y hay plan B? | Riesgo #1 sin mitigación y sin fallback demo-able. |

## Cómo usar

1. **Restricción Monad primero (gate).** Si el eje 1 (Monad-leverage) es 0, descartar antes de seguir. No se negocia.
2. **Buildability como segundo gate.** Una idea wow pero no construible en el plazo es ruido. Mejor una idea 80%-wow que termina, que una 100%-wow a medio hacer en la demo.
3. **Wow desempata.** Entre dos ideas viables y con leverage, gana la que mejor se demuestra en vivo.
4. **Ejes 4-5-6 afinan.** Narrativa, diferenciación y feasibility separan finalistas de la idea ganadora.

## Heurística de generación (motor de ideas)

Igual que el repo padre opera como "detective con pizarra", acá se generan ideas cruzando:

```
Capacidades de Monad        ×   Casos de uso / problemas    ×   Frame de evaluación
(qué hace Monad mejor:          (qué se vuelve viable             (los 6 ejes como
paralelismo, throughput,        cuando lo on-chain es             evaluación POST-mapeo,
costo bajo, latencia baja)      barato/rápido/masivo)             no filtro generativo)
        ↓
   Ideas candidatas (donde una capacidad real de Monad desbloquea
   un caso de uso que era inviable/feo en EVMs lentas o caras)
```

**El ángulo más fuerte de un hackatón de Monad:** "esto sólo tiene sentido cuando las transacciones son baratas, rápidas y paralelas a escala". Buscar casos de uso que **mueren a $X de gas o a Y segundos de block time** en otras chains y **reviven** en Monad — ahí está el leverage que un jurado de Monad premia.

## Qué NO se evalúa acá (vive en el repo padre, no acá)

- Durabilidad 5-10yr, economía agéntica, concentración de labs.
- Filtro Ramiro de 12 puntos, capital staging, founder-solo.
- LatAm-first, anti-saturación VC, falacia de ausencia.

Si alguno de esos criterios aparece evaluando una idea de hackatón, es contaminación del raíz — descartarlo.

## Related

- [[monad_tech]]
- [[anti_patterns]]
- [[workflow]]
- [[CLAUDE]]

---

**Status:** Canonical
**Last Updated:** 2026-05-28
