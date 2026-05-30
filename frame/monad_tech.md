---
id: monad_tech
type: frame
tags: [frame, monad, tech, constraints]
related: [[evaluation_frame]], [[anti_patterns]], [[CLAUDE]], [[2026-05-30_research_monad-tech-y-hackathon-landscape]], [[2026-05-30_research_cycle-02-finalistas-002-y-001]], [[2026-05-30_research_cycle-03-context-graph]]
status: Canonical
last_updated: 2026-05-30
---

# Monad — qué es palanca real

> Verificado en research cycle #1 ([[2026-05-30_research_monad-tech-y-hackathon-landscape]], 2026-05-30) contra fuentes oficiales (docs.monad.xyz, monad.xyz, hackathon.monad.xyz) + secundarias. Regla del espacio: cada afirmación con fuente; lo no confirmado se marca `[verificar]`. Ver [[CLAUDE]].

## Qué es Monad

**Layer 1 EVM-compatible (bytecode)** de alto rendimiento. Mainnet live desde **2025-11-24**. Lo que desbloquea no es "otra EVM" — es que **costo y latencia por transacción dejan de ser el cuello de botella**.

- **Specs oficiales:** ~**10.000 TPS**, **sub-second finality** (el sitio de marketing dice "400ms block / 800ms finality"; docs/coingecko dicen **~1s block** — usar "sub-second" como número defendible en el pitch), gas testnet **~$0.004-0.007**. — monad.xyz, coingecko, blockworks.
- ⚠️ **Monad cobra por gas LIMIT, no por gas usado** (`gas_paid = gas_limit × price`). Base fee mínimo **100 MON-gwei**, block gas limit 200M. → en apps de alta frecuencia, **hardcodear un gas limit ajustado** (no usar `eth_estimateGas` holgado). — docs.monad.xyz/developer-essentials/gas-pricing.
- **Arquitectura:** Optimistic Parallel Execution (ejecuta tx concurrentemente y reconcilia → resultado idéntico a ejecución serial) + **MonadDB** (storage Merkleizado para acceso paralelo en SSD) + pipelining + consenso BFT.
- **Compatibilidad:** Solidity/Vyper sin reescribir; tooling Ethereum estándar apunta al RPC de Monad.

## Datos de red (verificado — docs.monad.xyz)

| | Mainnet | Testnet |
|---|---------|---------|
| Chain ID | **143** | **10143** |
| RPC | `https://rpc.monad.xyz` (y otros providers) | `https://testnet-rpc.monad.xyz` |
| Símbolo | MON | MON |
| Explorer | `monadscan.com` / `monadvision.com` | `testnet.monadexplorer.com` |
| Verificación contratos | Sourcify (`sourcify-api-monad.blockvision.org`) | ídem |

## Stack para buildability (verificado — Context7 sobre docs oficiales)

Stack **100% estándar-EVM** — la palanca es la red, no aprender toolchain nuevo:

- **Contratos:** Solidity + **Foundry** (template oficial `monad-developers/foundry-monad`; `foundry.toml` con `eth-rpc-url` + `chain_id = 10143`). Alternativa: Hardhat (`@nomicfoundation/hardhat-toolbox-viem`).
- **Front:** React/Next + **viem/wagmi** + RainbowKit/ConnectKit. **Scaffold-ETH** soportado (`yarn deploy --network monadTestnet`).
- **Verificación:** Sourcify (NO Etherscan — `etherscan: { enabled: false }`).
- **Faucet/RPC:** testnet faucet vía developer portal; gas testnet despreciable.

## Building blocks verificados (research cycle #2)

Para los finalistas — ver [[2026-05-30_research_cycle-02-finalistas-002-y-001]]:

- **Pagos de agentes (x402):** facilitador oficial Monad `x402-facilitator.molandak.org`, **gasless** (agente firma EIP-3009, facilitator paga gas), paga **USDC** testnet `0x534b2f3A21130d7a60830c2Df862319e593943A3`. Packages `@x402/*` (TS) / `x402` (Python). NO hace falta ERC-4337/7702 para esto.
- **Ráfagas de tx (high-frequency):** patrón oficial (blog 2048) → nonce local en `useRef` (++ antes de firmar) + `eth_sendRawTransaction` directo (sin simulación) + `Promise.all` + gas hardcodeado. Privy embedded wallet = auto-sign sin popups.
- **Lectura en tiempo real:** WebSocket `eth_subscribe` con `monadLogs` (logs en estado `Proposed`, ~1s antes que estándar). 1 conexión, no choca rate-limit.
- **RPC público rate limits:** QuickNode `rpc.monad.xyz` 25 rps / Alchemy `rpc1.monad.xyz` 15 rps; `eth_getLogs` range 100-1000 bloques según provider. Para writes en ráfaga → endpoint dedicado o batch on-chain.
- **Identidad/reputación de agentes on-chain (ERC-8004):** registries **ya desplegados en Monad** — Identity `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, Reputation `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` (Validation "coming soon"). SDK `agent0`. Es la capa de contexto/trust on-chain del stack agentic web. — docs.monad.xyz/guides/erc-8004.
- **Context graph (visualización en vivo):** **React Flow** (`@xyflow/react`) con `setNodes/setEdges concat` por evento + arista animada (`<animateMotion>` SVG) + d3-force layout. Alimentar con `monadLogs`. Para el demo, el grafo vive en los **eventos** del contrato, NO en storage pesado (off-chain Graphiti/embeddings = over-engineering). Ver [[2026-05-30_research_cycle-03-context-graph]].
- **Templates de arranque:** `monad-developers/scaffold-monad-foundry` (Next+RainbowKit+Wagmi+Viem+burner+faucet) / `foundry-monad`.

## Dónde está el Monad-leverage real (eje 1 del frame)

Una idea tiene leverage genuino si **muere a alto gas / block time lento en otra EVM y revive con 10k TPS + ~$0.005 gas + 400ms**. Zonas calientes (alineadas con lo que Monad premia en hackatones 2026 — ver [[2026-05-30_research_monad-tech-y-hackathon-landscape]]):

- **Agentes AI que transaccionan on-chain** a alta frecuencia (firma muchas tx, costo por acción ínfimo) — el foco #1 de Monad 2026.
- **Pagos / micropagos agent-to-agent** y agent-native payments.
- **Intelligent markets / order books on-chain** que en Ethereum serían prohibitivos por gas.
- **On-chain games / wagering** en tiempo casi-real (block time 400ms).
- **Micro-transacciones masivas** consumer/social que a $X de gas no cierran en otra chain.

Si una idea NO cae en "esto solo cierra cuando las tx son baratas+rápidas+paralelas a escala", su leverage es débil — flag eje 1.

## Hackatón target (confirmado)

- **Monad Blitz Buenos Aires** — mini-hackatón **IRL de 1 DÍA** ("hands-on con el parallel EVM, ship fast"), misma metodología que la edición Medellín. — developers.monad.xyz/events, Luma.
- **Restricción dura de scope:** lo construido tiene que estar **demo-able en ~1 jornada presencial** (≈8h). Esto domina el eje 2 (buildability) del frame: una idea se recorta a **1 feature con wow inmediato**, no arquitectura ambiciosa.
- **Fecha confirmada (brief del compañero):** **2026-05-30**. Submission **17:35**, demo en vivo **18:00**. Build útil ~7h (10:45→17:35). Voto de audiencia.

## Related

- [[evaluation_frame]]
- [[anti_patterns]]
- [[CLAUDE]]
- [[2026-05-30_research_monad-tech-y-hackathon-landscape]]

---

**Status:** Canonical
**Last Updated:** 2026-05-30
