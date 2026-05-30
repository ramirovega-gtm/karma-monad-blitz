# CHANGELOG — Karma (anillo 1)

> **Para qué sirve este archivo.** El plan (`plan.html`) dice *qué* construimos y *cómo*. Este changelog dice **en qué punto estamos**. Es el marcador "acá estamos": cualquiera del equipo —o un agente AI— lo lee y sabe el estado exacto sin releer todo el plan.
>
> **Cómo lo usamos mientras codeamos:** cada vez que se cierra un paso, se marca `[x]` en la guía de pasos y se agrega una entrada con fecha/hora en el log de abajo (qué se añadió y por qué). Así Claude queda siempre actualizado sobre el plan.
>
> Convención: estilo [Keep a Changelog](https://keepachangelog.com/es/1.1.0/). Formato de entrada: `Added` / `Changed` / `Fixed` / `Removed` / `Cut` (recortado por scope).

**Proyecto:** Karma — la capa de confianza de la economía de agentes en Monad.
**Meta del día:** loop core (pago → `recordPayment` → evento → score → SBT) andando a las **15:00**. Submission 17:35 · demo 18:00.
**Repo:** todo se desarrolla en **este mismo repositorio** (`karma-monad-blitz`). **Contratos + backend de este lado.** El **front lo trabaja otra persona** y se **acopla después** (consume los eventos/contratos ya desplegados).
**Desarrollo por sesiones paralelas:** ver [`sessions/SESSIONS.md`](sessions/SESSIONS.md) (S0 cimientos → A/B/C en paralelo → MERGE). Handoff front: [`FRONTEND-HANDOFF.md`](FRONTEND-HANDOFF.md).

---

## 📍 Estado actual

```
FASE: 1 · Build (cimientos listos)
S0 Cimientos:        ✅ hecho (mergeado a main)
A  Contratos:        ⬜ listo para arrancar
B  Economía agentes: ⬜ listo para arrancar
C  Reputación chain: ⬜ listo para arrancar
MERGE Integración:   ⬜ bloqueado por A+B+C
FRONT (otra persona):⬜ se acopla después (repo aparte)
ÚLTIMO PASO CERRADO: S0 · scaffold + lib + ABIs + mock (typecheck + smoke OK)
PRÓXIMO PASO: abrir A, B y C en paralelo (worktree + branch por sesión)
BLOQUEOS: ninguno
```

Leyenda: ⬜ pendiente · 🟡 en progreso · ✅ hecho · ⛔ cortado (scope) · ⚠️ con riesgo/bloqueo

---

## 🗺️ Tracker por sesiones

Cada sesión actualiza **solo su bloque** (en su branch) → merges limpios. Detalle y pasos completos en `sessions/SESSION-*.md`.

### S0 · Cimientos `session/0-cimientos` 🔒 bloqueante ✅
- [x] Scaffold (`contracts/`, `backend/lib/`, `backend/agents/`, `abi/`) + `package.json` + `tsconfig` + `.gitignore`
- [x] `.env.example` + `backend/lib/{env,chain,types}.ts`
- [x] `backend/lib/reputation.ts` (interfaz `ReputationLayer` + `MockReputationLayer`) + `_smoke.ts`
- [x] `abi/ISCoreRegistry.json` + `abi/IReputationSBT.json` + `abi/deployments.json` (placeholders)
- [x] Verificado: `npm run typecheck` limpio + `npm run smoke` OK
- [x] **Merge a `main`** → habilita A/B/C

### A · Contratos `session/a-contratos`
- [ ] `ReputationSBT.sol` (EIP-5192, tiers, getters, guard `_update`)
- [ ] `ScoreRegistry.sol` (`recordPayment`/`lookup`/`setScore` ECDSA/`markDefault`)
- [ ] Tests Foundry verdes + `Deploy.s.sol`
- [ ] Deploy testnet + Sourcify → `abi/deployments.json` + ABIs reales (matchean `abi/I*.json`)

### B · Economía de agentes `session/b-agentes` ✅
- [x] `server.ts` (x402, endpoint 402, `recordPayment` tras settle, `DEMO_SAFE`)
- [x] `agents/` (3 proveedores: scraper/analyst/designer) + `orchestrator.ts` (lookup→pagar/regalía→record→postScore)
- [x] Beat regalía + beat calavera (`markDefault`) contra `MockReputationLayer`
- [x] Loop de economía corre aislado (`npx tsx backend/orchestrator.ts` · `npm run demo`)

### C · Reputación on-chain `session/c-oraculo`
- [ ] `oracle.ts` (fórmula + firma ECDSA + `setScore`)
- [ ] `bridge.ts` (helpers viem read/write a ScoreRegistry)
- [ ] `lib/reputation.onchain.ts` (`OnchainReputationLayer implements ReputationLayer`)
- [ ] Tests anvil/testnet: `recordPayment`→event, `setScore`→event, `markDefault`→Skull

### MERGE · Integración `integration/merge`
- [ ] Merge a+b+c · swap Mock → `OnchainReputationLayer` (1 línea) · addresses reales
- [ ] Loop core end-to-end verificable por explorer (pago→evento→score→SBT)
- [ ] Beat regalía + beat calavera validados · `DEMO_SAFE` operativo
- [ ] Publicar `abi/deployments.json` + ABIs + `abi/fixtures.events.json` (para el front) · 3 agentes fallback

### Stretch (solo si el loop core anda a las 15:00)
- [ ] **S1** `ReverseAuction.sol`: `openJob` / `bid` (ponderado por reputación, calavera revierte) / `close`

### ⛔ Cortado por scope (NO se construye)
- LoanManager · LiquidationEngine · AI risk engine real (→ fórmula fija firmada) · escribir en ERC-8004 (solo lectura).

---

## 📒 Log

> Entradas nuevas arriba. Formato: `### [hora] — título` + bullets `Added/Changed/Fixed/Cut`.

### [B] — Economía de agentes (x402 + cascada + 3 beats)
- **Added** — `backend/agents/` (scraper/analyst/designer determinísticos, offline) + `hash.ts` (`inputHashFor`/`payloadHash`, sentinel `__FAIL__`) + `index.ts` (registro `getAgent`/`listAgents`).
- **Added** — `backend/server.ts`: server Express con handshake x402 spec-shaped (402 + `accepts` PaymentRequirements → `X-PAYMENT` base64 → settle → `X-PAYMENT-RESPONSE`). Tras settle OK invoca `reputation.recordPayment` (el puente pago→arista del grafo). Ruta admin `POST /admin/markDefault/:agentId` para el beat calavera. `createServer(reputation)` + `startServer()` + entrypoint standalone (`npm run server`, `GET /health`).
- **Added** — `backend/orchestrator.ts`: cliente x402 + cascada `lookup → pagar/regalía → recordPayment → postScore → markDefault`. Demo in-process (`npm run demo`): cascada (scraper+analyst GoodPayer) → beat reúso (scraper otra vez → regalía 500bps) → beat calavera (designer entrega basura → SKULL). Firma EIP-3009 real cableada en el camino `DEMO_SAFE=false` (guardada).
- **Changed** — `package.json` (compartido): agregadas deps `express`, `x402`, `x402-express`, `x402-fetch` + dev `@types/express`, y scripts `demo`/`server`. ⚠️ **coordinar el merge de `package.json`/`package-lock.json`** con A/C.
- **Cut** — Llamadas a Claude en los agentes (artefactos determinísticos → demo offline y reproducible). Camino live del facilitator implementado pero **no ejercitado**: x402 v1.2.0 NO soporta Monad (enum `network` sin 10143) → `DEMO_SAFE` es el camino operativo (el grafo no depende del facilitator en vivo, como manda CLAUDE.md).
- **Verified** — `npm run typecheck` limpio · `npm run demo` corre el loop completo (3 beats) · server standalone responde `402` sin pago y `200` en `/health`.
- **Next** — MERGE: cambiar `new MockReputationLayer()` por `OnchainReputationLayer` de C (1 línea en `orchestrator.ts` y, si se usa standalone, en `server.ts`). Nada más del código de B se toca.

### [S0] — Cimientos
- **Added** — Scaffold + superficies compartidas (congeladas): `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`; `backend/lib/{types,env,chain,reputation}.ts` (interfaz `ReputationLayer` + `MockReputationLayer`) + `_smoke.ts`; `abi/{ISCoreRegistry,IReputationSBT,deployments}.json`; placeholders `contracts/` y `backend/agents/`.
- **Fixed** — `npm install` (viem + dotenv + tsx + typescript); `npm run typecheck` limpio; `npm run smoke` corre el ciclo lookup→pago→cache→score→calavera.
- **Next** — Abrir A/B/C en paralelo (worktree + branch). Cada una lee su `sessions/SESSION-*.md`.

### [Unreleased] — Planning
- **Added** — `build/plan.html`: plan de ejecución completo con diagramas (stack, arquitectura, servicios, flujo de datos, esquema de contratos, scaffold, módulos, plan 7h, demo, riesgos, anti-patterns).
- **Added** — `build/CHANGELOG.md` (este archivo): guía de pasos + tracker de estado.
- **Changed** — Decisión de organización: **todo se desarrolla en este mismo repo** (sin repo de build separado) y **sin dividir el trabajo por personas**. Contratos + backend de este lado; el front lo trabaja otra persona y se acopla después. Se actualizaron `plan.html` (scaffold, arquitectura, módulos, plan/gantt, stack) y este changelog (pasos P0–P5 por tracks, no por owners). El contrato de integración con el front es `abi/deployments.json` + eventos.
- **Added** — Desarrollo fragmentado en **sesiones paralelas**: `build/sessions/` (SESSIONS index + S0/A/B/C/MERGE) y `build/FRONTEND-HANDOFF.md`. El tracker de pasos pasó a estar **por sesión** (cada una edita solo su bloque, en su branch). Desacople B↔C vía interfaz TS `ReputationLayer` + mock.
- **Status** — Build aún no iniciado. Próximo: **abrir Sesión 0 (cimientos)** → mergear a `main`.

<!--
PLANTILLA para copiar al cerrar un paso (poné el prefijo de tu sesión: S0/A/B/C/MERGE):

### [HH:MM · <sesión>] — <título corto>
- **Added** — <qué se agregó>
- **Changed** — <qué cambió>
- **Fixed** — <qué se arregló>
- **Cut** — <qué se recortó y por qué>
- **Next** — <próximo paso>
-->
