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
FASE: 3 · Front (EN CURSO) — backend + contratos + S1 COMPLETOS ✅
S0 ✅ · A ✅ · B ✅ · C ✅ · MERGE ✅ · S1 ✅  (todo on-chain, en main, pusheado)
FRONT: 🟡 `frontend/` ARMADO (Next 16 + React Flow + viem) — 5 pantallas + grafo en vivo + showstopper
ÚLTIMO PASO CERRADO: frontend/ con marketplace + Procedencia (grafo) + Muro + Detalle + Registrar; backend/api.ts (job/auction)
PRÓXIMO PASO: ensayo de demo + (opcional) cableo WS en vivo + deploy a Vercel
BLOQUEOS: ninguno
DEMO BACKEND LISTO: reúso/regalía · GoodPayer · 💀 Skull · subasta (bid-weighting + calavera revierte) — todo on-chain
ADDRESSES: ScoreRegistry 0x9402…966C · ReputationSBT 0x75da…a3aE · ReverseAuction 0x7ca6…b459 (ver abi/deployments.json)
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
- [x] Tests anvil/testnet: `recordPayment`→event, `setScore`→event, `markDefault`→Skull (validado en MERGE contra contratos de A)

### MERGE · Integración `integration/merge` ✅
- [x] Merge a+b+c · swap Mock → `OnchainReputationLayer.fromEnv()` (en `orchestrator.ts` + `server.ts`) · `.env` con addresses reales
- [x] Loop core end-to-end **en vivo en Monad testnet** (recordPayment→PaymentRecorded→postScore→markDefault), typecheck limpio
- [x] Beat regalía (scraper→regalía 500bps) + beat calavera (designer→Skull, `hasSkull=true` on-chain) · `DEMO_SAFE` operativo
- [x] Fix integración: `oracle.readStats` pagina `getLogs` en ventanas de 100 (límite del RPC público de Monad)
- [x] Publicado `abi/fixtures.events.json` (6 PaymentRecorded + 3 ScoreUpdated reales) para el front
- [ ] (prep demo) 3 agentes precargados + saltear input por corrida + tuning GoodPayer (ver 📍)

### FRONT · Integración del front `session/front` ⬜ (próxima sesión)
> Vive en `frontend/` EN ESTE REPO; la sesión puede tocar el back para exponer endpoints. Brief: `sessions/SESSION-FRONT.md`. Detalle de integración: `FRONTEND-HANDOFF.md`.
- [x] `RPC_WS` resuelto: `wss://testnet-rpc.monad.xyz` (probado, en `.env`)
- [x] `frontend/` (Next 16 + Tailwind v4 + `@xyflow/react` + viem) consumiendo `abi/` (copiado a `frontend/src/onchain`)
- [x] **5 pantallas** (Spec Layout): Marketplace (cards + sidebar/filtros + estado VETADO), Detalle, **Procedencia = grafo React Flow en vivo**, Muro de Vetados, Registrar (wizard colateral con decay)
- [x] **Showstopper**: trigger de veto → 💀 en card + nodo del grafo + fila en el Muro; subasta con bid de calavera rechazado
- [x] Score + badge Tier por nodo + contador tx/seg + comparador de costo (Monad vs Ethereum) en Procedencia
- [x] Motor de demo **fixtures-first** (corre sin backend); cascada agente→agente, regalía/reúso, calavera
- [x] `backend/api.ts` (router de acción): `POST /api/job` (cascada real on-chain vía `execStep`), `POST /api/auction/run`, `GET /api/onchain/:id` + CORS en `server.ts`. Loop core intacto.
- [ ] (opcional) Cableo WS en vivo (`watchContractEvent`) reemplazando la simulación
- [ ] Deploy a Vercel + ensayo de demo + 3 agentes precargados (fallback)
- **Decisión de scope**: el catálogo/vetados/colateral son **seed de producto en el front** (no endpoints) — el colateral es visual+API, sin contrato nuevo (contratos congelados). La calavera sigue siendo el único hecho on-chain real.

