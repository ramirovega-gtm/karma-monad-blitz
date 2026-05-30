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
C  Reputación chain: 🟡 layer + oráculo + bridge listos (offline OK; on-chain en MERGE)
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

### A · Contratos `session/a-contratos` ✅
- [x] `ReputationSBT.sol` (EIP-5192, tiers, getters, guard `_update`, calavera irrevocable)
- [x] `ScoreRegistry.sol` (`recordPayment`/`lookup`/`setScore` ECDSA+nonce/`markDefault`)
- [x] Tests Foundry verdes (15/15) + `Deploy.s.sol` (ciclo SBT→Registry→authorize)
- [x] ABIs reales exportados a `abi/{ScoreRegistry,ReputationSBT}.json` — **matchean** `abi/I*.json` ✓
- [x] **Deployado + verificado (Sourcify `exact_match`)** → `abi/deployments.json` con addresses reales
  - ScoreRegistry `0x9402BA73EA2d51F62BAe071D98DD3ce878d8966C` · ReputationSBT `0x75da3A887c9384d3805b630eF961Aed91892a3aE`
  - Smoke on-chain OK: `recordPayment` emite + `lookup` devuelve (royalty 500bps)

### B · Economía de agentes `session/b-agentes` ✅
- [x] `server.ts` (x402, endpoint 402, `recordPayment` tras settle, `DEMO_SAFE`)
- [x] `agents/` (3 proveedores: scraper/analyst/designer) + `orchestrator.ts` (lookup→pagar/regalía→record→postScore)
- [x] Beat regalía + beat calavera (`markDefault`) contra `MockReputationLayer`
- [x] Loop de economía corre aislado (`npx tsx backend/orchestrator.ts` · `npm run demo`)

### C · Reputación on-chain `session/c-oraculo`
- [x] `oracle.ts` (fórmula `min(100, jobs*10 + volUSDC/10)` desde eventos PaymentRecorded + firma ECDSA EIP-191 + nonce)
- [x] `bridge.ts` (helpers viem read/write a ScoreRegistry + SBT, gas limit fijo, espera receipt)
- [x] `lib/reputation.onchain.ts` (`OnchainReputationLayer implements ReputationLayer` + `fromEnv()`)
- [x] Tests offline (`backend/_test.onchain.ts`): fórmula + recuperación de firma alineada con A — verdes
- [ ] Tests anvil/testnet: `recordPayment`→event, `setScore`→event, `markDefault`→Skull (en MERGE, contra contratos de A)

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

### [A] — Deploy a Monad testnet
- **Added** — Contratos **deployados y verificados en Sourcify** (`exact_match`) en chain 10143:
  - `ScoreRegistry` = `0x9402BA73EA2d51F62BAe071D98DD3ce878d8966C`
  - `ReputationSBT` = `0x75da3A887c9384d3805b630eF961Aed91892a3aE`
  - `signer` (oráculo) = `0xeF7B39eb437a5D783C29Bf7a8e9a11aA01836647` · `goodThreshold` = 70 · `owner` = `0x8a4FA5a15bBAAC2A387a75E2a57511A60C4851ee`
- **Added** — `abi/deployments.json` con addresses reales + `deployedAt`. Wiring on-chain verificado (sbt↔registry, signer, threshold, owner).
- **Fixed** — Smoke on-chain en testnet: `recordPayment` emite `PaymentRecorded` y `lookup` devuelve el artefacto cacheado (royalty 500bps).
- **Next** — Sesión C consume estas addresses + ABIs (`OnchainReputationLayer`); el oráculo firma con `ORACLE_PRIVATE_KEY` del `.env` (esquema en `contracts/README.md`).

