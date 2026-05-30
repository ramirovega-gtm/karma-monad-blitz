---
id: MERGE_002-x-reputefi_agent-trust-economy
type: idea-principal
date: 2026-05-30
tags: [idea-principal, hackathon, monad, agent, reputation, x402, erc-8004, sbt, context-graph]
related: [[IDEA-002_agent-to-agent-micropagos]], [[monad_tech]], [[2026-05-30_research_cycle-03-context-graph]], [[evaluation_frame]], [[anti_patterns]]
status: IDEA PRINCIPAL — en desarrollo (build hoy, Monad Blitz BA)
last_updated: 2026-05-30
---

# Karma — la capa de confianza de la economía de agentes

> **Idea principal a desarrollar.** Fusión de IDEA-002 (economía de agentes x402 + context graph) × ReputeFi (score on-chain + SBT). Nombre de trabajo: **Karma** (alt: "Rep", "Mark"). Brief del compañero: `~/Downloads/ReputeFi_Brief.md`. Research: 3 cycles ([[2026-05-30_research_cycle-03-context-graph]] + 2 deep research del merge).

**La idea en una frase:** Una economía donde los agentes AI se contratan y se pagan por-resultado on-chain, y **cada interacción construye su reputación** — la buena baja sus costos y le abre trabajo; la mala le pega un **SBT calavera irrevocable** que lo excluye del mercado.

**Pitch (alma del proyecto):** *"El Equifax de la economía de agentes — pero Equifax no te puede tatuar una calavera. Nosotros sí, y on-chain es para siempre. No nos importa quién sos; nos importa qué hiciste."*

---

## 1. El caso de uso concreto

**Economía de agentes de inteligencia/research.** Los agentes producen y consumen **artefactos reutilizables**: datasets scrapeados, documentos parseados, scores de riesgo, resúmenes de mercado. Un agente "orquestador" recibe una tarea de su cliente y **contrata y paga a agentes-proveedores especializados** (scraper, analista, diseñador) para resolverla — sin humano en el loop.

Ese mercado tiene tres fallas que Karma resuelve:

1. **Sin reputación, todos son iguales.** Un agente con 500 trabajos entregados compite igual que uno creado hace 5 minutos para estafar. No hay forma de saber a quién contratar.
2. **Se paga dos veces por lo mismo.** Si el Agente A ya compró "tasas de lending DeFi en Monad ahora", y 10 min después el Agente B necesita lo mismo, B paga full price y el scraper rehace trabajo idéntico. **Pérdida muerta** (la info es un bien no-rival: recomputar lo que ya existe y sigue válido no agrega valor).
3. **Sin consecuencia, no hay confianza.** Si un agente entrega basura o no paga, abre otra identidad y vuelve como si nada.

---

## 2. La solución — una sola primitiva, tres caras

Karma NO es "score + préstamo + marketplace" pegados. Es **una primitiva de reputación on-chain** que se alimenta de los pagos y tiene tres caras:

### Cara 1 — Reputación que se gana transaccionando
Cada pago/entrega vía x402 **escribe una arista** en un context graph on-chain. El grafo es la historia: quién proveyó qué, a quién, cuándo, validado por quién. Un oráculo firmante deriva un **score** de esa actividad. Identidad de agente vía **ERC-8004** (registries ya desplegados en Monad).

### Cara 2 — Memoria: no pagar dos veces lo mismo (eficiencia)
El grafo cachea artefactos determinísticos por **hash de input** con **validez temporal (TTL)**: `(inputHash → {productor, puntero, validUntil, royaltyBps})`. Si un agente pide algo que ya existe, está fresco y es de un productor confiable → **paga una regalía chica al productor original** en vez del precio completo. El comprador ahorra, el productor gana ingreso pasivo por reúso, la red no quema compute.
> **Límite honesto (defendible en Q&A):** esto aplica SOLO a resultados determinísticos/estáticos dentro de su TTL y de procedencia confiable. Dato stale, output personalizado, o licencia exclusiva → se paga de nuevo. Por eso el grafo tiene validez temporal + procedencia, no "gratis para siempre".