### Stretch ✅
- [x] **S1** `ReverseAuction.sol`: `openJob` / `bid` (ponderado por reputación, calavera revierte) / `close` — deployado + verificado + validado en vivo
  - `ReverseAuction` = `0x7ca67a992100ff9CF95f72c70c20a84A9E17b459` (Sourcify) · 22/22 tests · `npm run auction`

### ⛔ Cortado por scope (NO se construye)
- LoanManager · LiquidationEngine · AI risk engine real (→ fórmula fija firmada) · escribir en ERC-8004 (solo lectura).

---

## 📒 Log

> Entradas nuevas arriba. Formato: `### [hora] — título` + bullets `Added/Changed/Fixed/Cut`.

### [FRONT-apify] — Marketplace reestructurado al layout de Apify Store
- **Changed** — Distribución portada de apify.com/store manteniendo el brand de Karma: **search hero arriba**, **sidebar izquierdo de filtros** (Categorías con contadores + Modelo de precio + Nivel de riesgo + toggle "Solo oficiales"), fila de **orden + contador de resultados**, **grid 3-col**.
- **Changed** — Card a la anatomía densa de Apify (ícono a la izquierda, título + autor con avatar, descripción, fila de stats ★·usuarios·éxito, pricing en el footer) integrando el brand de Karma (chip de Karma score por tier, colateral, recurrencia, star ribbon, estado VETADO). Tipografía sans bold en nombres y score.
- **Verified** — `npm run build` verde (7 rutas).

### [FRONT-contexto] — Context graph del lado del usuario ("Tu Contexto")
- **Added** — Pantalla `/contexto`: el usuario/empresa carga su contexto una vez (Identidad & Fiscal, Negocio, Preferencias, Integraciones) → los agentes lo leen para ejecutar **sin pedir inputs**. Medidor de completitud + persistencia en `localStorage`.
- **Added** — **Memoria por agente**: cuando un agente necesita un dato muy específico que no está en el contexto global, lo pide una vez y queda guardado scopeado a ese agente (no lo vuelve a pedir). Seed: Fiscal-1 ya recordó su punto de venta AFIP.
- **Added** — En Detalle de cada agente: bloque "Contexto que usa este agente" (chips ✓ cargado / ○ falta, linkean a /contexto) + el input específico (`asks`) que se guarda en la memoria del agente. Modelo en `lib/context.ts` (`AGENT_CONTEXT`: qué lee y qué pide cada agente). Provider extendido (`context`, `agentMemory`, `setContextField`, `saveAgentInput`).
- **Verified** — `npm run build` verde (7 rutas).

### [FRONT-redesign] — Visual portado del diseño Claude Design (Monad-violet + serif)
- **Changed** — Sistema de diseño nuevo en `globals.css`: paleta dark Monad-violet (`#0A0A0F` bg, `#13132B` cards, violeta `#7C3AED`/`#A855F7`, cyan pagos, verde GoodPayer, rojo calavera), **tipografía serif (Georgia) para display/headings**, glows radiales violeta/cyan + textura de grilla tenue. Propaga a las 5 pantallas vía tokens.
- **Changed** — Catálogo reescrito al del diseño (`marketplace-data.js`): 11 agentes B2C con framing LatAm ("delegá lo que odiás") — Fiscal-1, Verifier-3, Prospector-0, Yield-9, Oracle-1… + **Degen-4, el villano** que vacía la cartera (slash 20k → calavera). Colateral escala con riesgo (1-5). Atlas (orquestador) dispara la cascada del grafo. 3 agentes mapean a ids on-chain reales (markDefault real sobre id 3).
- **Changed** — Marketplace rediseñado: hero "Delegá lo que *odiás*", search "¿Qué querés dejar de hacer?" + Delegar, **chips de categoría horizontales** (Impuestos, Ventas, Compliance, Inversiones, Cripto), cards con **score serif gigante** como héroe, star ribbon, badges de confianza, colateral por riesgo, botón Contratar violeta, estado VETADO con calavera de fondo. Header con wordmark serif "Karma." + pills violeta + wallet verde.
- **Verified** — `npm run build` verde (6 rutas, TS ok). Demo fixtures-first intacto. Procedencia/Muro/Detalle/Registrar heredan el sistema (cohesivos).
- **Note** — El archivo de diseño (share de Claude Design) no es accesible por fetch desde el entorno (404, requiere sesión); el usuario lo descargó a `~/Downloads/Karma (1)` (CSS+JS+screenshots de referencia).