### [A] — Contratos (Foundry)
- **Added** — `contracts/` con Foundry (Solidity 0.8.28, OZ v5.1, evm cancun). `ReputationSBT.sol` (SBT soulbound EIP-5192, tiers GoodPayer/Skull, `tokenId == agentId`, guard `_update`, `supportsInterface(0xb45a3c0e)`, calavera **irrevocable**: una vez Skull no se degrada) y `ScoreRegistry.sol` (`recordPayment` arista+cache royalty 500bps, `lookup`, `setScore` con ECDSA EIP-191 + anti-replay por nonce + mint GoodPayer al cruzar `goodThreshold`, `markDefault` onlyOwner→Skull).
- **Added** — `test/Karma.t.sol`: 15 tests verdes (record/lookup, threshold mint, firma válida/inválida, replay, markDefault, skull irrevocable, soulbound transfer revierte, `locked()==true`, interfaces). `script/Deploy.s.sol` (ciclo SBT→ScoreRegistry→`setScoreRegistry`), validado en anvil.
- **Added** — ABIs reales exportados a `abi/ScoreRegistry.json` y `abi/ReputationSBT.json`; verificado que son **superset exacto** de `abi/ISCoreRegistry.json` / `abi/IReputationSBT.json` (todos los miembros de interfaz presentes con tipos idénticos). `contracts/README.md` documenta setup + **esquema de firma del oráculo** (para Sesión C).
- **Changed** — `.gitignore`: agregado `contracts/lib/` (deps por `forge install`, no se commitean).
- **Blocked** — Deploy a Monad testnet pendiente: falta `.env` con `DEPLOYER_PRIVATE_KEY` financiada (MON de gas vía faucet). Comando y verificación Sourcify listos en `contracts/README.md`. Tras deployar: completar `abi/deployments.json` y re-exportar ABIs.
- **Next** — Deployar a testnet + verificar Sourcify + llenar `abi/deployments.json` (addresses + `deployedAt`).
### [C] — Reputación on-chain (oráculo + puente)
- **Added** — `backend/bridge.ts`: helpers viem read/write a ScoreRegistry (`readLookup`, `writeRecordPayment`, `writeSetScore`, `writeMarkDefault`) + SBT (`readHasSkull`, `readTier`). Gas limit fijo (Monad cobra por límite) y espera de receipt para ordenar pago→lectura de logs.
- **Added** — `backend/oracle.ts`: fórmula fija `score = min(100, jobs*10 + volUSDC/10)` calculada desde los eventos `PaymentRecorded` on-chain; firma ECDSA del digest con **domain separation** `keccak256(abi.encodePacked(agentId,value,nonce,scoreRegistry,chainId))` vía EIP-191 personal_sign (`signMessage({message:{raw}})`); `nextNonce()` = ms epoch (anti-replay).
- **Changed** — Esquema de firma alineado con A: el digest pasó de 3 a **5 campos** (agrega `address(this)` + `chainId`) tras confirmar que A implementó `setScore` con domain separation. `scoreDigest`/`signScore` reciben `scoreRegistry`+`chainId`; `OnchainReputationLayer.postScore` los propaga (chainId = `BigInt(env.CHAIN_ID)`). Tests offline ahora cubren domain separation (otro contrato / otra red → no recupera al signer). Verdes.
- **Added** — `backend/lib/reputation.onchain.ts`: `OnchainReputationLayer implements ReputationLayer` (orquesta bridge+oracle) + `fromEnv()` para el swap de 1 línea en MERGE.
- **Added** — `backend/_test.onchain.ts`: tests offline (fórmula + que la firma recupera al signer). Verdes. `tsc --noEmit` limpio.
- **Changed** — Solo FILES I OWN + CHANGELOG sección C. `lib/reputation.ts` no se tocó (se implementa).
- **✅ ALINEADO con A** — Esquema de firma de `setScore` (fuente de verdad: `contracts/README.md` de A): el contrato verifica `ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encodePacked(agentId,value,nonce,address(this),block.chainid))), sig) == signer`, con tipos `uint256,int256,uint256,address,uint256`. Anti-replay vía `nonceUsed[nonce]` (nonce ms-epoch, único). El `signer` del contrato = address de `ORACLE_PRIVATE_KEY` (`oracleAddress()`).
- **Next** — MERGE: setear `SCORE_REGISTRY`/`REPUTATION_SBT` reales (de A), swap `new MockReputationLayer()` → `OnchainReputationLayer.fromEnv()`, y validar on-chain (recordPayment→event, setScore→ScoreUpdated, markDefault→Skull). Opcional: pasar `fromBlock` = bloque de deploy si el RPC limita rango de getLogs.
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
