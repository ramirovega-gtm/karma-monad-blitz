# Sesión MERGE — Integración (loop core end-to-end)

> **Pegá este archivo como primer mensaje de una sesión Claude nueva.** Autocontenido.
> **Branch:** `integration/merge` (parte de `main`, mergea `session/a-contratos` + `session/b-agentes` + `session/c-oraculo`).
> **Secuencial — corre cuando A, B y C terminaron.**

## Rol y misión

Sos el responsable de **unir todo**: traés los tres branches, conectás la economía de agentes (B) con la reputación on-chain real (C) y los contratos desplegados (A), y dejás el **loop core andando end-to-end**: pago → `recordPayment` → `PaymentRecorded` → `setScore`/`ScoreUpdated` → mint SBT. Validás los dos beats (regalía y calavera), dejás `DEMO_SAFE` operativo, precargás los agentes de fallback y publicás el set final para el front.

## El único cambio de wiring que hacés

B dejó la instancia inyectable. Vos cambiás **una línea** (no la lógica de nadie):

```ts
// backend/server.ts (y/o orchestrator.ts)
- const reputation: ReputationLayer = new MockReputationLayer();
+ import { OnchainReputationLayer } from './lib/reputation.onchain';
+ const reputation: ReputationLayer = new OnchainReputationLayer(env.SCORE_REGISTRY as Hex, env.ORACLE_PRIVATE_KEY as Hex);
```

## Pasos

1. Mergeá `a` + `b` + `c` en `integration/merge`. Resolvé conflictos de `package.json`/`CHANGELOG` (cada track editó su sección → debería ser limpio).
2. Cargá `.env` real desde `abi/deployments.json` (addresses que dejó A): `SCORE_REGISTRY`, `REPUTATION_SBT`.
3. Reemplazá `MockReputationLayer` → `OnchainReputationLayer` (la línea de arriba).
4. Corré el **loop core** con `DEMO_SAFE=true` primero (settle mockeado, escrituras reales) → verificá en `testnet.monadexplorer.com`: `PaymentRecorded`, `ScoreUpdated`, mint de SBT.
5. Validá **beat regalía**: segundo pedido del mismo `inputHash` → camino de royalty (no full price).
6. Validá **beat calavera**: `markDefault(agentId)` → `hasSkull(agentId)==true` en el explorer + (si el stretch ReverseAuction existe) bid revierte.
7. Probá con `DEMO_SAFE=false` (settle real vía facilitador) si el x402 está estable; si falla en vivo, quedáte con `DEMO_SAFE=true` para la demo.
8. **Para el front**: confirmá `abi/deployments.json` + ABIs reales, y generá `abi/fixtures.events.json` con payloads de ejemplo de `PaymentRecorded`/`ScoreUpdated` (capturados del loop). Avisá a quien hace el front (ver `../FRONTEND-HANDOFF.md`).
9. Precargá 3 agentes de fallback (wallets/identidades fijas) por si el loop live falla.
10. Actualizá la sección **MERGE** del `../CHANGELOG.md` + el bloque "📍 Estado actual".

## Definition of Done
- [ ] Loop core end-to-end verificable por explorer (pago→evento→score→SBT) sin el front.
- [ ] Beat regalía y beat calavera funcionando.
- [ ] `DEMO_SAFE` operativo (settle mockeable, escrituras reales igual).
- [ ] `abi/deployments.json` + ABIs + `abi/fixtures.events.json` publicados para el front.
- [ ] 3 agentes de fallback precargados. CHANGELOG MERGE + estado actualizados.

## Checklist de demo (3 min — héroe = calavera)
1. Problema + grafo con agentes (identidad ERC-8004).
2. Orquestador paga 2-3 agentes vía x402 → grafo crece, scores suben, GoodPayer SBT.
3. Beat regalía: reúso → paga regalía chica.
4. **Showstopper:** `markDefault` → SBT calavera en el nodo → bid rechazado on-chain (abrir identidad en el explorer).
5. Por qué Monad + cierre.

## Plan B
- x402 falla → `DEMO_SAFE=true` (escrituras igual disparan el grafo).
- Loop no cierra → 3 agentes precargados + mostrar eventos/SBT por explorer.
- Front no acopla a tiempo → demo del loop core por el explorer + video de respaldo.
