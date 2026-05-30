# Sesión C — Reputación on-chain (oráculo + puente)

> **Pegá este archivo como primer mensaje de una sesión Claude nueva.** Autocontenido.
> **Branch:** `session/c-oraculo` (parte de `main` **después** de mergeada la Sesión 0).
> **Corre en paralelo con A y B — no dependés de ellos.** Codeás contra el ABI hand-authored (`abi/ISCoreRegistry.json`); testeás contra anvil-fork/testnet.

## Rol y misión

Sos el dueño de la **capa de reputación on-chain**: el **puente** que tras un pago escribe en `ScoreRegistry` (`recordPayment`/`lookup`), el **oráculo firmante** que recalcula y postea el score (`setScore` con firma ECDSA), y la marca de default (`markDefault` → SBT calavera). Tu entregable principal es **`OnchainReputationLayer implements ReputationLayer`**: la implementación real que en MERGE reemplaza al mock que usa B.

## FILES I OWN
```
backend/lib/reputation.onchain.ts   # OnchainReputationLayer implements ReputationLayer
backend/oracle.ts                   # fórmula + firma ECDSA + postear setScore
backend/bridge.ts                   # helpers de escritura/lectura a ScoreRegistry (viem)
```
## READ-ONLY (no tocar)
`backend/lib/reputation.ts` (la interfaz + mock de S0 — la **implementás**, no la editás), `backend/lib/chain.ts`/`env.ts`/`types.ts`, `backend/server.ts`/`orchestrator.ts`/`agents/**` (de B), `contracts/**` (de A). Tu spec es `abi/ISCoreRegistry.json` / `IReputationSBT.json`.

---

## Interfaz a implementar (de `lib/reputation.ts`, S0)

```ts
export interface ReputationLayer {
  lookupArtifact(inputHash: Hex): Promise<Artifact | null>;
  recordPayment(a: { agentId: bigint; amount: bigint; inputHash: Hex }): Promise<Hex>;
  postScore(agentId: bigint): Promise<Hex>;
  markDefault(agentId: bigint): Promise<Hex>;
}
```

Implementá `backend/lib/reputation.onchain.ts`:

```ts
import type { ReputationLayer, Artifact, Hex } from './reputation';
import { publicClient, walletClient } from './chain';
import scoreRegistryAbi from '../../abi/ISCoreRegistry.json';   // matchea el contrato real de A

export class OnchainReputationLayer implements ReputationLayer {
  constructor(private addr: Hex, private oracleKey: Hex) {}
  async lookupArtifact(inputHash: Hex) { /* publicClient.readContract lookup → Artifact|null */ }
  async recordPayment(a) { /* walletClient.writeContract recordPayment → tx hash */ }
  async postScore(agentId) { /* oracle.ts: calcula score, firma, writeContract setScore */ }
  async markDefault(agentId) { /* writeContract markDefault (owner) → mint Skull */ }
}
```

## Oráculo (`oracle.ts`)
- Fórmula fija demo: `score = min(100, jobs*10 + volUSDC/10)`.
- Firma ECDSA del payload `(agentId, value, nonce)` con `ORACLE_PRIVATE_KEY` (viem `signMessage`/`signTypedData`, alineado a cómo `setScore` verifica en el contrato — **coordiná el esquema de firma con la spec de A**: OZ ECDSA + MessageHashUtils).
- Postea `setScore(agentId, value, nonce, sig)`.

## Pasos

1. Leé `abi/ISCoreRegistry.json` / `IReputationSBT.json` (tu spec). Confirmá el esquema de firma con la spec de Sesión A (`SESSION-A-contratos.md`).
2. `backend/bridge.ts`: helpers viem `read`/`write` para `recordPayment`, `lookup`, `setScore`, `markDefault` usando `publicClient`/`walletClient` de `lib/chain.ts`.
3. `backend/oracle.ts`: fórmula + firma + post de `setScore`.
4. `backend/lib/reputation.onchain.ts`: `OnchainReputationLayer` que orquesta lo anterior.
5. Tests: contra **anvil fork** de Monad o directo en testnet con contratos de prueba — `recordPayment`→`PaymentRecorded`, `setScore`→`ScoreUpdated` (firma válida/ inválida), `markDefault`→ SBT Skull (`hasSkull==true`).
6. Si A todavía no deployó: usá addresses placeholder + un mock local del contrato (anvil) para validar el shape. El wiring de addresses reales lo hace MERGE.
7. Actualizá la sección **C** del `../CHANGELOG.md`. Commit en `session/c-oraculo`.

## Cómo testear aislado
Anvil fork (`anvil --fork-url https://testnet-rpc.monad.xyz`) + deploy local de los contratos (o los de A si ya están). No necesitás server x402 ni front: invocás `OnchainReputationLayer` directo desde un script.

## Definition of Done
- [ ] `OnchainReputationLayer` implementa las 4 funciones contra el ABI real.
- [ ] `recordPayment` emite `PaymentRecorded`; `setScore` (firma válida) emite `ScoreUpdated`; firma inválida revierte.
- [ ] `markDefault` mintea Skull (`hasSkull(agentId)==true`).
- [ ] Esquema de firma alineado con el contrato de A.
- [ ] Solo tocaste tus FILES I OWN. CHANGELOG sección C actualizada.

## Qué publicás
`OnchainReputationLayer` → en MERGE se inyecta en el server de B en lugar del `MockReputationLayer`. La firma del oráculo y los eventos que emitís son lo que el **front** escucha.
