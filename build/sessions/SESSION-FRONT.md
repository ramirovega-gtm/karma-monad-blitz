# Sesión FRONT — armar + integrar el front (puede tocar el back)

> **Pegá este archivo como primer mensaje de la sesión nueva.** Autocontenido.
> **Branch:** `session/front` (parte de `main`, que ya tiene backend + contratos + S1 mergeados).
> **Esta sesión SÍ puede editar el backend** (a diferencia de A/B/C) — los botones del front suelen necesitar endpoints nuevos. Protocolo abajo.

## Rol y misión

Construís el **front de Karma** en `frontend/` (Next + shadcn + React Flow + viem) y lo integrás con los contratos ya desplegados en Monad testnet. Mostrás el grafo de la economía de agentes creciendo en vivo, los scores/SBT por nodo, la subasta, y **el showstopper: la calavera excluyendo a un agente**. Si un botón/elemento del front necesita una funcionalidad que hoy no está expuesta (ej. disparar un job, abrir una subasta), **agregás el endpoint en el backend** acá mismo.

**Toda la info de integración (addresses, ABIs, eventos, reads, gotchas) está en [`../FRONTEND-HANDOFF.md`](../FRONTEND-HANDOFF.md). Leelo primero — es la fuente de verdad.**

## Estado del backend (ya hecho, NO reconstruir)

- 3 contratos deployados + verificados (Sourcify): ScoreRegistry, ReputationSBT, ReverseAuction. Addresses en `abi/deployments.json`.
- Loop core on-chain verde: cascada x402 → recordPayment → score → GoodPayer/Skull SBT; reúso → regalía; subasta con bid-weighting + exclusión de calavera.
- ABIs reales + `abi/fixtures.events.json` (eventos de ejemplo) listos para el front.
- Backend corre con `npm run server` (x402 + admin), `npm run demo`, `npm run auction`.

## FILES I OWN
```
frontend/**          # la app Next (la creás vos)
```
## Puedo TOCAR (con cuidado — ver protocolo)
```
backend/server.ts            # agregar endpoints HTTP para los botones del front
backend/ (router nuevo)      # si conviene separar, p.ej. backend/api.ts
package.json                 # deps del front si las instalás en la raíz, o usar frontend/package.json propio
abi/                         # solo LEER (no regenerar)
```
## NO tocar
```
contracts/**                 # los contratos están deployados y verificados — congelados
backend/lib/reputation*.ts   # la interfaz ReputationLayer y su impl on-chain — estables
backend/oracle.ts, bridge.ts # la firma y el puente ya alineados con los contratos
```

## Protocolo para cambios de backend (importante)

El back y los contratos ya funcionan. Si el front necesita una capacidad nueva:
1. **Preferí exponer, no reescribir.** Lo más común: `demo`/`auction` son scripts CLI; envolvé esos flujos en **endpoints HTTP** (`POST /api/job`, `POST /api/auction/open|bid|close`, `POST /admin/markDefault/:id`) reutilizando `OnchainReputationLayer`, `orchestrator.ts` y `auction.ts` — sin cambiar su lógica.
2. **Mantené estable la interfaz `ReputationLayer`** y la firma del oráculo (están alineadas con los contratos on-chain).
3. **No rompas el loop core.** Después de cualquier cambio de back: corré `npm run demo` y `npm run auction` y confirmá que siguen verdes + `npm run typecheck`.
4. Si necesitás un cambio de **contrato**, NO redeployes a la ligera (cambia addresses + rompe el front y los fixtures). Primero validá si se puede resolver off-chain o leyendo distinto. Si es inevitable, coordiná y actualizá `deployments.json` + ABIs + fixtures + handoff.

## Pasos sugeridos

1. `git switch -c session/front` (desde `main`).
2. `RPC_WS` ya está resuelto en `.env`: `wss://testnet-rpc.monad.xyz` (público, probado). Si se pone lento en la demo → provider dedicado o polling `getLogs`.
3. `frontend/`: `npx create-next-app` + shadcn + `@xyflow/react` + viem. Importar ABIs/addresses de `../abi/`.
4. **Construí contra fixtures primero** (`abi/fixtures.events.json`): grafo, nodos/aristas, score+badge por nodo, panel de costo, showstopper. Sin bloquearte por el WS.
5. Conectar en vivo: `watchContractEvent` (WS) sobre `PaymentRecorded`/`ScoreUpdated` + `JobOpened`/`BidPlaced`/`JobClosed`. Reads `tierOf`/`hasSkull`/`scores` por nodo.
6. Botones de demo: si querés disparar el flujo desde la UI, agregá los endpoints HTTP en el back (ver protocolo) y conectalos. Si no, corré `npm run demo`/`npm run auction` en paralelo y el front escucha los eventos.
7. Ensayo de la demo (3 min) + 3 agentes precargados de fallback (IDs 1/2/3 ya tienen estado on-chain) + screenshots/video de respaldo.
8. Actualizar el bloque **FRONT** del `../CHANGELOG.md` + estado actual. Commit en `session/front` → merge a `main`. Deploy a Vercel.

## Definition of Done
- [ ] `frontend/` corre (`npm run dev`) y renderiza el grafo.
- [ ] Eventos en vivo (o fixtures) → nodos/aristas se actualizan; score + badge por nodo.
- [ ] `hasSkull` pinta la calavera; subasta muestra bid rechazado del agente excluido.
- [ ] Contador tx/seg + comparador de costo.
- [ ] Si se tocó el back: `npm run demo` + `npm run auction` + `typecheck` siguen verdes.
- [ ] CHANGELOG bloque FRONT + estado actualizados. Deploy a Vercel (opcional pero recomendado).

## Demo (3 min — héroe = calavera)
Problema → cascada paga agentes (grafo crece, scores suben, GoodPayer) → reúso/regalía → **markDefault → calavera en el nodo + bid rechazado en la subasta** → por qué Monad + cierre.