### Cara 3 — Consecuencia: el SBT calavera (el corazón)
Cuando un agente no entrega o no paga: slashing + **SBT calavera EIP-5192 irrevocable** pegado a su identidad → sus bids futuros son **rechazados on-chain**. El que entrega bien mintea un SBT de buen pagador y mejora sus términos.
> **Test de coherencia:** si sacás el SBT, el score pierde dientes (no hay consecuencia). El SBT es el corazón, no un add-on. **Se pitchea desde acá.**

---

## 3. Cómo funciona (flujo)

```
Agente A necesita una capacidad → busca proveedor (lee grafo + score + ERC-8004 identidad)
   │
   ├─ ¿el resultado ya está en el grafo, fresco y confiable?
   │     SÍ → paga REGALÍA chica al productor original (reúso)  ──┐
   │     NO → contrata a Agente B y paga por-resultado vía x402 ──┤
   │                                                              │
   │   x402 settle OK (USDC, gasless) ── NO emite evento propio ──┘
   │        ↓ (backend, tras settle exitoso)
   │   ScoreRegistry.recordPayment(agentId, amount, inputHash) ← TX on-chain
   │        ↓ emite PaymentRecorded  (= arista del grafo + entrada de cache)
   │   front: viem watchContractEvent (WS monadLogs) → React Flow: arista A→B en vivo
   │        ↓ oráculo firmante (ECDSA) → setScore(agentId, value, sig)
   │   score sube → si cruza umbral, mint SBT buen pagador
   │
   └─ si A entrega basura / no paga → markDefault(agentId)
            ↓ mint SBT CALAVERA (irrevocable) → bids futuros rechazados on-chain
```

**Gap técnico clave (verificado):** el settle de x402 dispara solo el `Transfer` ERC-20 del USDC, NO un evento custom. El puente x402 → ScoreRegistry **lo construís en el backend** (segunda TX `recordPayment` tras el settle). **Atajo demo-safe:** `recordPayment` se llama aunque el settle se mockee → el grafo nunca depende del facilitator en vivo.

---

## 4. Por qué el context graph, y por qué on-chain

- **Vs cache plano (Redis):** un cache resuelve `input→output` para una empresa. No tiene procedencia, lineage (este brief se armó de estos 3 sub-resultados), reputación, ni forma de pagarle al productor. El **grafo** captura relaciones + procedencia + reputación.
- **Vs off-chain:** el reúso/memoria off-chain (semantic caching) sirve dentro de UNA organización. Para una economía **abierta cross-party** (agentes de dueños distintos) necesitás un registro **neutral, tamper-proof, que nadie controle** + **settlement** para pagar la regalía + **procedencia** para confiar. Eso = x402 + grafo on-chain.
- **Por qué "pago = arista":** el evento de pago es a la vez (a) prueba de la transacción, (b) link de procedencia, (c) datapoint de reputación. Una escritura, tres funciones. La entrada de cache se crea en la primera compra, gratis.

---

## 5. Por qué Monad

Recalcular score + mintear badges + escribir el grafo **en cada interacción** solo es viable a **gas ~0 + settlement sub-segundo + ejecución paralela** (múltiples agentes a la vez). En Ethereum L1 sería prohibitivo. El micropago/regalía por-call **solo cierra económicamente acá**. Specs y building blocks verificados → [[monad_tech]].

---

## 6. Arquitectura — anillo 1 (construible en ~7h)

**2 contratos propios + leer 2 de ERC-8004 (ya desplegados, NO los escribís).**

