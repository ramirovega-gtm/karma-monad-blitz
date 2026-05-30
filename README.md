# Karma — la capa de confianza de la economía de agentes

**Monad Blitz · Buenos Aires · 2026-05-30** · mini-hackatón IRL de 1 día · voto de audiencia.

> **En una frase:** Una economía donde los agentes AI se contratan y se pagan por-resultado on-chain, y **cada interacción construye su reputación** — la buena baja sus costos y le abre trabajo; la mala le pega un **SBT calavera irrevocable** que lo excluye del mercado.

> **Pitch:** *"El Equifax de la economía de agentes — pero Equifax no te puede tatuar una calavera. Nosotros sí, y on-chain es para siempre. No nos importa quién sos; nos importa qué hiciste."*

Es la fusión de dos ideas: una economía de agentes con micropagos x402 + context graph (de Ramiro) × un sistema de reputación/score on-chain con Soulbound Tokens (ReputeFi, del compañero). Stack: Monad (testnet chain 10143), x402, ERC-8004, EIP-5192, Foundry, Next + React Flow.

---

## Cómo usar este repo

Este repo tiene **el contexto + el plan + el código**: todo el dApp se desarrolla **acá mismo**. **Contratos + backend de este lado**; el **front lo trabaja otra persona** y se acopla después (consume ABIs + eventos). El estado vivo del build está en [`build/CHANGELOG.md`](build/CHANGELOG.md) y el plan con diagramas en [`build/plan.html`](build/plan.html). Acá también está la idea + todo el camino que la produjo, para que cualquiera del equipo (o un agente AI) entienda el qué y el porqué.

| Carpeta | Qué hay |
|---------|---------|
| **[`idea/karma.md`](idea/karma.md)** | **La idea principal.** Problema, solución, cómo funciona, arquitectura anillo 1, scoring, demo 3 min, plan 7h, riesgos, checklist. **Empezá acá.** |
| [`COMO-LLEGAMOS.md`](COMO-LLEGAMOS.md) | El recorrido completo: de 7 ideas abiertas → 3 finalistas → 3 cycles de research → merge crítico → Karma. Por qué descartamos lo que descartamos. |
| `idea/` | Los componentes: la economía de agentes (002) + el canvas (001) + wagering (003), cada uno con su demo. |
| `research/` | Los 4 cycles de deep research con fuentes (tech+landscape de Monad, finalistas, context graph). |
| `frame/` | El frame de evaluación (6 ejes), specs verificadas de Monad + building blocks, y anti-patterns. |
| `reputefi-brief.md` | El brief original del compañero (la mitad ReputeFi del merge). |
| **[`build/kickoff.md`](build/kickoff.md)** | **Para arrancar a codear:** prompt de kickoff, reparto por track (contratos/backend, sin personas), plan hora-por-hora, primeros 45 min. |
| **[`build/plan.html`](build/plan.html)** | **El plan de ejecución con diagramas** (stack, arquitectura, servicios, flujo de datos, esquema de contratos, scaffold, módulos, plan 7h, demo, riesgos). Abrir en el navegador. |
| **[`build/CHANGELOG.md`](build/CHANGELOG.md)** | **El "acá estamos":** tracker por sesiones + estado vivo del build. Se actualiza al cerrar cada paso. |
| **[`build/sessions/`](build/sessions/SESSIONS.md)** | **Desarrollo fragmentado en sesiones paralelas** (S0 cimientos → A/B/C → MERGE). Cada `SESSION-*.md` es autocontenido para abrir en una sesión Claude nueva sin pisarse con las otras. |
| **[`build/FRONTEND-HANDOFF.md`](build/FRONTEND-HANDOFF.md)** | **Todo lo que necesita la persona del front** (otra persona, repo aparte): demo, stack, red, ABIs/addresses, eventos a escuchar, fixtures y gotchas. |

## El loop que define a Karma

```
agentes se contratan y pagan vía x402
   → cada pago escribe una arista en un context graph on-chain
   → reputación (score) + memoria (no pagar dos veces lo mismo → regalía)
   → el que falla recibe SBT calavera irrevocable → excluido on-chain
```

El **SBT calavera** es el corazón y el hero del demo: lo que ningún proyecto del prior art muestra en vivo es la **consecuencia** on-chain.

---

*Origen: destilado del sistema de research `pmf-radar` (sub-dominio aislado `hackathon-monad`). Este repo es el paquete autocontenido para el equipo del hackatón.*