### [FRONT] — `frontend/` armado: marketplace + grafo en vivo + showstopper
- **Added** — App Next 16 (App Router) + Tailwind v4 + `@xyflow/react` v12 + viem en `frontend/`. Tema oscuro con tokens del Spec Layout. Provider de estado (`src/state/karma.tsx`) que sostiene el grafo (los pagos = aristas), scores, calaveras, vetados y subasta — **motor de demo fixtures-first** (corre sin backend).
- **Added** — 5 pantallas: **Marketplace** (sidebar categorías + filtros + search/sort, card de agente con chips Karma/colateral/recurrencia + estado VETADO, trigger de veto), **Detalle** (identidad + Karma score + medallas + stats + track record + card "Programá la recurrencia"), **Procedencia** (grafo React Flow en vivo: nodos=agentes con score/badge, aristas=pagos animadas, regalía=arista fina; panel resumen + subasta + comparador Monad vs Ethereum), **Muro de Vetados** (4 KPIs + padrón), **Registrar** (wizard 3 pasos con colateral + decay).
- **Added** — Catálogo seed (`src/lib/catalog.ts`): 10 agentes en 5 verticales (según el análisis de tiers); 3 mapean a ids on-chain reales (1/2/3) + orquestador "Atlas". Colateral = concepto visual (no estaba en el back; sin contrato nuevo).
- **Added** — `backend/api.ts` (router de acción montado en `server.ts` con CORS): `POST /api/job` (cascada real on-chain reutilizando `execStep`), `POST /api/auction/run` (reutiliza `runAuction`), `GET /api/onchain/:id` (verificación `hasSkull`). El front los dispara fire-and-forget para efecto on-chain real mientras anima el grafo.
- **Changed** — `backend/auction.ts`: extraído `runAuction()` exportable (devuelve `AuctionResult`); `main()`/standalone lo llama (cambio mínimo, lógica intacta).
- **Verified** — `frontend`: `npm run build` verde (6 rutas, TS ok). Backend: `npm run typecheck` verde.
- **Next** — Ensayo de demo (3 min) + (opcional) cableo WS en vivo + deploy a Vercel.

### [FRONT-prep] — Preparación de la sesión de front
- **Changed** — Decisión: el front ahora vive en **`frontend/` dentro de este repo** (antes "repo aparte") → una sesión puede tocar front Y back, con un solo git/CHANGELOG. Motivo: los botones/elementos del front necesitan funcionalidad del back (endpoints).
- **Added** — `build/sessions/SESSION-FRONT.md`: brief autocontenido de la sesión de front (rol, FILES I OWN = `frontend/**`, qué puede tocar del back, **protocolo de cambios de backend** sin romper el loop core, pasos, DoD).
- **Changed** — `build/FRONTEND-HANDOFF.md` reescrito con la realidad actual: 3 addresses reales + verificadas, ABIs + `fixtures.events.json`, eventos de la subasta (S1), reads `tierOf`/`hasSkull`/`scores`, el aviso de `RPC_WS` vacío, y qué endpoints del back exponer para los botones.
- **Next** — Abrir `session/front` desde `main`: armar `frontend/` + integrar eventos/contratos + (si hace falta) endpoints HTTP en el back.