```
SMART CONTRACTS (Solidity + Foundry, OZ v5)
  ├─ ScoreRegistry.sol  (~80-110 líneas)
  │    mapping(uint256 agentId => Score{int256 value; uint64 updatedAt; uint64 jobs})
  │    mapping(bytes32 inputHash => Artifact{address producer; string uri; uint64 validUntil; uint16 royaltyBps})
  │    recordPayment(agentId, amount, inputHash) → emite PaymentRecorded   // arista + cachea artefacto
  │    lookup(inputHash) view → Artifact                                   // ¿ya existe y fresco?
  │    setScore(agentId, value, nonce, sig)  // oráculo firmante ECDSA (fórmula fija para el demo)
  │    markDefault(agentId) → sbt.mintSkull(agentId)
  └─ ReputationSBT.sol  (~80 líneas)
       EIP-5192: fork OZ ERC-721 + guard en _update (revert si transfer) + locked()=true
       enum Tier { GoodPayer, Skull };  mint(agentId, tier)

LEER (no escribir): ERC-8004 IdentityRegistry + ReputationRegistry (desplegados en Monad)
   ⚠️ [verificar el día] las direcciones en docs.monad.xyz/guides/erc-8004 (2 fuentes dieron valores distintos)

BACKEND + AGENTES (Node/TS)   server x402 (@x402/express) + cascada de agentes (@x402/fetch + Claude) + oráculo firmante (viem signMessage)
FRONT (Next + shadcn + React Flow)   grafo en vivo (watchContractEvent WS) + score/SBT por nodo + comparador costo
```

**Se CORTA (no es opcional):** LoanManager, LiquidationEngine, **ReverseAuction** (stretch si sobra), AI risk engine real (→ fórmula fija firmada), escribir en ERC-8004 (solo leer identidad). Razón: AP#7 sobre-ingeniería + AP#4 scope de startup. El anillo 1 ya cuenta la historia completa.

---

## 7. Scoring ([[evaluation_frame]])

| Eje | Score | Nota |
|-----|:--:|------|
| Monad-leverage | 3 | Micropago/regalía + recalcular score/mint por interacción solo cierra en Monad. |
| Buildability ~1d | 2 | 2 contratos + cortes; el riesgo es la integración x402↔on-chain. |
| Wow | 3 | Grafo creciendo + regalía evitando un pago + **calavera excluyendo un bid en vivo**. |
| Narrativa/fit | 3 | "Capa de confianza de la agent economy" = bullseye Monad. |
| Diferenciación | 3 | Loop cerrado + **consecuencia on-chain que ningún prior art muestra en vivo**. |
| Feasibility | 2 | Integración end-to-end es el riesgo; mitigado con plan B. |
| **Σ** | **16** | |

---

## 8. Anti-patterns ([[anti_patterns]])

- AP#7 sobre-ingeniería = **riesgo #1.** Mitigación: anillo 1 (2 contratos), nada de Graphiti/embeddings/lending.
- AP#2 clon: x402+agentes+reputación+subasta están saturándose → la defensa es el **loop cerrado + SBT calavera en vivo**, no el concepto.
- AP#4 scope de startup: cortar lending/liquidación/subasta es obligatorio.

---

## 9. Demo (3 min) — el héroe es la calavera

1. **(0:00-0:25) Problema.** "Los agentes ya trabajan y se pagan, pero no hay reputación ni consecuencia si fallan. Construimos la capa de confianza." Grafo con agentes (identidad ERC-8004).
2. **(0:25-1:05) Reputación en vivo.** Orquestador contrata y paga a 2-3 agentes vía x402 → grafo crece, scores suben, buen-pagador mintea SBT.
3. **(1:05-1:35) Beat de eficiencia (memoria).** Un agente pide algo que **ya está en el grafo** → paga **regalía chica** al productor original en vez del precio completo. "El sistema recuerda; nadie paga dos veces lo mismo."
4. **(1:35-2:25) EL SHOWSTOPPER.** Un agente entrega basura / no paga → `markDefault` → **SBT calavera irrevocable aparece en su nodo** → su próximo bid es **rechazado on-chain en pantalla**. (Abrir su identidad en el explorer: la calavera pegada.)
5. **(2:25-3:00) Por qué Monad + cierre.** "Recalcular reputación y mintear en cada ciclo solo es viable a gas ~0 y sub-segundo. Implementamos el bid-weighting-por-reputación que el paper de Agent Exchange dejó en teoría. El Equifax de los agentes, con calavera on-chain."

---

## 10. Plan 7h (10:45 → 17:35 · por track, no por personas · todo en este repo)

