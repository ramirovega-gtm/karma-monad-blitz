# Stretch — x402 settle REAL en Monad (`@x402/*` modular)

> **Estado:** nota para un stretch opcional. **NO es del scope del día.** Intentar SOLO si el loop core está verde temprano (post-MERGE). Si no, el demo corre en `DEMO_SAFE=true` y listo — el héroe (calavera) y el loop on-chain no dependen de esto.

## Por qué existe esta nota

La Sesión B descubrió que el paquete **monolítico** que instaló (`x402` / `x402-express` / `x402-fetch`) tiene un enum de redes fijo {base, avalanche, polygon, sei, solana…} **sin Monad (10143)** → no settlea en Monad. Por eso quedó en `DEMO_SAFE` (settle mockeado, `recordPayment` real igual).

Pero el **SDK modular `@x402/*`** (lo que pedía el kickoff original) NO gatea por enum: usa identificadores **CAIP-2 `eip155:<chainId>`** + un facilitador configurable. O sea, se puede targetear `eip155:10143` directamente apuntando al facilitador oficial de Monad. (Fuente: docs de `@x402/core` vía Context7, 2026.)

## Precondición — verificar ANTES de migrar (1 comando)

Confirmar que el facilitador de Monad anuncia la red. Desde una terminal real (WebFetch lo bloquea un WAF):

```powershell
curl.exe -H "Accept: application/json" https://x402-facilitator.molandak.org/supported
```

- Si en `kinds` aparece `{ "scheme": "exact", "network": "eip155:10143" }` → **el settle real es viable**, seguí con la migración.
- Si no aparece → quedate en `DEMO_SAFE`. Fin.

## Migración (si la precondición pasa)

### 1. Paquetes
```powershell
npm remove x402 x402-express x402-fetch
npm i @x402/core @x402/evm @x402/express @x402/fetch
```

### 2. Server (resource server con facilitador + red custom)
Reemplaza el `paymentMiddleware` monolítico en `backend/server.ts`:
```ts
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware } from "@x402/express";

const facilitator = new HTTPFacilitatorClient({ url: process.env.X402_FACILITATOR! }); // molandak.org
const resourceServer = new x402ResourceServer(facilitator)
  .register("eip155:*", new ExactEvmScheme());   // wildcard EVM → cubre eip155:10143

const routes = {
  "POST /work": {
    accepts: [{
      scheme: "exact",
      price: "$0.001",
      network: "eip155:10143",        // ← Monad testnet (CAIP-2)
      payTo: process.env.PAY_TO!,     // address del proveedor
    }],
  },
};

app.use(paymentMiddleware(routes, resourceServer /*, paywallConfig*/));
```

### 3. Cliente (orquestador que paga)
`backend/orchestrator.ts`: cambiar el `wrapFetchWithPayment` monolítico por el de `@x402/fetch` con un signer EVM (viem account de `lib/chain`). **Verificar la firma exacta del import/API con Context7 el día** (`resolve-library-id` → `/coinbase/x402` → `query-docs` "client wrapFetchWithPayment evm signer @x402/fetch"), porque la API del cliente modular no la confirmé acá.

### 4. Lo que NO cambia
- El puente pago→grafo: tras settle OK se sigue llamando `reputation.recordPayment(...)` — **el swap mock→`OnchainReputationLayer` del MERGE es independiente de esto.**
- `DEMO_SAFE`: mantener el flag. Si el live falla, `DEMO_SAFE=true` y el grafo dispara igual. Es el rollback inmediato.
- USDC testnet `0x534b2f3A21130d7a60830c2Df862319e593943A3`, gasless (EIP-3009) — el agente firma, el facilitador paga gas.

## Criterio de decisión (regla del reloj)
- Loop core verde **antes de las 15:00** + `/supported` lista `eip155:10143` → vale el intento (timeboxear 30 min).
- Cualquier fricción → volver a `DEMO_SAFE` sin culpa. El jurado premia que ande, no el purismo (anti-pattern #7).

## Rollback
`git checkout backend/server.ts backend/orchestrator.ts package.json` + `npm i` → vuelve al estado DEMO_SAFE de B.
