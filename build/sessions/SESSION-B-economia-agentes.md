# Sesión B — Economía de agentes (x402 + cascada)

> **Pegá este archivo como primer mensaje de una sesión Claude nueva.** Autocontenido.
> **Branch:** `session/b-agentes` (parte de `main` **después** de mergeada la Sesión 0).
> **Corre en paralelo con A y C — no dependés de ellos.** Te desacoplás con `MockReputationLayer`.

## Rol y misión

Sos el dueño de la **economía de agentes** de Karma: el server x402 (endpoint pago) + el orquestador que **contrata y paga** a agentes proveedores en cascada vía x402, consultando reúso (royalty) antes de pagar y registrando el pago tras el settle. Corrés **end-to-end contra mocks** (sin contratos ni oráculo), porque te conectás a la cadena solo a través de la interfaz `ReputationLayer`.

## FILES I OWN
```
backend/server.ts          # @x402/express · endpoint 402
backend/orchestrator.ts    # @x402/fetch · cascada + lookup + recordPayment
backend/agents/**          # agentes proveedores (scraper, analista, diseñador)
```
## READ-ONLY (no tocar)
`backend/lib/**` (de S0 — importás de acá), `backend/oracle.ts`, `backend/bridge.ts` (de C), `contracts/**` (de A), `package.json` (si necesitás `@x402/*`, instalalo, pero coordiná el commit de deps).

---

## Lo que necesitás de los cimientos (S0)

Importás **solo el tipo** `ReputationLayer` y recibís la instancia por inyección:

```ts
import type { ReputationLayer, Hex } from './lib/reputation';
import { MockReputationLayer } from './lib/reputation';

const reputation: ReputationLayer = new MockReputationLayer();  // ← MERGE lo cambia por el real
```

Interfaz (no la edites, vive en `lib/reputation.ts`):
```ts
lookupArtifact(inputHash: Hex): Promise<Artifact | null>;
recordPayment(a: { agentId: bigint; amount: bigint; inputHash: Hex }): Promise<Hex>;
postScore(agentId: bigint): Promise<Hex>;
markDefault(agentId: bigint): Promise<Hex>;
```

## Flujo a implementar

```
orquestador recibe tarea
  → para cada subtarea: inputHash = keccak256(args)
      → reputation.lookupArtifact(inputHash)
          existe y validUntil>now  → paga REGALÍA chica (royaltyBps) al productor   [beat reúso]
          no existe                → contrata agente proveedor y paga full vía x402
      → tras settle OK (o mock si DEMO_SAFE): reputation.recordPayment({agentId, amount, inputHash})
      → reputation.postScore(agentId)
  → si un agente entrega basura / no paga: reputation.markDefault(agentId)            [beat calavera]
```

## Pasos

1. `npm i @x402/core @x402/evm @x402/fetch @x402/express` (coordiná el commit de `package.json`).
2. `backend/server.ts`: server `@x402/express` con 1 endpoint protegido que devuelve **402** y, tras settle exitoso (facilitador `https://x402-facilitator.molandak.org`, USDC `0x534b2f3A21130d7a60830c2Df862319e593943A3`, `eip155:10143`), invoca `reputation.recordPayment`. Respetá `DEMO_SAFE`: si está, mockeá el settle pero **igual** llamá `recordPayment` (el grafo no depende del facilitator en vivo).
3. `backend/agents/`: 2-3 proveedores (scraper, analista, diseñador) que devuelven un artefacto (texto mock o llamada a Claude). Cada uno expone `run(input) → {uri, payloadHash}`.
4. `backend/orchestrator.ts`: cliente `@x402/fetch` que ejecuta el flujo de arriba (lookup → pagar/regalía → recordPayment → postScore), en cascada A→proveedores.
5. Caso default: una ruta/flag que dispara `reputation.markDefault(agentId)` para el beat calavera.
6. Script demo: `npx tsx backend/orchestrator.ts` corre el loop completo contra el mock e imprime las llamadas.
7. Actualizá la sección **B** del `../CHANGELOG.md`. Commit en `session/b-agentes`.

## Cómo testear aislado
Con `MockReputationLayer` + `DEMO_SAFE=true`: el orquestador corre la cascada, el mock loguea `recordPayment/postScore/markDefault`, el segundo pedido del mismo `inputHash` dispara el camino de regalía. **No necesitás contratos, oráculo ni front.**

## Definition of Done
- [ ] `npx tsx backend/orchestrator.ts` corre el loop completo contra el mock.
- [ ] Beat reúso: segundo pedido del mismo `inputHash` → paga regalía, no full.
- [ ] Beat calavera: el camino de default llama `markDefault`.
- [ ] `DEMO_SAFE` mockea el settle pero igual dispara `recordPayment`.
- [ ] Solo tocaste tus FILES I OWN. CHANGELOG sección B actualizada.

## Qué publicás
El server + orquestador + agentes, consumiendo `ReputationLayer` por inyección. En MERGE se cambia el mock por el `OnchainReputationLayer` de C — **sin tocar tu código**.
