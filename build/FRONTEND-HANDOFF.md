# Frontend Handoff — Karma

> **Para la persona que arma el front.** Es autocontenido: asume **cero conocimiento del backend**. Acá está todo lo que necesitás para construir la UI y acoplarte cuando los contratos estén desplegados. El front vive en **tu propio repo/carpeta** (no en el del backend); te conectás leyendo la cadena + escuchando eventos.

---

## 1. Qué es Karma y qué tenés que mostrar

Karma es la **capa de confianza de una economía de agentes** en Monad: agentes AI se contratan y se pagan por-resultado on-chain, cada pago construye su reputación, y el que falla recibe un **SBT calavera irrevocable** que lo excluye.

Tu UI es **el héroe visual de la demo** (3 min, voto de audiencia). Tenés que mostrar:

1. **Grafo de agentes** (nodos = agentes, aristas = pagos) que **crece en vivo** a medida que llegan eventos.
2. **Score + badge por nodo** (buen pagador / calavera).
3. **Beat de reúso**: una arista de "regalía" (pago chico) en vez de un pago full.
4. **EL SHOWSTOPPER**: un agente recibe la **calavera** → su nodo se marca y su próximo **bid se rechaza** visiblemente.
5. **Por qué Monad**: contador de **tx/seg** + comparador de costo **"Monad vs Ethereum"**.

## 2. Stack a usar

- **Next.js + shadcn/ui + Tailwind**
- **React Flow** (`@xyflow/react`) para el grafo — `setNodes`/`setEdges` con concat por evento, layout d3-force, aristas animadas (USDC viajando).
- **viem** con **transporte WebSocket** para escuchar eventos (`watchContractEvent`).
- (Opcional) RainbowKit/wagmi si querés "connect wallet"; para la demo podés usar wallets fijas.
- Deploy: Vercel.

## 3. Red (Monad testnet)

| | Valor |
|---|---|
| Chain ID | `10143` |
| RPC HTTP | `https://testnet-rpc.monad.xyz` |
| RPC WS | *(te lo pasa el backend en `abi/deployments.json` / `.env`; verificar en `docs.monad.xyz`)* |
| Logs en vivo | **`monadLogs`** vía WebSocket — logs en estado *Proposed* (~1s antes que el estándar) |
| Explorer | `https://testnet.monadexplorer.com` |

## 4. Contrato de integración (lo que el backend te entrega)

El backend publica, al deployar:
- **`abi/deployments.json`** → addresses de los contratos + chainId + explorer.
- **ABIs reales** (`abi/ScoreRegistry.json`, `abi/ReputationSBT.json`).
- **`abi/fixtures.events.json`** → payloads de ejemplo de cada evento (para construir **antes** del deploy, ver §7).

```jsonc
// abi/deployments.json (ejemplo de shape)
{ "chainId": 10143, "scoreRegistry": "0x…", "reputationSBT": "0x…",
  "explorer": "https://testnet.monadexplorer.com" }
```

### Eventos a escuchar (shape exacto)

```solidity
// ScoreRegistry
event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer);
event ScoreUpdated(uint256 indexed agentId, int256 value);
```

- **`PaymentRecorded`** = una **arista** del grafo (pagador → agentId) + dato de un pago. `amount` chico = beat de **regalía/reúso**.
- **`ScoreUpdated`** = actualizá el **score** del nodo `agentId`.

### Cómo suscribirte (viem + WS)

```ts
import { createPublicClient, webSocket } from 'viem';
import scoreRegistryAbi from './abi/ScoreRegistry.json';
import { scoreRegistry } from './abi/deployments.json';

const client = createPublicClient({ transport: webSocket(RPC_WS) }); // 1 sola conexión

client.watchContractEvent({
  address: scoreRegistry, abi: scoreRegistryAbi, eventName: 'PaymentRecorded',
  onLogs: (logs) => logs.forEach(l => addEdge(l.args.payer, l.args.agentId, l.args.amount)),
});
client.watchContractEvent({
  address: scoreRegistry, abi: scoreRegistryAbi, eventName: 'ScoreUpdated',
  onLogs: (logs) => logs.forEach(l => setScore(l.args.agentId, l.args.value)),
});
```

### Leer el Tier (calavera / buen pagador) por nodo

```solidity
// ReputationSBT
enum Tier { GoodPayer, Skull }
function tierOf(uint256 agentId) view returns (Tier);
function hasSkull(uint256 agentId) view returns (bool);   // true = pintá la calavera + rechazá su bid
```
Tras cada `ScoreUpdated` (o `markDefault`), releé `hasSkull(agentId)`/`tierOf(agentId)` y actualizá el badge del nodo. `hasSkull == true` → marca de calavera + el bid de ese agente se muestra **rechazado**.

### Identidad / labels (ERC-8004, opcional)
Para nombrar los nodos podés leer el **IdentityRegistry** de ERC-8004 (`ERC8004_IDENTITY=0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`). Si complica, **hardcodeá labels** ("Scraper", "Analista", "Diseñador", "Orquestador") — es válido para la demo.

## 5. Qué renderizar (resumen)

- Nodos = agentes (label + score + badge Tier). Aristas = `PaymentRecorded` (animadas; regalía = arista distinta/fina).
- `setNodes/setEdges` concat por evento + d3-force layout.
- Contador **tx/seg** + panel **"Monad vs Ethereum"** (costo/latencia).
- Estado calavera: nodo marcado en rojo + bid rechazado.

## 6. Gotchas (importante)

- **1 sola conexión WebSocket** para todo (rate limits del RPC público: ~15–25 rps). No hagas polling.
- **Los eventos SON el grafo** — no necesitás storage pesado ni indexer; reconstruí el estado desde los logs.
- **`DEMO_SAFE`**: el backend puede *mockear* el settle de x402, pero **las escrituras on-chain (y por lo tanto los eventos) se emiten igual** → vos ves exactamente lo mismo. No dependas de que el pago x402 ocurra "de verdad".
- Tipos: `agentId`/`amount`/`value` son `bigint`; `inputHash` es `bytes32` (`0x…`).

## 7. Construí antes del deploy (sin bloquearte)

Mientras A/C deployan, usá **`abi/fixtures.events.json`** (lo provee la sesión MERGE) o tu propio mock: un emitter que dispara `PaymentRecorded`/`ScoreUpdated` con el shape de §4 cada X segundos. Así el grafo, los badges y el showstopper quedan listos y solo cambiás la fuente (mock → WS real) al final.

## 8. Qué NO hacés
No escribís contratos, no corrés el backend, no tocás x402/oráculo. Solo **leés la cadena + escuchás eventos** y renderizás.

## 9. Fallback de demo
3 agentes precargados (identidades fijas) + tener un **video de respaldo** del flujo por si el live falla. Coordiná con el backend quién comparte pantalla.

---

### Checklist de acople (cuando el backend deploya)
- [ ] Recibiste `abi/deployments.json` + ABIs reales + `abi/fixtures.events.json`.
- [ ] `RPC_WS` configurado; 1 conexión WS escuchando `PaymentRecorded` + `ScoreUpdated`.
- [ ] Nodos/aristas se actualizan en vivo; score + badge por nodo.
- [ ] `hasSkull` pinta calavera + rechaza bid (showstopper).
- [ ] Contador tx/seg + comparador de costo.
- [ ] Probado contra fixtures **y** contra testnet real.