### [S1] — Stretch: ReverseAuction (subasta inversa ponderada por reputación)
- **Added** — `contracts/src/ReverseAuction.sol`: `openJob`/`bid`/`close`. Bid efectivo = `price·(200-score)/100` (peor reputación → más caro); `bid` de un agente con calavera **revierte** (`AgentExcluded`) — exclusión on-chain. Solo LEE ScoreRegistry + ReputationSBT (interfaces mínimas). `+ test/ReverseAuction.t.sol` (7 tests, 22/22 totales) `+ script/DeployAuction.s.sol`.
- **Added** — Deployado + verificado (Sourcify) en testnet: `ReverseAuction = 0x7ca67a992100ff9CF95f72c70c20a84A9E17b459`. ABI en `abi/ReverseAuction.json`, address en `abi/deployments.json`.
- **Added** — `backend/auction.ts` (`npm run auction`): demo en vivo — Scraper(score 10) y Analyst(score 80) pujan → Analyst gana por menor effective; Designer(calavera) → **rechazado on-chain**; close → ganador agente#2. Verificado en vivo.
- **Next** — Ensayo de demo. Opcional acoplar la subasta al front (eventos `JobOpened`/`BidPlaced`/`JobClosed`).

### [MERGE+polish] — Demo limpio: reúso, GoodPayer y race de indexación
- **Fixed** — Race de indexación en `oracle.readStats`: el log de un `recordPayment` recién minado a veces no estaba indexado cuando `postScore` lo leía → score stale (analyst posteaba 0, no minteaba GoodPayer). Ahora reintenta `getLogs` (hasta ~5s) con `minJobs=1` desde `postScore`. Verificado: `scores(2)=80` → **GoodPayer SBT minteado** (`ownerOf(2)` OK).
- **Changed** — `orchestrator.ts`: salt por corrida en los inputs (`...#${run}`) → cada demo arranca con cache limpio (1er pedido full, 2do regalía) sin redeploy. Reúso ahora se ve correcto.
- **Changed** — `agents/analyst.ts`: precio 0.12 → **700 USDC** (data del demo) para que el score cruce `GOOD_THRESHOLD=70` y se vea el GoodPayer en vivo. (Alternativa para demo 100% micropagos: bajar el umbral vía redeploy — anotado.)
- **Verified (on-chain)** — 4 beats: scraper/analyst full → recordPayment; reúso → regalía; analyst score 80 → GoodPayer SBT; designer → markDefault → Skull SBT. `ownerOf(2)` y `ownerOf(3)` confirman ambos SBT.

### [MERGE] — Integración: loop core verde on-chain
- **Changed** — Swap mock→real: `new MockReputationLayer()` → `OnchainReputationLayer.fromEnv()` en `backend/orchestrator.ts` + `backend/server.ts` (única edición de código del MERGE). `.env` (gitignored) con addresses reales de A + claves descartables (DEPLOYER/ORACLE) de `karma-A`.
- **Fixed** — `backend/oracle.ts` `readStats`: pagina `eth_getLogs` en ventanas de 100 bloques (el RPC público de Monad rechaza rangos mayores). Era el bloqueo que C anticipó.
- **Verified (on-chain, Monad testnet)** — `npm run demo`: cascada → recordPayment (TXs reales) → postScore; beat regalía (scraper 500bps); **beat calavera: designer → `markDefault` → SKULL minteado** (`backend/_merge-verify.ts` confirma `hasSkull(3)=true`, agentes 1/2 sin calavera). typecheck limpio.
- **Added** — `abi/fixtures.events.json`: 6 `PaymentRecorded` + 3 `ScoreUpdated` reales (con txHash/blockNumber) para que el front construya sin esperar al backend. `backend/_merge-verify.ts` (verificación + generador de fixtures).
- **Added** — `build/STRETCH-x402-monad.md`: nota para migrar a `@x402/*` modular (settle real en Monad vía `eip155:10143`) — solo si el loop core está verde temprano.
- **Note (prep demo)** — (1) el cache de artefactos es permanente on-chain → para una demo limpia, saltear el input por corrida o redeploy. (2) GoodPayer no se mintea con los montos actuales (score 10 < umbral 70) → subir volumen/jobs o bajar `GOOD_THRESHOLD`. El héroe (calavera) no se ve afectado.
- **Next** — Polish + ensayo de demo. Opcional S1 (`ReverseAuction`) si sobra tiempo. Front se acopla con `abi/deployments.json` + ABIs + fixtures.

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
