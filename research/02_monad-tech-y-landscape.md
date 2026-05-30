---
id: 2026-05-30_research_monad-tech-y-hackathon-landscape
type: signal
date: 2026-05-30
source: docs.monad.xyz + monad.xyz + hackathon.monad.xyz + phemex + everstake + coingecko + luma (ver fuentes)
status: processed
related: [[monad_tech]], [[evaluation_frame]], [[workflow]]
---

# Research cycle #1 — Monad tech + landscape de hackatones (verificación)

Cycle de verificación de los `[verificar]` de [[monad_tech]]. Fuentes primarias (docs/sitios oficiales de Monad) + secundarias de calidad.

## 1. Red y specs (verificado, fuentes oficiales)

- **Mainnet live desde 2025-11-24.** Chain ID **143**, símbolo **MON**, RPC público `https://rpc.monad.xyz` (entre otros providers), explorers `monadscan.com` / `monadvision.com`. Versión actual MONAD_NINE. — docs.monad.xyz network-information.
- **Testnet** live desde feb-2025. Chain ID **10143**, RPC `https://testnet-rpc.monad.xyz`, explorer `testnet.monadexplorer.com`. — docs.monad.xyz / Context7.
- **Specs comunicadas oficialmente:** ~**10.000 TPS**, **~400ms block time**, **~800ms finality (single-slot)**, gas testnet **~$0.004-0.007**. — monad.xyz, coingecko, blockworks.
- **Arquitectura:** Optimistic Parallel Execution (ejecuta tx en paralelo y reconcilia para garantizar resultado == ejecución serial) + **MonadDB** (storage Merkleizado tuneado para SSD/acceso paralelo) + pipelining + consenso BFT. EVM **bytecode-compatible** (Solidity sin reescribir). — coingecko, rango, docs.
- Levantó ~$188M (rondas previas a mainnet). — medium/coinmonks [secundaria].

## 2. Tooling (verificado, Context7 sobre docs oficiales)

- **Foundry:** template oficial `monad-developers/foundry-monad`. `foundry.toml` → `eth-rpc-url="https://testnet-rpc.monad.xyz"`, `chain_id = 10143`. Verificación de contratos vía **Sourcify** (`https://sourcify-api-monad.blockvision.org`), NO Etherscan.
- **Hardhat:** `@nomicfoundation/hardhat-toolbox-viem`, network `monadTestnet` con mismo RPC/chainId, sourcify enabled.
- **Scaffold-ETH** soportado (`yarn deploy --network monadTestnet`). viem/wagmi/RainbowKit funcionan apuntando al RPC.
- **Conclusión buildability:** stack 100% estándar-EVM. Cero fricción de aprendizaje nuevo — la palanca es la red, no el toolchain.

## 3. Landscape de hackatones 2026 (qué premia Monad)

| Evento | Fecha | Premio | Foco |
|--------|-------|--------|------|
| evm/accathon (inaugural) | ETHDenver feb-2025 (cerrado) | $100k+ + $30k grants | AI/DeFi/NFTs&Gaming/Tooling/Consumer&Social |
| Rebel in Paradise | 19-ene → 28-feb 2026 | $40k | **Agent-native Payments / Intelligent Markets / Agent-powered Apps** |
| Moltiverse | 2 semanas (2026) | $200k | **Agentes autónomos transaccionando** (agent+token vía nad.fun / agent track) |
| Nitro (accelerator) | 3mo, cerró 14-mar-2026 | $500k VC | Cualquier chain |
| **Monad Blitz** | **40+ ediciones; 6-jun-2026 Lisboa + Medellín, 7-jun India** | varía | **One-day "vibe-coding" — ship fast** |

- **Patrón dominante 2026:** Monad empuja fuerte la **economía de agentes / AI on-chain** — agentes autónomos que transaccionan, pagos agent-native, mercados inteligentes, high-frequency finance, agent-to-agent commerce, gaming/wagering, token launches vía nad.fun. Es el ángulo de narrativa + leverage que el jurado de Monad recompensa hoy.
- **Ganadores AI hackathon (Rebel in Paradise, 11 proyectos):** OpenAlice (trading agent platform, grand prize — agente de transacciones corrible localmente, estrategia transparente en MD/JSON), Orbit AI (decentralized AI cloud), Anime AI Studio. — phemex/kucoin.

## 4. Implicancia para el frame

- **Monad-leverage real (eje 1):** casos que **mueren a alto gas / block time lento en otra EVM y reviven con 10k TPS + ~$0.005 gas + 400ms**: micro-transacciones masivas, agentes que firman muchas tx, on-chain games/wagering en tiempo casi-real, order books / intelligent markets on-chain, micropagos agent-to-agent.
- **Buildability (eje 2) depende del hackatón:** Moltiverse = 2 semanas; Monad Blitz = **1 DÍA**. **Pendiente confirmar cuál es el de Ramiro** — calibra todo el scope. Medellín 6-jun (LatAm) es candidato plausible.
- **Narrativa/fit (eje 4):** si el evento sigue la línea 2026, una idea de **agente que transacciona on-chain** maximiza fit con lo que Monad quiere mostrar.

## Fuentes

- [Network Information — Monad Docs](https://docs.monad.xyz/developer-essentials/network-information)
- [Monad for Developers — Docs](https://docs.monad.xyz/introduction/monad-for-developers)
- [Deploy con Foundry — Docs](https://docs.monad.xyz/getting-started/deploy-smart-contract/foundry)
- [Monad — sitio oficial (specs)](https://www.monad.xyz/)
- [evm/accathon](https://hackathon.monad.xyz/)
- [Monad AI Hackathon — 11 winners (Phemex)](https://phemex.com/news/article/monad-ai-hackathon-concludes-with-11-winning-projects-and-major-partnerships-69096)
- [Monad builder economy (Everstake)](https://everstake.one/resources/blog/monad-ignites-the-builder-economy-hackathons-ai-and-a-3-month-accelerator)
- [What is Monad (CoinGecko)](https://www.coingecko.com/learn/what-is-monad-crypto)
- [Monad Blitz NYC/Medellín/Lisboa (Luma)](https://luma.com/blitz-nyc-june-2026)

## Related

- [[monad_tech]]
- [[evaluation_frame]]
- [[workflow]]

---

**Status:** processed
**Last Updated:** 2026-05-30
