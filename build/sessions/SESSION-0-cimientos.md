# Sesión 0 — Cimientos (bloqueante)

> **Pegá este archivo como primer mensaje de una sesión Claude nueva.** Es autocontenido.
> **Branch:** `session/0-cimientos` → **mergear a `main` antes de abrir A/B/C.**

## Rol y misión

Sos el responsable de los **cimientos** de Karma (anillo 1): la capa de confianza de una economía de agentes en Monad testnet. Tu trabajo es crear el **scaffold del repo** y **congelar las superficies compartidas + los contratos de interfaz** para que tres sesiones (A Contratos, B Economía de agentes, C Reputación on-chain) trabajen **en paralelo sin pisarse**.

No implementás lógica de negocio: dejás el esqueleto, los tipos, la config, el cliente de cadena, la interfaz `ReputationLayer` con un **mock funcional**, y los ABIs/addresses placeholder. Después de vos, A/B/C parten de una base estable.

## Contexto del proyecto (lo mínimo)

Karma: agentes AI se contratan y pagan por-resultado vía **x402** (gasless, USDC); cada pago escribe una arista en un context graph on-chain (`ScoreRegistry`), un oráculo firma el **score**, y el que falla recibe un **SBT calavera EIP-5192 irrevocable** que lo excluye. Monad testnet chain `10143`. Detalle completo: `../plan.html`, `../../idea/karma.md`.

## FILES I OWN (creás vos)

```
package.json            tsconfig.json
.env.example
contracts/.gitkeep                      # A llenará esto
abi/
  ISCoreRegistry.json                   # ABI hand-authored (fuente de verdad para C y el front)
  IReputationSBT.json                   # ABI hand-authored del SBT
  deployments.json                      # placeholders (A escribe addresses reales)
backend/
  lib/
    env.ts                              # carga + valida env
    chain.ts                            # viem clients (public WS + wallet)
    types.ts                            # tipos compartidos
    reputation.ts                       # interfaz ReputationLayer + MockReputationLayer
  agents/.gitkeep                       # B llenará esto
```

## READ-ONLY
Nada todavía — sos el primero. Pero **lo que dejes acá queda congelado**: A/B/C no editan `backend/lib/*`, `package.json`, `.env.example` ni `abi/I*.json` sin coordinar.

---

## Contrato de interfaz — la fuente de verdad

### Superficie de contratos (A la implementa, C la consume, el front la escucha)

```
ScoreRegistry:
  recordPayment(uint256 agentId, uint256 amount, bytes32 inputHash)
    → event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer)
    → cachea Artifact(producer, uri, validUntil, royaltyBps) por inputHash
  lookup(bytes32 inputHash) view → (address producer, string uri, uint64 validUntil, uint16 royaltyBps)
  setScore(uint256 agentId, int256 value, uint256 nonce, bytes sig)   // ECDSA vs signer
    → event ScoreUpdated(uint256 indexed agentId, int256 value)
    → si value >= GOOD_THRESHOLD: sbt.mint(agentId, GoodPayer)
  markDefault(uint256 agentId) onlyOwner → sbt.mint(agentId, Skull)

ReputationSBT (EIP-5192):
  enum Tier { GoodPayer, Skull }
  locked(uint256) view → true
  mint(uint256 agentId, Tier tier)        // solo desde ScoreRegistry
  tierOf(uint256 agentId) view → Tier      // getter para el front
  hasSkull(uint256 agentId) view → bool    // getter para el front
  supportsInterface(0xb45a3c0e) → true
```

### `abi/ISCoreRegistry.json` y `abi/IReputationSBT.json`
ABIs JSON hand-authored a partir de la superficie de arriba (functions + events con sus tipos e `indexed`). **A debe hacer que el ABI real matchee estos archivos**; C y el front codean contra ellos.

### `backend/lib/reputation.ts` (interfaz que desacopla B↔C)

