# Cómo llegamos a Karma

El recorrido completo de cómo se generó y filtró la idea. No es solo "qué construimos" — es **por qué**, y qué descartamos en el camino (con la razón). Cada cycle de research está en `research/` con fuentes.

## 0. El método

Se usó un frame adaptado a hackatón (en `frame/`): toda idea se puntúa contra **6 ejes** — Monad-leverage, buildability ~1 día, wow, narrativa/fit, diferenciación, feasibility — con dos gates duros: **usar tecnología real de Monad** + **demo-able en ~8h IRL**. Regla de oro del hackatón: gana lo que se ve y se entiende en 3 minutos (voto de audiencia), no el backend más robusto.

## 1. Generación abierta → 7 ideas → 3 finalistas

Motor: `capacidades de Monad × casos de uso × frame`. Salieron 7 ideas. Se mataron 2 (DCA bot = wow invisible; clicker puro = sin narrativa) y se parkearon 2 (agent arena = scope; money streaming = wow medio). Quedaron 3 finalistas:

- **002 — economía de agentes x402** (agentes que se pagan por-resultado).
- **001 — canvas on-chain** (r/place comandado por agente AI = benchmark de Monad).
- **003 — wagering que liquida cada bloque**.

Detalle: `research/01_generacion-abierta.md`.

## 2. Deep research por finalista → correcciones y de-risking

Se profundizó 002 y 001 (`research/03_deep-research-finalistas.md`):

- **002:** existe un **facilitador x402 oficial de Monad** (gasless, paga USDC) → la parte de pagos no se inventa. Prior art peligroso: Dispatch (no clonar). Diferenciador: **cascada multi-agente**.
- **001:** se corrigieron specs (Monad cobra por **gas limit**, no usado; block time defendible "sub-second"). Riesgo de render resuelto (`monadLogs` + React Flow). Pero "agentic" está saturado.

## 3. Context graph → la capa que sube la robustez

El compañero/Ramiro detectaron que el concepto **"context OS / context graph"** gana hackatones recientes (`research/04_context-graph.md`):

- Lo que gana no es backend robusto — es **ver el grafo crecer en vivo** (precedentes: Kimi-swarm ganó un track del propio Rebel in Paradise de Monad mostrando "graph + context panels"; LORE; Bits2Brain).
- Base real on-chain: **ERC-8004** (identidad/reputación de agentes) **ya desplegado en Monad**.
- **Veredicto:** el context graph **fortalece la 002** (cada pago = arista; memoria + reputación) y es **forzado en la 001** (el canvas ya es un grafo espacial). → va en 002.
- Trampa evitada: el context graph "real" = semanas. En 8h se trata como **prop de demo** (eventos del contrato + React Flow), NO infra (nada de Graphiti/embeddings).

## 4. La lógica económica del reúso (por qué "no pagar dos veces")

Se interrogó la promesa "no pagás dos veces lo mismo" para que sea defendible:

- La info es un **bien no-rival**: recomputar lo que ya existe y sigue válido es **pérdida muerta**.
- Pero NO es "gratis para siempre": aplica solo a resultados **determinísticos + dentro de su TTL + de procedencia confiable**. Dato stale, output personalizado o licencia exclusiva → se paga de nuevo.
- Solución: el grafo cachea `inputHash → {productor, puntero, validUntil, royaltyBps}`; el reúso paga una **regalía chica** al productor original (no precio completo). El comprador ahorra, el productor gana ingreso pasivo, la red no quema compute.
- Por qué **on-chain**: una economía abierta cross-party necesita un registro neutral + settlement + procedencia que un cache off-chain (una sola empresa) no da.

## 5. El merge con ReputeFi → Karma

El compañero traía **ReputeFi** (`reputefi-brief.md`): credit score on-chain + subasta inversa + SBT moroso, "el Equifax de Monad". Se evaluó el merge **de forma crítica** (2 deep research):

**La costura real = reputación on-chain** (ambas ideas son eso por debajo). Pero:

| Pieza | Veredicto |
|-------|-----------|
| Reputación que se gana transaccionando + context graph | ✅ núcleo |
| **SBT consecuencia (calavera)** | ✅ **corazón + hero del demo** |
| "Préstamos P2P + colateral para agentes" | ❌ **FORZADO** (un agente no tiene CAPEX) → reframe a "crédito = términos/acceso" |
| 2 subastas inversas (lenders + proveedores) | ⚠️ confundía → una sola (stretch) |
| AI risk engine real | ⚠️ invisible → fórmula fija firmada |

**Diferenciación (dura, honesta):** x402+agentes, reputación on-chain (Spectral) y subasta inversa están **todos saturándose** en mayo 2026. Lo único defendible es **el loop cerrado con la consecuencia on-chain en vivo** (el SBT calavera) que ningún prior art muestra.

**Decisión:** GO al merge como **"anillo 1"** (2 contratos: ScoreRegistry + ReputationSBT; cortar lending/liquidación/subasta). Centro de gravedad del compañero intacto: su score sigue siendo el héroe y el SBT la prueba; solo cambia "préstamo humano" → "economía de agentes" (más fresco, menos saturado que ReputeFi sola).

## 6. Resultado: Karma

La idea principal a desarrollar → `idea/karma.md`. Fallback si el merge no cierra: la 002 sola.

---

*Cada paso está documentado con fuentes en `research/`. El frame y las specs verificadas, en `frame/`.*
