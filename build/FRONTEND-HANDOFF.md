# Frontend Handoff — Karma

> **Estado:** el backend + contratos están **completos, deployados y verificados en Monad testnet**, con el loop core andando on-chain. Este doc es la fuente de verdad para construir el front. **El front vive en `frontend/` dentro de ESTE repo** (decidido) → una sola sesión puede tocar front y back. La sesión dedicada: [`sessions/SESSION-FRONT.md`](sessions/SESSION-FRONT.md).

---

## 1. Qué es Karma y qué hay que mostrar

Karma es la **capa de confianza de una economía de agentes** en Monad: los agentes se contratan y pagan por-resultado on-chain, cada pago construye reputación, y el que falla recibe un **SBT calavera irrevocable** que lo excluye del mercado.

La UI es **el héroe visual de la demo** (3 min, voto de audiencia). Beats a mostrar:

1. **Grafo de agentes** (nodos = agentes, aristas = pagos) que **crece en vivo** con los eventos.
2. **Score + badge por nodo** (GoodPayer / calavera).
3. **Beat de reúso**: una arista de "regalía" (pago chico) en vez de full.
4. **EL SHOWSTOPPER**: un agente recibe la **calavera** → su nodo se marca; y en la **subasta** su bid es **rechazado on-chain**.
5. **Por qué Monad**: contador de tx/seg + comparador de costo "Monad vs Ethereum".

## 2. Lo que YA está hecho (backend + contratos)

**3 contratos deployados y verificados (Sourcify) en Monad testnet (chain `10143`):**

| Contrato | Address |
|---|---|
| ScoreRegistry | `0x9402BA73EA2d51F62BAe071D98DD3ce878d8966C` |
| ReputationSBT | `0x75da3A887c9384d3805b630eF961Aed91892a3aE` |
| ReverseAuction (S1) | `0x7ca67a992100ff9CF95f72c70c20a84A9E17b459` |
| signer (oráculo) | `0xeF7B39eb437a5D783C29Bf7a8e9a11aA01836647` |

**Loop core validado on-chain:** cascada x402 → `recordPayment` → `setScore` → GoodPayer SBT; reúso → regalía; default → 💀 Skull SBT. **Subasta (S1)**: bid-weighting por reputación + bid de calavera revierte.

**Artefactos para el front (en `abi/`):**
- `deployments.json` — las 3 addresses + chainId + explorer.
- `ScoreRegistry.json`, `ReputationSBT.json`, `ReverseAuction.json` — ABIs reales.
- `fixtures.events.json` — payloads reales de `PaymentRecorded` + `ScoreUpdated` (para construir sin backend corriendo).

## 3. Stack del front

Next.js + shadcn/ui + Tailwind + **React Flow** (`@xyflow/react`) + **viem** (transporte WebSocket). Deploy: Vercel. (RainbowKit/wagmi opcional; para la demo alcanzan wallets/IDs fijos.)

## 4. Red

| | Valor |
|---|---|
| Chain ID | `10143` |
| RPC HTTP | `https://testnet-rpc.monad.xyz` |
| RPC WS | ⚠️ **`RPC_WS` está vacío en `.env`** — conseguir un endpoint `wss` de Monad testnet (`monadLogs`) para `watchContractEvent`. Fallback: polling de `getLogs` (rango ≤100 bloques). |
| Explorer | `https://testnet.monadexplorer.com` |

## 5. Contrato de integración

### Eventos a escuchar (shape exacto)

```solidity
// ScoreRegistry
event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer);
event ScoreUpdated(uint256 indexed agentId, int256 value);
// ReverseAuction (S1)
event JobOpened(bytes32 indexed jobId, uint256 budget);
event BidPlaced(bytes32 indexed jobId, uint256 indexed agentId, uint256 price, uint256 effective);
event JobClosed(bytes32 indexed jobId, uint256 indexed winner, uint256 price, uint256 effective);
```

- `PaymentRecorded` = arista del grafo (`payer` → `agentId`); `amount` chico = regalía/reúso.
- `ScoreUpdated` = actualizar score del nodo.
- `BidPlaced`/`JobClosed` = visualizar la subasta; un agente con calavera **no** emite `BidPlaced` (su bid revierte).

### Reads por nodo