```ts
export type Hex = `0x${string}`;

export interface Artifact {
  producer: Hex;
  uri: string;
  validUntil: bigint;   // unix ts
  royaltyBps: number;   // 0..10000
}

export interface ReputationLayer {
  /** ¿el resultado ya existe, fresco y confiable? null si no hay reúso. */
  lookupArtifact(inputHash: Hex): Promise<Artifact | null>;
  /** registra el pago = arista del grafo + cache. Devuelve tx hash. */
  recordPayment(a: { agentId: bigint; amount: bigint; inputHash: Hex }): Promise<Hex>;
  /** el oráculo recalcula, firma y postea el score del agente. */
  postScore(agentId: bigint): Promise<Hex>;
  /** marca default → mint SBT calavera. */
  markDefault(agentId: bigint): Promise<Hex>;
}

/** Mock in-memory para que B corra sin contratos ni C. */
export class MockReputationLayer implements ReputationLayer {
  private cache = new Map<Hex, Artifact>();
  async lookupArtifact(inputHash: Hex) { return this.cache.get(inputHash) ?? null; }
  async recordPayment(a: { agentId: bigint; amount: bigint; inputHash: Hex }) {
    if (!this.cache.has(a.inputHash))
      this.cache.set(a.inputHash, { producer: ('0x' + '0'.repeat(40)) as Hex, uri: 'mock://' + a.inputHash, validUntil: 0n, royaltyBps: 500 });
    console.log('[mock] recordPayment', a);
    return ('0x' + 'ab'.repeat(32)) as Hex;
  }
  async postScore(agentId: bigint) { console.log('[mock] postScore', agentId); return ('0x' + 'cd'.repeat(32)) as Hex; }
  async markDefault(agentId: bigint) { console.log('[mock] markDefault → SKULL', agentId); return ('0x' + 'ef'.repeat(32)) as Hex; }
}
```

> C implementará `OnchainReputationLayer implements ReputationLayer` en `backend/lib/reputation.onchain.ts`. B importa solo el **tipo** `ReputationLayer` y recibe la instancia por inyección (mock ahora, real en MERGE).

### `backend/lib/chain.ts` (viem) — esqueleto

```ts
import { createPublicClient, createWalletClient, http, webSocket } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { env } from './env';

export const monadTestnet = {
  id: 10143, name: 'Monad Testnet', nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [env.RPC_HTTP], webSocket: env.RPC_WS ? [env.RPC_WS] : [] } },
} as const;

export const publicClient = createPublicClient({ chain: monadTestnet, transport: env.RPC_WS ? webSocket(env.RPC_WS) : http(env.RPC_HTTP) });
export const walletClient = (pk: Hex) => createWalletClient({ account: privateKeyToAccount(pk), chain: monadTestnet, transport: http(env.RPC_HTTP) });
```

### `.env.example`

```
CHAIN_ID=10143
RPC_HTTP=https://testnet-rpc.monad.xyz
RPC_WS=                      # wss del testnet (verificar en docs.monad.xyz)
X402_FACILITATOR=https://x402-facilitator.molandak.org
USDC=0x534b2f3A21130d7a60830c2Df862319e593943A3
ERC8004_IDENTITY=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
ERC8004_REPUTATION=0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
SCORE_REGISTRY=             # lo llena A al deployar
REPUTATION_SBT=            # lo llena A al deployar
DEPLOYER_PRIVATE_KEY=
ORACLE_PRIVATE_KEY=
GOOD_THRESHOLD=70
DEMO_SAFE=true
```

> ⚠️ **Verificar el día**: addresses ERC-8004 en `docs.monad.xyz/guides/erc-8004` (dos fuentes dieron valores distintos) y el endpoint `RPC_WS`.

### `abi/deployments.json` (placeholders)

```json
{ "chainId": 10143, "scoreRegistry": "", "reputationSBT": "", "deployedAt": "", "explorer": "https://testnet.monadexplorer.com" }
```

---

## Pasos

1. `npm init` + instalar dev deps base: `typescript`, `tsx`, `@types/node`, `viem`. (NO instalar `@x402/*` ni libs de A/B/C — eso es de cada track; vos solo dejás `viem` + TS.) Configurar `tsconfig.json` (ESM, `strict`, `moduleResolution: bundler`).
2. Crear el árbol de carpetas con `.gitkeep` donde corresponda.
3. Escribir `backend/lib/env.ts`, `chain.ts`, `types.ts`, `reputation.ts` (con `MockReputationLayer`).
4. Escribir `abi/ISCoreRegistry.json`, `abi/IReputationSBT.json`, `abi/deployments.json`, `.env.example`.
5. Smoke test: un `backend/lib/_smoke.ts` que instancia `MockReputationLayer` y llama `recordPayment` → corre con `npx tsx`. (Borralo o dejalo como ejemplo.)
6. Actualizar la sección **S0** del `../CHANGELOG.md`.
7. Commit en `session/0-cimientos`, **merge a `main`**, avisar al equipo que A/B/C pueden arrancar.

## Definition of Done

- [ ] `npm i` ok y `npx tsc --noEmit` sin errores.
- [ ] `npx tsx backend/lib/_smoke.ts` imprime los logs del mock.
- [ ] `abi/ISCoreRegistry.json` + `IReputationSBT.json` reflejan exactamente la superficie de contratos.
- [ ] `.env.example` completo; `deployments.json` con placeholders.
- [ ] Branch mergeado a `main`. CHANGELOG sección S0 actualizada.

## Qué publicás para los demás
La base congelada: `backend/lib/*` (incluida la interfaz + mock), `package.json`, `.env.example`, `abi/I*.json`. A partir de acá A/B/C arrancan.