> Contratos + backend de este lado. El **front lo trabaja otra persona** y se acopla después (consume ABIs + eventos). Plan vivo y diagramas en `build/plan.html`; estado en `build/CHANGELOG.md`.

| Hora | Contratos (Foundry) | Backend + Agentes (Node/TS) |
|------|---------------------|------------------------------|
| 10:45-11:30 | scaffold + `ScoreRegistry` skeleton + eventos | setup `@x402/*` + facilitator + USDC testnet |
| 11:30-12:30 | `recordPayment` + `setScore` (ECDSA) | server x402 (1 endpoint) + cliente que paga |
| 12:30-13:30 | `ReputationSBT` (OZ `_update`) + mint | cascada de agentes + oráculo firma score |
| 13:30-14:00 | **deploy testnet** + addresses + publicar ABIs | conectar settle → `recordPayment` |
| 14:00-15:00 | integración: pago→evento→score→SBT | idem |
| **15:00-16:00** | **INTEGRACIÓN CORE END-TO-END + buffer (sagrado)** | idem |
| 16:00-16:45 | stretch: cache/regalía o subasta (si verde) | demo-safe fallback (mock settle) |
| 16:45-17:35 | congelar, ensayar 2×, screenshots backup | idem |

**Regla de oro:** a las **15:00 el loop core anda** (verificable por logs/explorer, sin depender del front). Después: integración + acople con el front + polish + ensayo, NO features. El front corre en paralelo (otra persona) y se acopla cuando los contratos están desplegados y los eventos publicados.

---

## 11. Riesgos + plan B

- **Riesgo #1: scope / integración no cierra.** → anillo 1, regla 15:00.
- **Riesgo #2: x402 facilitator falla en vivo.** → mock settle + `recordPayment` igual dispara el grafo.
- **Riesgo #3: el reúso/regalía se ve forzado.** → es beat secundario; si no cierra, se corta. El héroe es la calavera.
- **Siempre:** video de respaldo grabado 16:45-17:35 + 3 agentes precargados como fallback del loop live.

---

## 12. Decisiones de merge (qué se cortó y por qué — no perder el razonamiento)

- "Préstamos P2P + colateral para agentes" → **FORZADO** (un agente no tiene CAPEX). Reframe: crédito = términos/acceso ponderados por reputación, no plata prestada.
- 2 subastas inversas (lenders de ReputeFi + proveedores) confundían → **una sola** mecánica (stretch).
- El concepto "reputación de agentes" NO es virgen (ERC-8004 mainnet ene-2026, "agent credit" en prensa may-2026) → la diferenciación es **la consecuencia on-chain en vivo**, no la idea.
- Centro de gravedad del compañero **intacto:** su score sigue siendo el héroe y el SBT la prueba; solo cambia "préstamo humano" → "economía de agentes" (más fresco, menos saturado).

---

## 13. Checklist pre-build

- [x] Build en ESTE mismo repo (decidido: contratos + backend acá; front lo hace otra persona y se acopla después). Trabajar todo en local primero.
- [ ] Faucet Monad testnet → MON + USDC a las wallets.
- [ ] `git clone https://github.com/monad-developers/foundry-monad` + Foundry instalado.
- [ ] `@x402/*` + facilitador `x402-facilitator.molandak.org` + USDC testnet `0x534b2f3A21130d7a60830c2Df862319e593943A3` (chain 10143).
- [ ] Verificar direcciones ERC-8004 en `docs.monad.xyz/guides/erc-8004`.
- [ ] Next + shadcn + React Flow (`@xyflow/react`) + viem WS transport.
- [ ] Definir con el compañero: tamaño de equipo + reparto (Contratos / Backend+Agentes / Front) + que acepta el recorte (sin lending).

## Related

- [[IDEA-002_agent-to-agent-micropagos]] (componente: economía x402 + context graph)
- [[monad_tech]]
- [[2026-05-30_research_cycle-03-context-graph]]
- [[evaluation_frame]]
- [[anti_patterns]]

---

**Status:** IDEA PRINCIPAL — en desarrollo (build hoy, Monad Blitz BA)
**Last Updated:** 2026-05-30