```solidity
// ReputationSBT
function tierOf(uint256 agentId) view returns (uint8);   // 0=GoodPayer, 1=Skull
function hasSkull(uint256 agentId) view returns (bool);   // true → pintar calavera + bid rechazado
// ScoreRegistry
function scores(uint256 agentId) view returns (int256 value, uint64 updatedAt, uint64 jobs);
function lookup(bytes32 inputHash) view returns (address producer, string uri, uint64 validUntil, uint16 royaltyBps);
```

### Suscripción (viem + WS)

```ts
import { createPublicClient, webSocket } from 'viem';
import scoreRegistryAbi from '@/abi/ScoreRegistry.json';
import { scoreRegistry } from '@/abi/deployments.json';

const client = createPublicClient({ transport: webSocket(RPC_WS) }); // 1 sola conexión
client.watchContractEvent({ address: scoreRegistry, abi: scoreRegistryAbi, eventName: 'PaymentRecorded',
  onLogs: (logs) => logs.forEach(l => addEdge(l.args.payer, l.args.agentId, l.args.amount)) });
```

## 6. Backend que el front puede disparar (acá mismo, en este repo)

El backend (Node/TS) ya corre el loop on-chain real. Entrypoints actuales:

| Cómo | Qué hace |
|---|---|
| `npm run server` (puerto 4021) | Server x402: `POST /x402/agents/:kind` (pago → `recordPayment`), `POST /admin/markDefault/:agentId` (dispara la calavera), `GET /health` |
| `npm run demo` | Corre la cascada completa (3 beats) on-chain |
| `npm run auction` | Corre la subasta S1 on-chain (incluye el bid de calavera que revierte) |

⚠️ **Probable cambio de back en esta sesión:** `demo` y `auction` son **scripts CLI**, no endpoints HTTP. Si el front necesita **botones** que disparen "abrir job", "contratar agente", "markDefault", "abrir/pujar/cerrar subasta", hay que **exponer esos flujos como endpoints HTTP** en `backend/server.ts` (o un router nuevo) para que el front los llame. Esto es esperado y permitido (ver el protocolo en `SESSION-FRONT.md`). Regla: **no romper el loop core** — tras tocar el back, correr `npm run demo` y `npm run auction` para confirmar que siguen verdes, y mantener estable la interfaz `ReputationLayer`.

## 7. Qué renderizar
Nodos = agentes (label + score + badge Tier). Aristas = `PaymentRecorded` (animadas; regalía = arista fina/distinta) + `BidPlaced` en la subasta. `setNodes/setEdges` concat + d3-force. Contador tx/seg + panel "Monad vs Ethereum". Showstopper: nodo en rojo (calavera) + bid rechazado.

## 8. Gotchas
- **1 sola conexión WebSocket** (rate limits del RPC público ~15-25 rps); no polling agresivo.
- **Los eventos SON el grafo** — reconstruí el estado desde los logs, sin storage pesado/indexer.
- **`DEMO_SAFE=true`**: el settle de x402 se simula (x402 no soporta Monad en la lib actual — ver `STRETCH-x402-monad.md`), pero **las escrituras on-chain y los eventos son reales** → el front ve exactamente lo mismo.
- `getLogs` está limitado a **100 bloques** por request en el RPC público → paginar (el backend ya lo hace en el oráculo).
- Tipos: `agentId`/`amount`/`value`/`price`/`effective` son `bigint`; `inputHash`/`jobId` son `bytes32`.

## 9. Construí sin bloquearte
Usá `abi/fixtures.events.json` (eventos reales capturados) o un mock emitter con el shape de §5 → el grafo, badges, showstopper y subasta quedan listos; al final cambiás la fuente (mock → WS real).

## 10. Cómo arrancar (en este repo)
1. `.env` ya tiene addresses + claves descartables (gitignored). El front solo necesita addresses públicas; el back usa las claves.
2. `npm install` (en la raíz) · `npm run server` levanta el backend on-chain.
3. Crear `frontend/` (`npx create-next-app`) + shadcn + `@xyflow/react` + viem; importar ABIs de `../abi/`.
4. Conseguir `RPC_WS` (wss de Monad testnet) para eventos en vivo.

## 11. Fallback de demo
3 agentes precargados (IDs 1=scraper, 2=analyst GoodPayer, 3=designer Skull — ya tienen estado on-chain) + video de respaldo. Coordinar quién comparte pantalla.
